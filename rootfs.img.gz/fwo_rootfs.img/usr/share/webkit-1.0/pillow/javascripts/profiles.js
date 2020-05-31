/*
 * profiles.js
 *
 * Copyright 2012 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

/**
 * This is the profile manager class.
 *
 * A profile is an object that describes a configuration of a pillow case.
 *
 *
 * THE STRUCTURE OF A PROFILE
 *
 * A profile can be pretty much any object, with two restrictions:
 *
 * 1. No cyclic references. The profile manager doesn't attempt to enforce this property.
 *    As long as all profiles are either object literals or parsed from JSON, you won't
 *    end up with cyclic references.
 *
 * 2. Arrays inside a profile must be either:
 * 
 *    a. Entirely full of scalars (strings, numbers, and Booleans).
 *    b. Entirely full of objects, each of which has an "id" property with a string value.
 *
 *    Note that this means arrays may not contain nulls or other arrays.
 *
 * 3. If the profile has a "base" or "name" property at the top level, the value of that
 *    property must be a string. A profile may not have both a "base" property and a "name"
 *    property. (These are effectively two alternate names for the same property; "name" is
 *    deprecated but allowed for compatibility.)
 *
 * 
 * EXAMPLE
 *
 * Let's say that this is the default profile:
 *
 * { foo: 3, obj: { a: 1, b: 2 } }
 *
 * Let's also say that there are two other stored profiles:
 *
 * prof_a: { foo: 4, bar: 5, obj: { b: 3 } }
 *
 * prof_b: { base: 'prof_a', foo: 2 }
 *
 *
 * THE PROFILE HEIRARCHY
 *
 * A pillow case's profiles exist in a heirarchy. The heirarchy is a tree, and the root of
 * the tree is called the "default" profile. Most of a profile manager's methods will not
 * work until it has been given a default profile with the setDefaultProfile method.
 *
 * If a profile has a "base" property at the top level, its value must be the name of another
 * profile. The base references of the profiles define the heirarchy. Creating a loop of base
 * references is forbidden.
 *
 * In our example, the heirarchy is: default <- prof_a <- prof_b.
 *
 * 
 * THE PROFILE MANAGER
 *
 * The purpose of the profile manager is to hide the details of managing the profile heirarchy.
 * All that a pillow case really cares about is the configuration it should be in *right now*.
 * To change the configuration of a pillow case, call applyProfile on the profile manager and
 * supply a profile object. Note that the profile object you supply to this call is anonymous:
 * it isn't stored anywhere, so it doesn't have a name. It may, however, have a base reference
 * which does refer to a stored profile.
 *
 * When you call applyProfile, the profile manager takes the argument and *flattens* it.
 * A flattened profile has the same "meaning" as the original profile, but it doesn't have a
 * base reference. This is accomplished by starting with the base profile and merging in all
 * of the differences in the child profile. The resulting flattened profile is sent as the
 * argument to the applyProfileCallback function.
 *
 * Example:
 *
 * applyProfile({ base: 'prof_a', bar: 6 });
 * ----> applyProfileCallback({ foo: 4, bar: 6, obj: { a: 1, b: 3 } })
 *
 * applyProfile({ base: 'prof_b' })
 * ----> applyProfileCallback({ foo: 2, bar: 5, obj: { a: 1, b: 3 } })
 *
 * 
 * THE PROFILE FLATTENING ALGORITHM
 *
 * 1. Get the profile chain. This is an array of the entire profile ancestry of the argument profile.
 *    Thus, the first element in this array is always the default profile.
 *
 * 2. Make an empty object that will become the result.
 *
 * 3. For each profile in the chain array, merge that profile in to the result.
 */
