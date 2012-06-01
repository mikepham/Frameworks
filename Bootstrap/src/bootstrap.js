(function() {

    var exports = (typeof module !== 'undefined') ? module.exports : window.API || (window.API = {});

    var BrowserScriptLoader = function BrowserScriptLoader() {
        var scripts = {};

        var urlToKey = function filenameToKey(url) {
            return url.replace(/[^a-z0-9]+/g, '_');
        };

        var injectScript = function injectScript(script) {
            if (script.state === ScriptStates.Completed) {
            }
        };

        /// #region Interface Members

        this.defaultPath = function defaultPath() {
            return window.document.location.hostname;
        };

        this.load = function load(url, callback) {
            var key = urlToKey(url);

            if (!scripts[key]) {
                scripts[key] = {
                    id: key,
                    url: url,
                    state: ScriptStates.Loading
                };
            }

            injectScript(scripts[key]);
        };

        /// #endregion Interface Members
    };

    var NodeJsScriptLoader = function NodeJsScriptLoader() {
        this.defaultPath = function defaultPath() {
            return process.cwd();
        };

        this.load = function load(url, callback) {
            return callback ? callback.apply(this, [require(url)]) : require(url);
        };
    };

    var CreateScriptLoader = function CreateScriptLoader() {
        if (typeof require === 'function') {
            return new NodeJsScriptLoader();
        }

        if (window.API) {
            return new BrowserScriptLoader();
        }

        throw new Error('Could not create the proper script loader.');
    };

    var ScriptStates = {
        None: 0,
        Loading: 1,
        Completed: 2
    };

    var BootStrap = (function() {
        var loader = CreateScriptLoader();

        var context = {
            path: loader.defaultPath()
        };

        return {
            use: function use(url, callback) {
                return loader.load(url, callback);
            }
        };
    })();

    BootStrap.ScriptStates = ScriptStates;

    exports.BootStrap = BootStrap;

})();
