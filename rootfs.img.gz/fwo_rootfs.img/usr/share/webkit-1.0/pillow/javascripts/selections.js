/**
 * selections.js
 *
 * Copyright 2012 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

var Selections = {};

/**
 * @method create  Create a selection manager
 * @param items    (Array) The menu items
 * @param mode     (String) The selection mode: "none", "one", or "many" (default "none")
 * @param initial  The initially-selected IDs (varies by mode; see mode-specific classes)
 *
 * This method is a factory for selection managers. A selection manager keeps
 * track of which menu items are selected according to some rules.
 *
 * We don't have a mechanism for making abstract base classes in JavaScript,
 * so look at Selections.None for the selection manager method documentation.
 */
Selections.create = function(items, mode, initial) {
    if (mode === 'many') {
        return new Selections.Many(items, initial);
    } else if (mode === 'one') {
        return new Selections.One(items, initial);
    } else {
        return new Selections.None(items, initial);
    }
};

/**
 * @class Selections.None  A selection manager for when nothing is ever selected
 * @param items    Ignored
 * @param initial  Ignored
 */
Selections.None = function(items, initial) {

    /**
     * @method itemTapped  Update state based on a tap from the user
     * @param item  The item object that was tapped
     * @return  A list of item objects which should be re-rendered
     */
    this.itemTapped = function(item) {
        // don't re-render any items
        return [];
    };

    /**
     * @method updateItemIcons  Update the icon in each item according to its current state
     * @param items             (Array) The items
     */
    this.updateItemIcons = function(items) {
        if (items) {
            for (var i in items) {
                items[i].icon = null;
            }
        }
    };

    /**
     * @method showIcons  Find out if icons should be shown in the menu at all
     * @return  True if icons should be shown in the menu
     */
    this.showIcons = function() {
        return false;
    };

    /**
     * @method getSelectionString  Return a string describing the selection
     * @return  A string describing the selection
     */
    this.getSelectionString = function() {
        return null;
    };
};

/**
 * @class Selections.One  A selection manager for when only one thing (at most) is selected
 * @param items    (Array) The menu items
 * @param initial  (String or Selections.One) The initially-selected item ID, or another Selections.One
 *                 to copy the selected ID from
 */
Selections.One = function(items, initial) {
    var selection = null;
    if (initial instanceof Selections.One) {
        var oldSelection = initial.getSelection();
        initial = oldSelection ? oldSelection.id : null;
    }
    if (initial) {
        // convert initial item ID into item object
        for (var i in items) {
            var item = items[i];
            if (item && item.id && item.id === initial) {
                selection = item;
            }
        }
    }

    this.itemTapped = function(item) {
        if (item && item.id) {
            var oldSelection = selection;
            selection = item;
            selection.icon = 'check';
            if (oldSelection && oldSelection !== selection) {
                oldSelection.icon = null;
                return [oldSelection, selection];
            } else {
                return [selection];
            }
        } else {
            return [];
        }
    };

    this.updateItemIcons = function(items) {
        if (items) {
            for (var i in items) {
                var item = items[i];
                if (selection && item.id && item.id === selection.id) {
                    item.icon = 'check';
                } else {
                    item.icon = null;
                }
            }
        }
    };

    this.showIcons = function() {
        return true;
    };

    this.getSelection = function() {
        return selection;
    };

    this.getSelectionString = function() {
        return selection ? selection.id : null;
    };
};

/**
 * @class Selections.Many  A selection manager for when any number of things can be selected
 * @param items    (Array) The menu items
 * @param initial  (Array[String] or Selections.Many) The item IDs of the initially-selected items,
 *                 or another Selections.Many object to copy the selected IDs from
 */
Selections.Many = function(items, initial) {
    var selection = {};
    if (initial instanceof Selections.Many) {
        var oldSelection = initial.getSelection();
        if (oldSelection) {
            initial = [];
            for (var i in oldSelection) {
                initial.push(oldSelection[i].id);
            }
        } else {
            initial = null;
        }
    }
    if (initial instanceof Array) {
        // convert initial list of item IDs into item objects
        for (var i in initial) {
            var id = initial[i];
            if (id) {
                for (var j in items) {
                    var item = items[j];
                    if (item && item.id && item.id === id) {
                        selection[id] = item;
                    }
                }
            }
        }
    }

    this.itemTapped = function(item) {
        if (item && item.id) {
            var id = item.id;
            if (selection[id]) {
                delete selection[id];
                item.icon = null;
            } else {
                selection[id] = item;
                item.icon = 'check';
            }
            return [item];
        }
        return [];
    };

    this.updateItemIcons = function(items) {
        for (var i in items) {
            var item = items[i];
            if (item.id && selection[item.id]) {
                item.icon = 'check';
            } else {
                item.icon = null;
            }
        }
    };

    this.showIcons = function() {
        return true;
    };

    this.getSelection = function() {
        var ret = [];
        for (var i in selection) {
            ret.push(selection[i]);
        }
        return ret;
    };

    this.getSelectionString = function() {
        var ret = [];
        for (var i in selection) {
            ret.push(selection[i].id);
        }
        return JSON.stringify(ret);
    };
};

