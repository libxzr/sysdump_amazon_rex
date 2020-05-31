
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
        
        Test.addButtonBarButtons('bt_', 'BtForgetCmdBar');
	Test.addWidget('forget_close', new LocalTest.CloseButtonWidget('btForgetCancelButton'));
	Test.addWidget('bt_forget_title', new Test.AlertTitleWidget(document.getElementById('btForgetTitleText')));
	Test.addWidget('bt_forget_text', new Test.HtmlTextContent(document.getElementById('btForgetDialogText')));
        
    };
	
    LocalTest.parseOkay = true;
    LocalTest.isParsed = function() {
        return LocalTest.parseOkay;
    };
})();

