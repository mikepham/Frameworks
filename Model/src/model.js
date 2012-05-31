(function() {

    /// <summary>
    /// This is a special import that checks if we are running in a NodeJS environment or
    /// running within a browser.
    /// </summary>
    var exports = (typeof module === 'undefined') ? ((typeof window === 'undefined') ? {} : window) : module.exports;

    var ModelClass = {};

    Model.ModelClass = ModelClass;

    exports.Model = Model;

})();
