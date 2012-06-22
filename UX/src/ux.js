(function(api) {

    var Exceptions = {
        RequiresLibrary: function RequiresLibrary(name) {
            return new Error('Requires ' + name);
        }
    };

    var Factory = api.Factory || (function() { throw Exceptions.RequiresLibrary('Factory'); });
    var that = api.that || (function() { throw Exceptions.RequiresLibrary('That'); });

    var UX = api.UX = {};

    UX.Enums = {
        Mouse: {
            Button: {
                Left: 1,
                Right: 2,
                Middle: 3
            }
        }
    };

    var Element = UX.Element = Factory.BaseObject.extend(function Element(selector) {
        var instance = this;
        instance._init(selector);

        return {
        };
    });

    var ViewPort = Element.extend(function ViewPort(selector) {
        var instance = this;
        instance._init(selector);

        return {
        };
    });

})(API || window.API);
