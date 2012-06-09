(function() {

    /// <summary>
    /// This is a special import that checks if we are running in a NodeJS environment or
    /// running within a browser.
    /// </summary>
    var API = (typeof module !== 'undefined') ? module.exports : this.API || (this.API = {});

    API.Application = API.Factory.BaseObject.extend(function Application() {
        var self = this;

        return {};
    });

})();
