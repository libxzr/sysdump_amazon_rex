
window.LocalTest = {};

/**
 * Private context for LocalTest module
 */
(function() {

    LocalTest.init = function() {
        
        Test.addButtonBarButtons('wl_', 'wifiLockerCmdBar');
	Test.addWidget('wl_legal_title', new Test.AlertTitleWidget(document.getElementById('WLFAQHeader')));
	Test.addWidget('wl_legal_text', new Test.HtmlTextContent(document.getElementById('wifilockerScrollContainer')));
        
    };
	
    LocalTest.parseOkay = true;
    LocalTest.isParsed = function() {
        return LocalTest.parseOkay;
    };
})();

