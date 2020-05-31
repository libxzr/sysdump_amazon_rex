/*
 * interrogate_bt_passkey_comparison_dialog.js
 *
 * Copyright (c) 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

window.LocalTest = {};

/**
 * Private context for LocalTest module
 */
(function() {

    LocalTest.CloseButtonWidget = function(elem) {
        Test.HtmlCloseButtonWidget.call(this, elem);

        this.getValue = function() {
            return BTAccessibilityStringTable.close;
        };
    };

    LocalTest.init = function() {
        Test.addButtonBarButtons('bt_', 'btPasskeyComparisonCmdBar');
        Test.addWidget('passkey_comparison_close',
                new LocalTest.CloseButtonWidget(
                        'btPasskeyComparisonCancelButton'));
        Test.addWidget('bt_passkey_comparison_title',
                new Test.AlertTitleWidget(document
                        .getElementById('btPasskeyComparisonTitleText')));
        Test.addWidget('bt_passkey_comparison_text', new Test.HtmlTextContent(
                document.getElementById('btPasskeyComparisonDialogText')));
    };

    LocalTest.parseOkay = true;
    LocalTest.isParsed = function() {
        return LocalTest.parseOkay;
    };
})();
