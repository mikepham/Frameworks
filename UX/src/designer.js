(function(api) {

    var Exceptions = {
        RequiresLibrary: function RequiresLibrary(name) {
            return new Error('Requires ' + name);
        }
    };

    var Factory = api.Factory || (function() { throw Exceptions.RequiresLibrary('Factory'); });
    var that = api.that || (function() { throw Exceptions.RequiresLibrary('That'); });
    var UX = api.UX || (function() { throw Exceptions.RequiresLibrary('UX'); });

    UX.Designer = Factory.BaseObject.extend(function Designer() {
        this._init();

        var self = this._instance;
        var context = this._context;

        context.$doc = undefined;
        context.$selected = null;
        context.filter = 'div';

        this._events.define(['hovering', 'leaving', 'selected', 'deselected', 'menu']);

        var select = function(element) {
            context.$selected = element;
            self.events.selected.notify(element);
        };

        var menu = function(element) {
            self.events.menu.notify(element);
        };

        var listeners = {
            'mousedown': function(e) {
                var $element = $(this);

                select($element);

                if (e.which === UX.Enums.Mouse.Button.Right) {
                    menu($element);
                }

                e.preventDefault();
                e.stopPropagation();
            },

            'mouseout': function(e) {
                var $element = $(this);
                $element.css('border', '');

                self.events.leaving.notify($element);

                e.preventDefault();
                e.stopPropagation();
            },

            'mouseover': function(e) {
                var $element = $(this);
                $element.css('border', 'solid 1px #0000ff');

                self.events.hovering.notify($element);

                e.preventDefault();
                e.stopPropagation();
            }
        };

        return {
            init: function init(document) {
                context.$doc = $(that(document).not.empty() ? document : window.document);
            },
            disable: function disable() {
                context.$doc.off(listeners, context.filter);
            },
            enable: function enable() {
                context.$doc.on(listeners, context.filter);
            }
        };
    });

    UX.Designer.Standard = UX.Designer.extend(function Standard() {
        this._init();

        var self = this._instance;
        var context = this._context;

        return {};
    });

})(API || window.API);
