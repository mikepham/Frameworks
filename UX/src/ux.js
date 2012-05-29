(function(exports) {

    // This is client-side only, so we can safely assume that window will contain our
    // Factory framework.
    var Factory = exports.Factory;
    var that = exports.that;

    var UX = {};

    var Element = UX.Element = Factory.BaseObject.extend(function Element(selector) {
        var instance = this;
        instance.$init(selector);

        return {};
    });

    var ViewPort = Element.extend(function ViewPort(selector) {
        var instance = this;
        instance.$init(selector);

        return {
            update: function update(interval) {
            }
        };
    });

})(window);