Pillow.ProfileManager = function(userOptions) {

    const DEFAULT_OPTIONS = {
        applyProfileCallback: function(profile) { },
        getAppIdCallback: function() { return ''; }
    };

    var options = {};

    if (!userOptions) {
        userOptions = {};
    }

    for (var option in DEFAULT_OPTIONS) {
        if (userOptions.hasOwnProperty(option)) {
            options[option] = userOptions[option];
        } else {
            options[option] = DEFAULT_OPTIONS[option];
        }
    }

    const DEFAULT_PROFILE_NAME = 'default';

    var defaultProfile = null;

    var systemProfiles = {};

    var appProfiles = {};

    var findProfile = function(appId, name) {
        if (name === DEFAULT_PROFILE_NAME) {
            return defaultProfile;
        } else if (appProfiles.hasOwnProperty(appId) && appProfiles[appId].hasOwnProperty(name)) {
            return appProfiles[appId][name];
        } else if (systemProfiles.hasOwnProperty(name)) {
            return systemProfiles[name];
        } else {
            return null;
        }
    };

    var getProfileChain = function(appId, last) {
        if (defaultProfile == null) {
            Pillow.logWarn('pillow-profmgr-not-ready');
            return null;
        }
        var bases = [];
        var cur = last;
        while (cur) {
            bases.unshift(cur);
            if (cur === defaultProfile) {
                return bases;
            } else {
                cur = findProfile(appId, cur.base || cur.name || DEFAULT_PROFILE_NAME);
            }
        }
        // error: there was an invalid base profile reference
        return null;
    };

    const NULL   = 0;
    const SCALAR = 1;
    const OBJECT = 2;
    const ARRAY  = 3;

    var category = function(value) {
        if (value == null) {
            return NULL;
        } else if (typeof(value) === 'object') {
            if (value instanceof Array) {
                return ARRAY;
            } else {
                return OBJECT;
            }
        } else {
            return SCALAR;
        }
    };

    /**
     * Merge the entire structure of "from" into "to", without destroying any
     * part of the existing structure of "to".
     *
     * The operation will fail if any value from one category (scalar, array,
     * or object) would overwrite a value from another category.
     *
     * Any value can overwrite a null, and a null can overwrite any value.
     *
     * When merging arrays, if the array contains objects, those objects must
     * each have a scalar "id" property, and they will be merged by strict
     * equality on that property. If the arrays contain scalars, values which
     * do not appear in the "to" array will be appended to it in the order
     * those values appear in the "from" array.
     *
     * An array may not contain nulls or other arrays.
     *
     * @param to    A non-recursive object
     * @param from  A non-recursive object
     * @param path  A string, used for reporting the location of an error
     * @return      True if the operation succeeded
     */
    var merge = function(to, from, path) {
        // Pillow.logInfo('pillow-profmgr-merge', {to: JSON.stringify(to), from: JSON.stringify(from), path: path});
        for (var i in from) {
            var toCat = category(to[i]);
            var fromCat = category(from[i]);
            if (toCat && fromCat && toCat !== fromCat) {
                Pillow.logWarn('pillow-profmgr-merge-mismatch', {path: path, key: i, toCat: toCat, fromCat: fromCat});
                return false;
            }
            if (fromCat === OBJECT) {
                if (toCat === NULL) {
                    to[i] = {};
                }
                if (!merge(to[i], from[i], path + '.' + i)) {
                    return false;
                }
            } else if (fromCat === ARRAY) {
                if (toCat === NULL) {
                    to[i] = [];
                }
                if (from[i].length == 0) {
                    continue;
                }
                if (to[i].length == 0) {
                    for (var fromIndex in from[i]) {
                        to[i].push(from[i][fromIndex]);
                    }
                } else {
                    var toElemCat = category(to[i][0]);
                    if (toElemCat === ARRAY || toElemCat === NULL) {
                        Pillow.logWarn('pillow-profmgr-merge-array', {path: path, key: i, toElemCat: toElemCat});
                        return false;
                    }
                    if (toElemCat === SCALAR) {
                        for (var fromIndex in from[i]) {
                            var fromElem = from[i][fromIndex];
                            var fromElemCat = category(fromElem);
                            if (fromElemCat !== SCALAR) {
                                Pillow.logWarn('pillow-profmgr-merge-array', {path: path, key: i, fromElemCat: fromElemCat, toElemCat: toElemCat});
                                return false;
                            }
                            if (to[i].indexOf(fromElem) == -1) {
                                to[i].push(fromElem);
                            }
                        }
                    } else {
                        for (var fromIndex in from[i]) {
                            var fromElem = from[i][fromIndex];
                            var fromElemCat = category(fromElem);
                            if (fromElemCat !== OBJECT) {
                                Pillow.logWarn('pillow-profmgr-merge-array', {path: path, key: i, fromElemCat: fromElemCat, toElemCat: toElemCat});
                                return false;
                            }
                            if (!fromElem.hasOwnProperty('id')) {
                                Pillow.logWarn('pillow-profmgr-merge-no-id', {path: path, key: i, which: 'from', index: fromIndex});
                                return false;
                            }
                            var found = false;
                            for (var toIndex in to[i]) {
                                var toElem = to[i][toIndex];
                                if (toElem.id === fromElem.id) {
                                    found = true;
                                    if (!merge(toElem, fromElem, path + '.' + i + '[' + toIndex + ']')) {
                                        return false;
                                    }
                                    break;
                                }
                            }
                            if (!found) {
                                var newToElem = {};
                                if (!merge(newToElem, fromElem, path + '.' + i + '[' + to[i].length + ']')) {
                                    return false;
                                }
                                to[i].push(newToElem);
                            }
                        }
                    }
                }
            } else {
                to[i] = from[i];
            }
        }
        // Pillow.logInfo('pillow-profmgr-merge-ok', {to: JSON.stringify(to)});
        return true;
    };

    /**
     * @method setDefaultProfile
     * @param profile  The details of the default profile
     */
    this.setDefaultProfile = function(profile) {
        defaultProfile = profile;
    };

    /**
     * @method addSystemProfile
     * @param name  The name of the system profile
     * @param profile  The details of the system profile
     */
    this.addSystemProfile = function(name, profile) {
        if (name === DEFAULT_PROFILE_NAME) {
            Pillow.logWarn('pillow-profmgr-invalid-name', {name: name});
        } else {
            systemProfiles[name] = profile;
        }
    };

    /**
     * @method addAppProfile
     * @param appId  The application ID
     * @param name  The name of the app profile
     * @param profile  The details of the app profile
     */
    this.addAppProfile = function(appId, name, profile) {
        if (name === DEFAULT_PROFILE_NAME) {
            Pillow.logWarn('pillow-profmgr-invalid-name', {name: name});
        } else {
            if (!appProfiles.hasOwnProperty(appId)) {
                appProfiles[appId] = {};
            }
            appProfiles[appId][name] = profile;
        }
    };

    /**
     * @method resolveProfile
     * @param appId    The app whose profiles should be used
     * @param profile  The profile details, which may include a base profile reference
     * @return  A complete, flattened profile without a base profile reference, or null
     */
    this.resolveProfile = function(appId, profile) {
        var chain = getProfileChain(appId, profile);
        if (chain == null || chain.length == 0) {
            return null;
        }
        var result = {};
        for (var i in chain) {
            if (!merge(result, chain[i], String(i))) {
                return null;
            }
        }
        delete result.base;
        delete result.name;
        return result;
    };

    this.applyProfile = function(profile) {
        options.applyProfileCallback.call(null, this.resolveProfile(options.getAppIdCallback(), profile));
    };

    this.applyDefaultProfile = function() {
        this.applyProfile(defaultProfile);
    };
};

