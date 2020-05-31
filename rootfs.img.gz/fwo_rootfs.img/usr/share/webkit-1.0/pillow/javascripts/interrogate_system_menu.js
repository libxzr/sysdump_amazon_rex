
window.LocalTest = {};

/**
 * Private context for LocalTest module
 */
(function() {

    LocalTest.init = function() {
        Test.addMenuItems('item_', 'items');
    };

    LocalTest.parseOkay = true;
    LocalTest.isParsed = function() {
        return LocalTest.parseOkay;
    };
})();
