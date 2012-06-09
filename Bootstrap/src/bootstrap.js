(function() {

    /// <summary>
    /// This is a special import that checks if we are running in a NodeJS environment or
    /// running within a browser.
    /// </summary>
    var API = (typeof module !== 'undefined') ? module.exports : this.API || (this.API = {});

    var Helpers = {};

    Helpers.hashKeys = function hashKeys(obj) {
        var result = [];

        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                result.push(key);
            }
        }

        return result.sort();
    };

    Helpers.uriEscape = function uriEscape(source) {
        return source;
    };

    Helpers.uriUnescape = function uriUnescape(source) {
        return source;
    };

    var Uri = API.Uri = function Uri(url) {
        var self = this;

        var merge = function merge(base, relativePath) {
            var dirName = /^(.*)\//;

            if (base.authority && !base.path) {
                return '/' + relativePath;
            } else {
                return base.path().match(dirName)[0] + relativePath;
            }
        };

        var regexFindDoubleDots = /\/((?!\.\.\/)[^\/]*)\/\.\.\//;

        var removeDotSegments = function removeDotSegments(path) {
            if (!path) {
                return '';
            }

            var newPath = path.replace(/\/\.\//g, '/').replace(/\/\.$/, '/');

            while (newPath.match(regexFindDoubleDots)) {
                newPath = newPath.replace(regexFindDoubleDots, '/');
            }

            newPath = newPath.replace(/\/([^\/]*)\/\.\.$/, '/');

            while (newPath.match(/\/\.\.\//)) {
                newPath = newPath.replace(/\/\.\.\//, '/');
            }

            return newPath;
        };

        if (!url) {
            url = '';
        }

        var parser = /^(?:([^:\/?\#]+):)?(?:\/\/([^\/?\#]*))?([^?\#]*)(?:\?([^\#]*))?(?:\#(.*))?/;
        var result = url.match(parser);

        var context = {
            scheme: result[1] || null,
            authority: result[2] || null,
            path: result[3] || null,
            query: result[4] || null,
            fragment: result[5] || null
        };

        self.context = function() {
            return context;
        };

        // Properties

        self.authority = function authority(value) {
            if (typeof value === 'undefined') {
                return context.authority;
            }

            return (context.authority = value);
        };

        self.fragment = function fragment(value) {
            if (typeof value === 'undefined') {
                return context.fragment;
            }

            return (context.fragment = value);
        };

        self.path = function path(value) {
            if (typeof value === 'undefined') {
                return context.path;
            }

            return (context.path = value);
        };

        self.query = function query(value) {
            if (typeof value === 'undefined') {
                return UriQuery.parse(context.query);
            }

            return UriQuery.parse(context.query = value);
        };

        self.scheme = function scheme(value) {
            if (typeof value === 'undefined') {
                return context.scheme;
            }

            return (context.scheme = value);
        };

        // Methods

        self.resolve = function resolve(base) {
            var source = base ? base.path ? base : new Uri(base) : new Uri(window.location.href);

            var target = new Uri();

            if (self.scheme()) {
                target.scheme(self.scheme());
                target.authority(self.authority());
                target.path(removeDotSegments(self.path()));
                target.query(self.query());
            } else {
                if (self.authority()) {
                    target.authority(self.authority());
                    target.path(removeDotSegments(self.path()));
                    target.query(self.query());
                } else {
                    if (!self.path()) {
                        target.path(source.path());

                        if (self.query()) {
                            target.query(self.query());
                        } else {
                            target.query(source.query());
                        }
                    } else {
                        if (self.path().charAt(0) === '/') {
                            target.path(removeDotSegments(self.path()));
                        } else {
                            target.path(merge(source, self.path()));
                            target.path(removeDotSegments(target.path()));
                        }

                        target.query(self.query().toString());
                    }

                    target.authority(source.authority());
                }

                target.scheme(source.scheme());
            }

            target.fragment(self.fragment());

            return target;
        };

        self.toString = function toString() {
            var result = '';

            var uri = {
                scheme: self.scheme(),
                authority: self.authority(),
                path: self.path(),
                query: self.query().toString(),
                fragment: self.fragment()
            };

            if (uri.scheme) {
                result += uri.scheme + '://';
            }

            if (uri.authority) {
                result += uri.authority;
            }

            if (uri.path) {
                result += uri.path;
            }

            if (uri.query) {
                result += '?' + uri.query;
                console.log(uri.query);
            }

            if (uri.fragment) {
                result += '#' + uri.fragment;
            }

            return result;
        };
    };

    Uri.parse = function parse(url, baseUrl) {
        return new Uri(url).resolve(baseUrl);
    };

    var UriQuery = function UriQuery() {
        var self = this;

        var context = {
            params: {},
            separator: '&'
        };

        // Properties

        self.separator = function separator(value) {
            if (typeof value === 'undefined') {
                return context.separator;
            }

            return (context.separator = value);
        };

        // Methods

        self.addStringParams = function addStringParams(source) {
            var kvp = source.split(this.separator);

            var list, key, value;

            for (var i=0; i < kvp.length; i++) {
                list = kvp[i].split('=', 2);
                key = Helpers.uriUnescape(list[0].replace(/\+/g, ' '));
                value = Helpers.uriUnescape(list[1].replace(/\+/g, ' '));

                if (!context.params.hasOwnProperty(key)) {
                    context.params[key] = [];
                }

                context.params[key].push(value);
            }
        };

        self.param = function param(paramName) {
            if (context.params.hasOwnProperty(paramName)) {
                return context.params[paramName][0];
            }

            return null;
        };

        self.toString = function toString() {
            var kvp = [];
            var keys = Helpers.hashKeys(context.params);

            for (var ik=0; ik < keys.length; ik++) {
                for (var ip=0; ip < context.params[keys[ik]].length; ip++) {
                    kvp.push(keys[ik].replace(/ /g, '+') + '=' + context.params[keys[ik]][ip].replace(/ /g, '+'));
                }
            }

            return kvp.join(context.separator);
        };
    };

    UriQuery.parse = function parse(source, separator) {
        var query = new UriQuery();

        if (separator) {
            query.separator(separator);
        }

        if (source) {
            query.addStringParams(source);
        }

        return query;
    };

    var BrowserScriptLoader = function BrowserScriptLoader() {
        var scripts = {};

        var urlToKey = function urlToKey(url) {
            return url.replace(/[\/|\.\.\/]+/g, '').replace(/[^a-zA-Z0-9]+/g, '_');
        };

        var injectScript = function injectScript(script, callback) {
            var document = window.document;
            var head = document.getElementsByTagName('HEAD').item(0);
            var body = document.body;

            if (script.state !== ScriptStates.Completed) {
                var element = script.element = document.createElement('script');
                element.type = 'text/' + (script.type || 'javascript');
                element.src = script.url;
                element.async = false;

                var state = element.readyState;

                element.onreadystatechange = element.onload = (function(script) {
                    return function() {
                        script.state = ScriptStates.Completed;

                        if (callback && !callback.done && (!state || /loaded|complete/.test(state))) {
                            callback.done = true;
                            callback.apply(API, [API]);
                        }
                    }
                })(script);

                (body || head).appendChild(element);
            }
        };

        var scriptsLoaded = function scriptsLoaded() {
            for (var key in scripts) {
                if (scripts.hasOwnProperty(key)) {
                    if (scripts[key].state !== ScriptStates.Completed) {
                        return false;
                    }
                }
            }

            return true;
        };

        /// #region Interface Members

        this.defaultPath = function defaultPath() {
            var L = window.location;

            return L.href.replace(L.protocol + '//', '').replace(L.pathname, '');
        };

        this.load = function load(url, callback) {
            if (typeof url === 'undefined' || url === '' || url === null) {
                return;
            }

            var key = urlToKey(url);
            var script = scripts[key];

            if (!script) {
                script = scripts[key] = {
                    id: key,
                    url: url,
                    state: ScriptStates.Loading
                };
            }

            var self = this;

            injectScript(script, function(api) {
                if (callback) {
                    if (scriptsLoaded()) {
                        callback.apply(self, [api]);

                    }
                }
            });
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

    var ScriptLoaderFactory = {
        create: function create() {
            if (typeof require === 'function') {
                return new NodeJsScriptLoader();
            }

            if (window.API) {
                return new BrowserScriptLoader();
            }

            throw new Error('Could not create the proper script loader.');
        }
    };

    var ScriptStates = {
        None: 0,
        Loading: 1,
        Completed: 2
    };

    var Bootstrap = API.Bootstrap = (function() {
        var self = this;

        var loader = ScriptLoaderFactory.create();

        var context = {
            basePath: loader.defaultPath(),
            scriptCount: 0
        };

        return {
            basePath: function basePath(path) {
                if (typeof path === 'undefined') {
                    return context.basePath;
                }

                context.basePath = path;
            },
            inject: function inject(options, callback) {
                for (var key in options) {
                    if (options.hasOwnProperty(key)) {
                        var value = options[key];

                        if (key === 'scripts') {
                            this.inject(value, callback);
                        } else if (key === 'basePath') {
                            this.basePath(Uri.parse(value).toString());
                        } else if (typeof value === 'string') {
                            this.use(Uri.parse(value, this.basePath()).toString(), callback);
                        }
                    }
                }
            },
            use: function use(url, callback) {
                return loader.load(url, callback);
            }
        };
    })();

    Bootstrap.ScriptStates = ScriptStates;

})();
