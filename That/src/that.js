(function(exports) {

    var Exceptions = {
        IndexOutOfBounds: function IndexOutOfBounds(index) {
            return new Error('Index was out of bounds: ' + index);
        },
        InvalidOperation: function InvalidOperation(message) {
            return new Error('An invalid operation was performed. ' + message);
        }
    };

    var ArgumentsToArray = function ArgumentsToArray(array) {
        return Array.prototype.slice.call(array, 0);
    };

    var At = function At(array, index) {
        return array.charAt ? array.charAt(index) : array[index];
    };

    var IsMatchingType = function IsMatchingType(source, target) {
        if (typeof type === 'string') {
            return (typeof object === type);
        } else if (typeof type === 'function') {
            return object instanceof type;
        } else if (type === Array) {
            return is('array');
        } else if (type === Boolean) {
            return is('boolean');
        } else if (type === Date) {
            return is('date');
        } else if (type === Function) {
            return is('function');
        } else if (type === Number) {
            return is('number');
        } else if (type === String) {
            return is('string');
        } else if (type === Object) {
            return is('object');
        }

        return false;
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
                return IterateArray(object, callback);
            } else if (IsMatchingType(object, Number)) {
                return IterateCount(object, callback);
            }

            return IterateObject(object, callback);
        }

        throw Exceptions.InvalidOperation('Could not iterate the object you provided.');
    };

    var That = function That(object) {
        var args = this.args = function args() {
            return ArgumentsToArray(object);
        };

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

        var del = this.del = function del(value) {
            if (IsMatchingType(object, Array) || IsMatchingType(object, String)) {

            } else if (IsMatchingType(object, Object)) {

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
        /// Determines if the array, string, or object contains the provided
        /// value.
        /// </summary>
        var has = this.has = function has(value) {
            return Iterate(object, function(v) {
                if (v === value) {
                    return true;
                }
            });
        };

        /// <summary>
        /// Checks if the object's type matches the requested type.
        /// </summary>
        var is = this.is = function is(type) {
            IsMatchingType(object, type);
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

        is.not = function not(type) {
            return !is(type);
        };

        is.only = function only(type) {
            if (IsMatchingType(object, type)) {
                if (IsMatchingType(type, Array)) {
                    return true;
                } else if (IsMatchingType(type, Date)) {
                    return true;
                } else if (IsMatchingType(type, Boolean)) {
                    return true;
                } else if (IsMatchingType(type, Number)) {
                    return true;
                } else if (IsMatchingType(type, String)) {
                    return true;
                } else if (IsMatchingType(type, Function)) {
                    return true;
                } else if (IsMatchingType(type, Object)) {
                    return true;
                }
            }

            return false;
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
    };

    That.Exceptions = Exceptions;

    /* Module management */

    var context = {
        includes: 0,
        including: 0,
        scripts: {}
    };

    var handleInclude = function handleInclude(filename) {
        context.includes++;
    };

    That.include = function include(files) {
        var fileNames = typeof files === 'array' ? files : Array.prototype.slice.call(arguments, 0);

        context.including = fileNames.length;

        for (var i=0; i < context.including; i++) {
            var filename = fileNames[i];
            this.initializer(filename, handleInclude);
        }
    };

    That.include.initializer = function initializer(filename, callback) {
        if (typeof require === 'function') {
            var node = context.scripts[filename] = require(filename);
            callback(filename, node);
        }
    };

    exports.That = That;

    exports.that = function that(object) {
        return new That(object);
    };


})(typeof module !== 'undefined' && typeof module.exports !== 'undefined' ? module.exports : window);
