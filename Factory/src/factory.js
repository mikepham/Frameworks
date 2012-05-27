(function() {

    /// <summary>
    /// This is a special import that checks if we are running in a NodeJS environment or
    /// running within a browser.
    /// </summary>
    var exports = (typeof module === 'undefined') ? ((typeof window === 'undefined') ? {} : window) : module.exports;

    /// <summary>
    /// I have having to provide this on the String method, but at least it's just a fallback
    /// for browsers that don't support a native trim implementation.
    /// </summary>
    if (!String.prototype.trim) {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/g,'');
        };
    }

    var Factory = {};

    /* Exceptions */

    /// <summary>
    /// List of available exceptions that are ONLY to be used with this framework and no other.
    /// Do not try to re-use this in other frameworks, because this can change over time and the
    /// messages will some day get localization.
    /// <summary>
    var Exceptions = Factory.Exceptions = {
        InvalidArgumentType: function(expected, actual) {
            return new Error('Expected: ' + expected.toString() + ', but got: ' + actual.toString() + '.');
        },
        MissingConstructor: function() {
            return new Error('You must provide a named constructor function.');
        },
        MissingConstructorName: function() {
            return new Error('Cannot use anonymous functions. You must provide a named function.');
        },
        NoBaseMethodToCall: function() {
            return new Error('No additional base methods to call. Do not call $base in this case.');
        }
    };

    /* Namespaces */

    /// <summary>
    /// I find it's just easier to do our own namespace implementation because the others introduce
    /// additional external dependencies I would rather avoid.
    /// </summary>
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

    /// <summary>
    /// This is our namespace entry-point. Unless you are inside the framework, don't use the
    /// NamespaceManager since it's not exposed outside the framework.
    /// </summary>
    Factory.namespace = function namespace(path) {
        return NamespaceManager.get(path);
    };

    /* Class Functions */

    /// <summary>
    /// Attempts to get the name of the particular constructor. If we cannot achieve this (IE),
    /// we callback on parsing the function text. If that fails, then I don't know what else to
    /// try.
    /// </summary>
    function parseFunctionName(type) {
        if (typeof type.name !== 'undefined' && type.name !== '' && type.name !== null) {
            return type.name;
        }

        var name = /\W*function\s+([\w\$]+)\(/.exec(type);

        if (name) {
            return name[1];
        }

        return undefined;
    }

    /// <summary>
    /// This is where all the magic of the Factory framework resides. There be a lot of dragons here
    /// so READ THE CODE AND COMMENTS.
    /// </summary>
    /// <remarks>
    /// See the comments, but here is a quick summary of what's going on.
    ///     1) Create a proxy constructor
    ///     2) ???
    ///     3) PROFIT!
    /// </remarks>
    function defineClass(baseType, type) {
        /// [1] Normalize the constructor names! Screw you, IE!
        var typeName = parseFunctionName(type);
        var baseTypeName = parseFunctionName(baseType);

        /// [2] Create a proxy constructor that will be returned. This is what
        ///     you will call "new" against.
        var ProxyClass = function ProxyClass() {
            var self = this;

            /// [a] This context object is what makes the world go 'round and it also
            ///     lets us have a nice "protected" variable space. We also store the
            ///     forwarder for init methods.
            var context = {
                $context: {},
                $self: self,
                $init: function $init() {
                    if (typeof self.init === 'function') {
                        return self.init.apply(self, arguments);
                    }
                }
            };

            /// [b] A little more magic, we call the new constructor setting the "this"
            ///     variable to our context as well as forwarding whatever constructor
            ///     parameters were passed.
            var members = type.apply(context, arguments);

            /// [c] Our biggest trick up our sleeve, this is what drives the inheritance
            ///     calls on methods. Iterate through all the members returned from our
            ///     constructor and then copy them to the current instance.
            for (var memberName in members) {
                if (members.hasOwnProperty(memberName)) {
                    var member = members[memberName];
                    var baseMember = context.$self[memberName];

                    /// [d] This creates another closure so that we trap the correct
                    ///     values regardless of who calls this method before or after.
                    ///     If a method existed in the base class, we simply assign that
                    ///     to the $base property and then call our main method. This
                    ///     achieves the effect of having base methods that you can
                    ///     call or completely ignore when overriding.
                    (function(memberFunction, baseFunction) {
                        context.$self[memberName] = function() {
                            var $method = this;
                            $method.$context = context.$context;

                            $method.base = (typeof baseFunction === 'function') ? baseFunction : function() {
                                throw Exceptions.NoBaseMethodToCall();
                            };

                            return memberFunction.apply($method, arguments);
                        };
                    })(member, baseMember);
                }
            }

            /// [e] If an init method was provided, let's call it with the passed
            ///     parameters. This is how constructor parameters are passed from
            ///     descendant to parent.
            if (typeof context.$self.init === 'function') {
                context.$self.init.apply(context, arguments);
            }

            return context.$self;
        };

        /// [3] A little bit of magic here. We actually create the base constructor
        ///     and assign it to prototype so that "instanceof" checks work correctly.
        ///     We also set the prototype's constructor.
        ProxyClass.prototype = new baseType();
        ProxyClass.prototype.constructor = type;

        /// [4] We create an extend method that is attached to every constructor returned
        ///     so that inheriting a class is easy. Extend will always know who the base
        ///     constructor is, thanks to the closure.
        ProxyClass.extend = (function() {
            return function extend(constructor, namespace) {
                if (typeof constructor !== 'function') {
                    throw Exceptions.MissingConstructor();
                }

                if (!parseFunctionName(constructor)) {
                    throw Exceptions.MissingConstructorName();
                }

                var proxy = defineClass(ProxyClass, constructor);
                proxy.$type.namespace = namespace || proxy.$type.namespace;

                return proxy;
            };
        })();

        /// [5] Our type information object that stores metadata about the class being
        ///     defined. A lot of these are convenience properties/functions so that
        ///     you don't have to do all kinds of crazy stuff to get to it. It's attached
        ///     to the constructor, NOT the instantiated instance.
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
    }

    Factory.DefineClass = defineClass;

    /* Classes */

    /// <summary>
    /// Although we expose the DefineClass method, try to avoid using that and base all your
    /// classes on the BaseObject or EcmaObject class.
    /// </summary>
    var BaseObject = Factory.BaseObject = Factory.DefineClass(Object, function BaseObject() {
        return {
            dispose: function dispose() {}
        };
    });

    /// <summary>
    /// Very crude implementation of ECMAScript 5's additional functionality. Note that we cannot
    /// realistically support things like sealing and preventing extensions, but at least we can
    /// stub the interface to make porting code later easier.
    /// </summary>
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

    /// <summary>
    /// Although we expose the DefineClass method, try to avoid using that and base all your
    /// classes on the BaseObject or EcmaObject class.
    /// </summary>
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

    /// <summary>
    /// Finally, we expose this to the outside world via the exports parameter.
    /// </summary>
    exports.Factory = Factory;

})();
