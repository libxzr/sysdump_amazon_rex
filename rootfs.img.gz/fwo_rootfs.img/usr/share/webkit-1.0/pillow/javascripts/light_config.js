/*
 * light_config.js
 *
 * Copyright 2012 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

var LightConfig = [
    { min:  0, max:  0, id: 'off' },
    { min:  1, max:  1, id: 'sunlight' },
    { min:  2, max:  5, id: 'darkRoom' },
    { min:  6, max: 11, id: 'dimRoom' },
    { min: 12, max: 20, id: 'brightRoom' },
    { min: 21, max: 25, id: 'overcast' },
];

var LightPresets = {
    high: 21,
    low: 3
};

