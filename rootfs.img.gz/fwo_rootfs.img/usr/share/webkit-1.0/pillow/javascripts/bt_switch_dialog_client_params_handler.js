/*
 * bt_switch_client_params_handler.js
 *
 * Copyright (c) 2016-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */


/**
 * Constructs a clientParams handler for the ConfigureLogLevel dialog.
 * @class Handles all the incoming clientParams information.  Each method
 *        handles a different incoming parameter.
 * @extends Pillow.ClientParamsHandler
 * @param {Pillow.Case} pillowCase Pass in the Pillow.Case we should dispatch to
 */
Pillow.BtSwitchDialog.ClientParamsHandler = function (pillowCase) {
    var parent = Pillow.extend(this, new Pillow.ClientParamsHandler());

    this.show = function (clientParams) {
        pillowCase.show();
    };

    this.hide = function (clientParams) {
        pillowCase.hide();
    };

    this.close = function (clientParams) {
        pillowCase.close();
    };
    this.processBtInfo = function (clientParams) {
        pillowCase.initUI(clientParams.processBtInfo);
    };

    this.windowDeleteEvent = function (clientParams) {
        pillowCase.close();
    };

    this.windowDestroyEvent = function (clientParams) {
        pillowCase.close();
    };

    Pillow.logWrapObject('Pillow.BtSwitchDialog.ClientParamsHandler', this);
};
