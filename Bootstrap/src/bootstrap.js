(function() {

    var Browser = {
        install: function install() {
            var exports = function exports(key) {
                window.ENV.exports = (window.ENV.exports || {});

                return (window.ENV.exports[key] || (window.ENV.exports[key] = {}));
            };

            return window.ENV = {
                name: 'browser',
                register: function register(key) {
                },
                resolve: function resolve(url, key, callback) {
                    var self = this;
                    var head = document.getElementsByTagName('head')[0];

                    var script = document.createElement('script');
                    script.type = 'text/javascript';

                    var cleanup = function cleanup() {
                        head.removeChild(script);
                    };

                    if (script.readyState) {
                        script.onreadystatechange = function(){
                            if (script.readyState == 'loaded' ||
                                script.readyState == 'complete'){
                                script.onreadystatechange = null;

                                callback.apply(self, [exports(key)]);
                                cleanup();
                            }
                        };
                    } else {
                        script.onload = function(){
                            callback.apply(self, [exports(key)]);
                            cleanup();
                        };
                    }

                    script.src = url;
                    head.appendChild(script);

                    setTimeout(function() { cleanup(); }, 1000);
                }
            };
        },
        isRunning: function isRunning() {
            return (typeof window !== 'undefined');
        }
    };

    var NodeJS = {
        install: function install() {
            module.exports.ENV = {
                name: 'nodejs',
                resolve: function resolve(url, key, callback) {
                    return callback.apply(this, [require(url)]);
                }
            }
        },
        isRunning: function isRunning() {
            return (typeof module !== 'undefined' && typeof require === 'function');
        }
    };

    var Environments = [Browser, NodeJS];

    for (var i=0; i < Environments.length; i++) {
        var environment = Environments[i];

        if (environment.isRunning()) {
            return environment.install();
        }
    }

})();
