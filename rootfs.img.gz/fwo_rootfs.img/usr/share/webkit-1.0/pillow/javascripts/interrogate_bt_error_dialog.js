
window.LocalTest = {};

/**
 * Private context for LocalTest module
 */
(function() {

    LocalTest.init = function() {
        Test.addButtonBarButtons('bt_', 'BtErrorCmdBar');
	    Test.addWidget('bt_error_title', new Test.AlertTitleWidget(document.getElementById('btErrorTitleText')));
	    Test.addWidget('bt_error_text', new Test.HtmlTextContent(document.getElementById('btErrorDialogText')));
    };
    LocalTest.parseOkay = true;
    LocalTest.isParsed = function() {
        return LocalTest.parseOkay;
    };
})();

