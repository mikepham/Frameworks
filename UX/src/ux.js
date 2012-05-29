(function(W) {

    var Exceptions = {
        RequiresLibrary: function RequiresLibrary(name) {
            return new Error('Requires ' + name);
        }
    };

    // This is client-side only, so we can safely assume that window will contain our
    // Factory framework.
    var Factory = W.Factory || (function() { throw Exceptions.RequiresLibrary('Factory'); });
    var that = W.that || (function() { throw Exceptions.RequiresLibrary('That'); });

    var UX = {};

    var Element = UX.Element = Factory.BaseObject.extend(function Element(selector) {
        var instance = this;
        instance.$init(selector);

        return {
        };
    });

    var ViewPort = Element.extend(function ViewPort(selector) {
        var instance = this;
        instance.$init(selector);

        return {
        };
    });

})(window);
