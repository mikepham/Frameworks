(function() {

    /// <summary>
    /// This is a special import that checks if we are running in a NodeJS environment or
    /// running within a browser.
    /// </summary>
    var API = (typeof module !== 'undefined') ? module.exports : this.API || (this.API = {});

    /* Exceptions */

    var Exceptions = {
        IndexOutOfBounds: function IndexOutOfBounds(index) {
            return new Error('Index was out of bounds: ' + index);
        },
        InvalidOperation: function InvalidOperation(message) {
            return new Error('An invalid operation was performed. ' + message);
        }
    };

    /* Helper functions */

    var ArgumentsToArray = function ArgumentsToArray(array) {
        return Array.prototype.slice.call(array);
    };

    var At = function At(array, index) {
        return array.charAt ? array.charAt(index) : array[index];
    };

    var Copy = function Copy(source, deepCopy) {
        var self = this;

        if (deepCopy) {
            if (IsMatchingType(source, Array)) {
                var arr = [];
                IterateArray(source, function(value) {
                    arr.push(Copy.apply(self, [value, deepCopy]));
                });

                return arr;
            } else if (IsOnlyMatchingType(source, Date)) {
                return new Date(source);
            } else if (IsOnlyMatchingType(source, Object)) {
                var object = {};
                IterateObject(source, function(value, key) {
                    object[key] = Copy.apply(self, [value, deepCopy]);
                });

                return object;
            }
        }

        return source;
    };

    var CreateEvents = function CreateEvents(target, eventList) {
        var eventNames = IsMatchingType(eventList, Array) ? eventList : ArgumentsToArray(arguments);

        if (!target.events) {
            target.events = {};
        }

        IterateArray(eventNames, function(eventName) {
            var handlers = [];

            var event = target.events[eventName] = function listener(handler) {
                handlers.push(handler);

                return this;
            };

            event.any = function any() {
                return (handlers.length > 0);
            };

            event.empty = function empty() {
                return (handlers.length === 0);
            };

            event.notify = function notify() {
                var args = arguments;

                IterateArray(handlers, function(handler) {
                    handler.apply(target, args);
                });

                return this;
            };
        });
    };

    var CreateProperties = function CreateProperties(source, target, options) {
        var settings = Merge(options || {}, {
            bindingType: Enums.BindingTypes.ByReference
        });

        IterateObject(source, function(value, key) {
            if (IsOnlyMatchingType(value, Object)) {
                target[key] = {};
                CreateProperties(value, target[key], options);
                return;
            }

            var capturedValue = value;
            var eventName = key + 'Changed';

            CreateEvents(target, eventName);

            if (settings.bindingType === Enums.BindingTypes.ByValue) {
                capturedValue = Copy.apply(this, [value, true]);
            }

            target[key] = function accessor(value) {
                if (IsMatchingType(value, undefined)) {
                    return capturedValue;
                }

                target.events[eventName].notify(capturedValue, value);

                capturedValue = value;
            };
        });
    };

    var FormatString = function FormatString(formattedString, parameters) {
        var result = formattedString;
        var args = ArgumentsToArray(arguments);

        if (args.length === 2 && IsOnlyMatchingType(parameters, Object)) {
            IterateObject(parameters, function(value, key) {
                var regex = new RegExp(FormatString('{:{0}}', key), 'g');
                result = result.replace(regex, value);
            });
        } else if (IsMatchingType(formattedString, String)) {
            var handleMatchedIndex = function(match, index) {
                var idx = (Number(index) + 1);
                return (typeof args[idx] !== 'undefined') ? args[idx] : '';
            };

            return result.replace(/\{(\d+)\}/g, handleMatchedIndex);
        }

        return result;
    };

    var IsJavaScriptType = function IsJavaScriptType(source, type) {
        return (type === Object.prototype.toString.call(source).slice(8, -1).toLowerCase());
    };

    var IsMatchingType = function IsMatchingType(source, type) {
        // If either of them is null, we just do a straight comparison.
        if (source === null || type === null) {
            return (source === type);
        }

        // Short-circuit out if we have invalid parameters.
        if (typeof source === 'undefined' && typeof type === 'undefined') {
            return true;
        } else if (typeof source === 'undefined' || typeof type === 'undefined') {
            return false;
        }

        // If the type is a string value, we just need to call typeof and match,
        // except for the special case of arrays.
        if (typeof type === 'string') {
            // Special case for array
            if (IsMatchingType(source, Array)) {
                return (type === 'array');
            }

            return (typeof source === type);
        }

        // Special cases
        if (type === String) {
            return IsJavaScriptType(source, 'string');
        } else if (type === Number) {
            return IsJavaScriptType(source, 'number');
        } else if (type === Boolean) {
            return IsJavaScriptType(source, 'boolean');
        }

        return (source instanceof type);
    };

    var IsOnlyMatchingType = function IsOnlyMatchingType(source, type) {
        var wantsArray = (type === 'array' || type === Array);
        var wantsDate = (type === Date);
        var wantsFunction = (type === 'function' || type === Function);
        var wantsObject = (type === 'object' || type === Object);
        var wantsNumber = (type === 'number' || type === Number);
        var wantsString = (type === 'string' || type === String);

        if (wantsArray && !IsMatchingType(source, Array)) {
            return false;
        }

        if (wantsFunction && !IsMatchingType(source, Function)) {
            return false;
        }

        if (wantsDate && !IsMatchingType(source, Date)) {
            return false;
        }

        if (wantsNumber && !IsMatchingType(source, Number)) {
            return false;
        }

        if (wantsString && !IsMatchingType(source, String)) {
            return false;
        }

        if (wantsObject) {
            if (IsMatchingType(source, Function)) {
                return false;
            } else if (IsMatchingType(source, Array)) {
                return false;
            } else if (IsMatchingType(source, Date)) {
                return false;
            } else {
                return (IsMatchingType(source, Object));
            }
        }

        return true;
    };

    var IterateArray = function IterateArray(array, callback) {
        var length = array.length;

        for (var i=0; i < length; i++) {
            var element = At(array, i);

            var result = callback.apply(array, [element, i]);

            if (result) {
                return result;
            }
        }
    };

    var IterateCount = function IterateCount(count, callback) {
        for (var i=0; i < count; i++) {
            var result = callback.apply(count, [i, count]);

            if (result) {
                return result;
            }
        }

        return 0;
    };

    var IterateObject = function IterateObject(object, callback) {
        for (var propertyName in object) {
            if (object.hasOwnProperty(propertyName)) {
                var propertyValue = object[propertyName];

                var result = callback.apply(object, [propertyValue, propertyName]);

                if (result) {
                    return result;
                }
            }
        }
    };

    var Iterate = function Iterate(object, callback) {
        if (IsMatchingType(callback, Function)) {
            if (IsMatchingType(object, Array) || IsMatchingType(object, String)) {
                return IterateArray.apply(this, [object, callback]);
            } else if (IsMatchingType(object, Number)) {
                return IterateCount.apply(this, [object, callback]);
            }

            return IterateObject.apply(this, [object, callback]);
        }

        throw Exceptions.InvalidOperation('Could not iterate the object you provided.');
    };

    var Merge = function Merge(source, target) {
        if (!IsMatchingType(source, Object)) {
            throw Exceptions.InvalidArgumentType(Object, source);
        } else if (!IsMatchingType(target, Object)) {
            throw Exceptions.InvalidArgumentType(Object, target);
        }

        IterateObject(source, function(value, key) {
            if (!target.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        });

        return target;
    };

    var RemoveFromArray = function RemoveFromArray(array, startIndex, count) {
        // http://ejohn.org/blog/javascript-array-remove/
        var rest = array.slice((count || startIndex) + 1 || array.length);
        array.length = startIndex < 0 ? array.length + startIndex : startIndex;
        return array.push.apply(array, rest);
    };

    /* Enums */

    var Enums = {};

    Enums.BindingTypes = {
        ByReference: 0,
        ByValue: 1
    };

    /* That */

    /// <summary>
    /// Constructor that creates a wrapper around the object. Try to avoid writing
    /// too much code in here. You will mostly see calls to the helper functions to
    /// farm out the task. Consider this the "interface" or contract and the helper
    /// functions the implementation. When documenting, document the interface and
    /// not the helpers so as the helpers can do whatever it needs to without changing
    /// the contract.
    /// </summary>
    var That = API.That = function That(object) {
        var T = this;

        /// <summary>
        /// Returns an arguments object into an array.
        /// </summary>
        var args = this.args = function args() {
            return ArgumentsToArray(object);
        };

        /// <summary>
        /// Safely gets the value at the specified index for an array or string.
        /// </summary>
        var at = this.at = function at(index) {
            if (not.bounded(index)) {
                throw Exceptions.IndexOutOfBounds(index);
            }

            return At(object, index);
        };

        /// <summary>
        /// Determines if the index is within the bounds of the object.
        /// </summary>
        var bounded = this.bounded = function bounded(index) {
            if (!object.length) {
                throw Exceptions.InvalidOperation('No length property exists.');
            }

            return (index >= 0 && index < object.length);
        };

        /// <summary>
        /// Clones the provided value. If the value is an object or array with objects,
        /// the cloning will create new instances.
        /// </summary>
        var clone = this.clone = function clone() {
            return Copy.apply(this, [object, true]);
        };

        /// <summary>
        /// Copies the provided value. If the value is an object or array, the value is
        /// simply returned to maintain the reference. If you wish to deep copy the object,
        /// use the clone method.
        /// </summary>
        var copy = this.copy = function copy() {
            return Copy.apply(this, [object, false]);
        };

        /// <summary>
        /// Deletes the specified index in the array or string or removes
        /// the property from an object.
        /// </summary>
        var del = this.del = function del(value) {
            if (IsMatchingType(value, String)) {
                if (IsMatchingType(object, Object)) {
                    try {
                        delete object[value];
                    } catch(e) {
                        object[value] = undefined;
                    }
                }
            } else if (IsMatchingType(value, Number)) {
                if (IsMatchingType(object, Array)) {
                    return RemoveFromArray(object, value);
                } else if (IsMatchingType(object, String)) {
                    var array = object.slice(0);
                    return RemoveFromArray(array, value).join('');
                }
            }
        };

        /// <summary>
        /// Iterates over an array, string, object, or a count and provides
        /// the callback with the value and key. Avoid using this unless you
        /// can be given different types and need the safe iteration. Whatever
        /// you return from the callback, if it can be evaluated to true,
        /// iteration will stop.
        /// </summary>
        var each = this.each = function each(callback) {
            return Iterate(object, callback);
        };

        /// <summary>
        /// Reverses the iteration. This cheats a little and is non-performant
        /// in most cases, so don't use unless you have to, i.e. iterating over
        /// object keys in reverse.
        /// </summary>
        each.reverse = function reverse(callback) {
            var items = [];

            Iterate(object, function(value, key) {
                items.push(value);
                return callback.apply(this, [value, key]);
            });

            return items.reverse();
        };

        /// <summary>
        /// Checks if the object is empty or not. Does not check if objects
        /// have no properties.
        /// </summary>
        var empty = this.empty = function empty() {
            return (typeof object === 'undefined' || object === null || object === '');
        };

        /// <summary>
        /// Creates the requested event listeners on the object.
        /// </summary>
        var events = this.events = function events(eventList) {
            CreateEvents(object, eventList);
            return T;
        };

        var format = this.format = function format() {
            var args = [object].concat(ArgumentsToArray(arguments));
            return FormatString.apply(this, args);
        };

        /// <summary>
        /// Determines if the array, string, or object contains the provided
        /// value.
        /// </summary>
        var has = this.has = function has(value) {
            // This is far faster when available...
            if (IsOnlyMatchingType(value, Array) && value.indexOf) {
                return value.indexOf(value);
            }

            return Iterate(object, function(v) {
                if (v === value) {
                    return true;
                }
            });
        };

        /// <summary>
        /// Returns the instance that we're wrapping.
        /// </summary>
        var instance = this.instance = function instance() {
            return object;
        };

        /// <summary>
        /// Checks if the object's type matches the requested type.
        /// </summary>
        var is = this.is = function is(type) {
            return IsMatchingType(object, type);
        };

        /// <summary>
        /// Checks if the object's type matches any of the requested types.
        /// </summary>
        is.any = function any(typeList) {
            var types = (typeof typeList === 'array') ? typeList : ArgumentsToArray(arguments);

            var length = types.length;

            for (var i=0; i < length; i++) {
                var type = types[i];
                if (IsMatchingType(object, type)) {
                    return true;
                }
            }

            return false;
        };

        /// <summary>
        /// Checks if the object's type does not match.
        /// </summary>
        is.not = function not(type) {
            return !is(type);
        };

        /// <summary>
        /// Checks if the object's type does not match any of the requested types.
        /// </summary>
        is.only = function only(type) {
            return IsOnlyMatchingType(object, type);
        };

        /// <summary>
        /// Merges the properties from the source to the target when the property
        /// does not already exist.
        /// </summary>
        var merge = function merge(source) {
            return Merge(source, object);
        };

        /// <summary>
        /// Object that simply maps in some of the inverses of the other methods.
        /// Only do this if it makes sense, i.e. that.is.not() is better than
        /// that.not.is();
        /// </summary>
        var not = this.not = {
            bounded: function bounded(index) { return !bounded(index); },
            empty: function empty() { return !empty(); },
            has: function has(value) { return !has(value); }
        };

        /// <summary>
        /// Creates observable properties on the object. The properties follow
        /// the standard jQuery way of handling get/set: propertyName() to get
        /// and propertyName(value) to set. You can listen for each property
        /// using the propertyNameChanged event.
        /// </summary>
        /// <remarks>
        /// options = {
        ///     bindingType: Enums.BindingTypes.ByReference
        /// }
        /// </remarks>
        var properties = this._properties = function properties(source, options) {
            CreateProperties(source, object, options);
            return T;
        };
    };

    That.Enums = Enums;
    That.Exceptions = Exceptions;

    /* Module management */

    var Modules = {
        includes: 0,
        including: 0,
        scripts: {}
    };

    /* Installation management */

    var installation = {};

    That.install = function install() {
        function Warning(message) {
            return '[WARNING] Did not install + ' + message + ' because it was already there.'
                + ' The current implementation may not be compatible.';
        }

        if (!String.prototype.format) {
            installation['format'] = { $prototype: String.prototype, original: String.prototype.format };

            String.prototype.format = function format() {
                var args = [this].concat(ArgumentsToArray(arguments));

                return FormatString.apply(this, args);
            };
        } else {
            console.log(Warning('String.format'));
        }

        if (!Array.prototype.indexOf) {
            Array.prototype.indexOf = function indexOf(value) {
                installation['indexOf'] = { $prototype: Array.prototype, original: Array.prototype.indexOf };

                return IterateArray(this, function(element) {
                    return (element === value);
                });
            };
        } else {
            console.log(Warning('Array.indexOf'));
        }
    };

    That.uninstall = function uninstall() {
        IterateObject(installation, function(value, key) {
            value.$prototype[key] = value.original;
        });
    };

    API.that = function that(object) {
        return new That(object);
    };

})();
