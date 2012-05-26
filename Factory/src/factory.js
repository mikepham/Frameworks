(function() {

    var exports = (typeof module === 'undefined') ? ((typeof window === 'undefined') ? {} : window) : module.exports;

    var Exceptions = {
        InvalidArgumentType: function(expected, actual) {
            return new Error('Expected: ' + expected.toString() + ', but got: ' + actual.toString() + '.');
        },
        InvalidInitType: function() {
            return new Error('Init must be a valid function.');
        },
        MissingConstructor: function() {
            return new Error('You must provide a named constructor function.');
        },
        MissingConstructorName: function() {
            return new Error('Cannot use anonymous functions. You must provide a named function.');
        }
    };

    if (!String.prototype.trim) {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/g,'');
        };
    }

    var NamespaceManager = (function() {
        var namespaces = {};

        return {
            define: function define(namespace, type) {
                if (typeof namespace !== 'string') {
                    throw Exceptions.InvalidArgumentType('string', typeof namespace);
                }

                var parts = namespace.split('.');

                var partCount = parts.length;
                var current = namespaces;
                for (var partIndex=0; partIndex < partCount; partIndex++) {
                    var part = parts[partIndex];
                    if (typeof current[part] === 'undefined') {
                        current = {
                            isNamespace: true,
                            name: part,
                            parent: current
                        };

                        if (partIndex === partCount-1 && type) {
                            return current[part] = type;
                        }
                    } else {
                        current = current[part];
                    }
                }

                return current;
            },
            get: function get(namespace) {
                return this.define(namespace);
            }
        };
    })();

    var Factory = {};

    Factory.Exceptions = Exceptions;

    var parseFunctionName = function parseFunctionName(type) {
        if (typeof type.name !== 'undefined' && type.name !== '' && type.name !== null) {
            return type.name;
        }

        var name = /\W*function\s+([\w\$]+)\(/.exec(type);
        if (name) {
            return name[1];
        }
    };

    var Class = function Class(baseType, type) {
        var typeName = parseFunctionName(type);
        var baseTypeName = parseFunctionName(baseType);

        var ProxyClass = function ProxyClass() {
            var self = this;

            var context = {
                $self: self,
                $init: function $init() {
                    if (typeof self.init === 'function') {
                        return self.init.apply(self, arguments);
                    }
                }
            };

            var members = type.apply(context, arguments);

            for (var memberName in members) {
                if (members.hasOwnProperty(memberName)) {
                    var member = members[memberName];
                    var baseMember = context.$self[memberName];

                    (function(memberFunction, baseFunction) {
                        context.$self[memberName] = function() {
                            var method = this;

                            if (typeof baseFunction === 'function') {
                                method.$base = baseFunction;
                            }

                            return memberFunction.apply(method, arguments);
                        };
                    })(member, baseMember);
                }
            }

            if (typeof context.$self.init === 'function') {
                context.$self.init.apply(self, arguments);
            }

            return context.$self;
        };

        ProxyClass.prototype = new baseType();
        ProxyClass.prototype.constructor = type;

        ProxyClass.extend = (function() {
            return function extend(constructor, namespace) {
                if (typeof constructor !== 'function') {
                    throw Exceptions.MissingConstructor();
                }

                if (!parseFunctionName(constructor)) {
                    throw Exceptions.MissingConstructorName();
                }

                var proxy = Class(ProxyClass, constructor);
                proxy.$type.namespace = namespace || proxy.$type.namespace;

                return proxy;
            };
        })();

        ProxyClass.$type = {
            base: baseType,
            baseName: baseTypeName,
            constructor: type,
            name: typeName,
            namespace: baseType.$type ? baseType.$type.namespace : 'System',

            qualifiedName: function qualifiedName() {
                return [this.namespace, this.name].join('.');
            },
            namespaceObject: function namespaceObject() {
                return NamespaceManager.get(ProxyClass.$type.namespace);
            }
        };

        return ProxyClass;
    };

    var BaseObject = Factory.BaseObject = Class(Object, function BaseObject() {
        return {
            dispose: function dispose() {}
        };
    });

    var EcmaObjectTracker = (function() {
        var instances = [];

        var reclaim = function reclaim(array, from, to) {
            // http://ejohn.org/blog/javascript-array-remove/
            var rest = array.slice((to || from) + 1 || array.length);
            array.length = from < 0 ? array.length + from : from;
            return array.push.apply(array, rest);
        };

        instances.state = [];

        return {
            add: function add(instance) {
                if (this.getIndex(instance) < 0) {
                    instances.push(instance);
                    instances.state.push({
                        isExtensible: true
                    });
                }

                return instances[this.getIndex(instance)];
            },
            create: function create() {

            },
            getIndex: function getIndex(instance) {
                return instances.indexOf ? instances.indexOf(instance) : (function() {
                    var index = instances.length;
                    while(index--)
                    {
                        if (instances[index] === instance) {
                            return index;
                        }
                    }

                    return -1;
                })();
            },
            getState: function getState(instance) {
                var index = this.getIndex(instance);
                return (index >=0 ) ? instances.state[index] : (function(idx){
                    EcmaObjectTracker.add(instance);
                    return instances.state[instances.length-1];
                })(index);
            },
            isExtensible: function isExtensible(instance) {
                return EcmaObjectTracker.getState(instance).isExtensible;
            },
            preventExtensions: function preventExtensions(instance) {
                EcmaObjectTracker.getState(instance).isExtensible = false;
            },
            remove: function remove(instance) {
                var index = this.getIndex(instance);
                if (index >= 0) {
                    reclaim(instances, index);
                    reclaim(instances.state, index);
                }

                return this;
            }
        };

    })();

    var EcmaObject = Factory.EcmaObject = BaseObject.extend(function EcmaObject() {
        this.$init();
        var self = EcmaObjectTracker.add(this.$self);

        return {
            dispose: function dispose() {
                EcmaObjectTracker.remove(self);
                this.$base();
            }
        }
    });

    EcmaObject.create = Object.create || EcmaObjectTracker.create;
    EcmaObject.isExtensible = Object.isExtensible || EcmaObjectTracker.isExtensible;
    EcmaObject.preventExtensions = Object.preventExtensions || EcmaObjectTracker.preventExtensions;

    exports.Factory = Factory;

})();
