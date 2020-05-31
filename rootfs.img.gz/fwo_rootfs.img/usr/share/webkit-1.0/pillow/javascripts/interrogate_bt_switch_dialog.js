
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
	Test.addButtonBarButtons('btswitch_', 'BtSwitchCmdBar');
	Test.addWidget('bt_switch_title', new Test.AlertTitleWidget(document.getElementById('btSwitchTitleText')));
	Test.addWidget('switch_close', new LocalTest.CloseButtonWidget('btSwitchCancelButton'));
	Test.addWidget('bt_switch_text', new Test.HtmlTextContent(document.getElementById('btSwitchDialogText')));
        
    };
	
    LocalTest.parseOkay = true;
    LocalTest.isParsed = function() {
        return LocalTest.parseOkay;
    };
})();

