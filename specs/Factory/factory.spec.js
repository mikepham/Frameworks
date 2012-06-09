(function() {

    /// <summary>
    /// This is a special import that checks if we are running in a NodeJS environment or
    /// running within a browser.
    /// </summary>
    var API = (typeof module !== 'undefined') ? module.exports : this.API || (this.API = {});

    var Factory = API.Factory;

    describe('Factory.BaseObject', function() {

        it('should be able to define a class', function() {
            var Descendant = Factory.BaseObject.extend(function Descendant() {
                this.$init();
                return {};
            });

            expect(Descendant.$type).toBeDefined();
            expect(Descendant.$type.name).toBe('Descendant');
        });

        it('should be able to instantiate a class', function() {
            var Descendant = Factory.BaseObject.extend(function Descendant() {
                this.$init();
                return {};
            });

            expect(new Descendant()).toBeDefined();
        });

        it('should be identified properly using [instanceof]', function() {
            var Descendant = Factory.BaseObject.extend(function Descendant() {
                this.$init();
                return {};
            });

            var descendant = new Descendant();
            expect(descendant instanceof Factory.BaseObject).toBeTruthy();
            expect(descendant instanceof Descendant).toBeTruthy();
        });

        it('should be able to define a function', function() {
            var Descendant = Factory.BaseObject.extend(function Descendant() {
                this.$init();
                return {
                    testFunction: function testFunction() {
                        return 'Descendant.testFunction';
                    }
                };
            });

            var descendant = new Descendant();
            expect(typeof descendant.testFunction).toBe('function');
            expect(descendant.testFunction()).toBe('Descendant.testFunction');
        });

        it('should call the init method when it\'s defined', function() {
            var calledInit = false;

            var Descendant = Factory.BaseObject.extend(function Descendant() {
                this.$init();
                return {
                    init: function init() {
                        calledInit = true;
                    }
                };
            });

            new Descendant();
            expect(calledInit).toBe(true);
        });

        it('should have a protected context to store data', function() {
            var self = this;
            self._protectedVariableValue = 'protected';

            var Parent = Factory.BaseObject.extend(function Parent() {
                return {
                    protectedVariableValue: function protectedVariableValue() {
                        return self._protectedVariableValue;
                    }
                }
            });

            var Child = Parent.extend(function Child() {
                return {};
            });

            var child = new Child();
            expect(child._protectedVariableValue).toBeUndefined();
            expect(child.protectedVariableValue()).toBe('protected');
        });

        it('should allow separate protected contexts for each descendant', function() {
            var CommonClass = Factory.BaseObject.extend(function CommonClass() {
                this.$init();
                var context = this.$context;
                return {
                    init: function init() {
                        context._type = 'CommonClass';
                    }
                };
            });

            var First = CommonClass.extend(function First() {
                this.$init();
                var context = this.$context;
                return {
                    init: function init() {
                        context._type = 'First';
                    },
                    typeName: function typeName() {
                        return this.$context._type;
                    }
                };
            });

            var Second = CommonClass.extend(function Second() {
                this.$init();
                return {
                    typeName: function typeName() {
                        return this.$context._type + '.Second';
                    }
                };
            });

            var first = new First(), second = new Second();
            expect(first._type).toBeUndefined();
            expect(second._type).toBeUndefined();
            expect(first.typeName()).toBe('First');
            expect(second.typeName()).toBe('CommonClass.Second');
        });

        it('should be able to define properties with types', function() {
            var PropertyClass = Factory.BaseObject.extend(function PropertyClass() {
                var context = this;
                context.$properties.define('firstName', String, 'Mike');
                context.$properties.define('orders', Array, []);

                return {};
            });

            var propertyClass = new PropertyClass();

            expect(propertyClass.firstName instanceof Function).toBe(true);
            expect(propertyClass.orders instanceof Function).toBe(true);
            expect(typeof propertyClass.firstName() === 'string').toBe(true);
            expect(propertyClass.orders() instanceof Array).toBe(true);
        });

        it('should have null as the default value when no initial value provided', function() {
            var PropertyClass = Factory.BaseObject.extend(function PropertyClass() {
                var context = this;
                context.$properties.define('firstName', String);

                return {};
            });

            var propertyClass = new PropertyClass();

            expect(propertyClass.firstName()).toBe(null);
        });

        it('should be able to set property value', function() {
            var PropertyClass = Factory.BaseObject.extend(function PropertyClass() {
                var context = this;
                context.$properties.define('firstName', String);

                return {};
            });

            var propertyClass = new PropertyClass();
            propertyClass.firstName('Michael');

            expect(propertyClass.firstName()).toBe('Michael');
        });

        it('should reject values that are not of the defined type', function() {
            var PropertyClass = Factory.BaseObject.extend(function PropertyClass() {
                var context = this;
                context.$properties.define('firstName', String);

                return {};
            });

            var propertyClass = new PropertyClass();

            function expectation() {
                propertyClass.firstName({});
            }

            expect(expectation).toThrow(Factory.Exceptions.InvalidArgumentType(String, {}));
        });

        it('should be able to get notifications about property value changes', function() {
            var PropertyClass = Factory.BaseObject.extend(function PropertyClass() {
                var context = this;
                context.$properties.define('firstName', String);

                return {};
            });

            var propertyValue;
            var propertyClass = new PropertyClass();
            propertyClass.events.firstNameChanged(function(oldValue, newValue) {
                propertyValue = newValue;
            });
            propertyClass.firstName('Michael');

            expect(propertyClass.firstName()).toBe(propertyValue);
        });

        it('should be able to define events', function() {
            var EventClass = Factory.BaseObject.extend(function EventClass() {
                this.$events.define('simpleEvent');
                return {};
            });

            var eventClass = new EventClass();

            expect(eventClass.events.simpleEvent).toBeDefined();
            expect(eventClass.events.simpleEvent instanceof Function).toBe(true);
        });

        it('should be able to add event handlers and call them', function() {
            var EventClass = Factory.BaseObject.extend(function EventClass() {
                this.$events.define('simpleEvent');
                return {};
            });

            var called = false;

            var eventClass = new EventClass();
            eventClass.events.simpleEvent(function() {
                called = true;
            });
            eventClass.events.simpleEvent.notify();

            expect(called).toBe(true);
        });

        it('should be able to add multiple event handlers and call them', function() {
            var EventClass = Factory.BaseObject.extend(function EventClass() {
                this.$events.define('simpleEvent');
                return {};
            });

            var called = 0;

            var eventClass = new EventClass();
            eventClass.events.simpleEvent(function() {
                called++;
            });
            eventClass.events.simpleEvent(function() {
                called++;
            });
            eventClass.events.simpleEvent.notify();

            expect(called).toBe(2);
        });

        describe('Namespacing', function() {

            var TestingNamespace = 'Testing.Factory';

            var DefaultNamespaceClass = Factory.BaseObject.extend(function DefaultNamespaceClass() {
                this.$init();
                return {};
            });

            var CustomNamespaceClass = DefaultNamespaceClass.extend(function CustomNamespaceClass() {
                this.$init();
                return {};
            }, TestingNamespace);

            it('should set all undefined namespaces to "System"', function() {
                expect(DefaultNamespaceClass.$type.qualifiedName()).toBe('System.DefaultNamespaceClass');
            });

            it('should set the namespace correctly when defined', function() {
                expect(CustomNamespaceClass.$type.namespace).toBe(TestingNamespace);
            });

            it('should get a namespace object', function() {
                var namespaceObject = CustomNamespaceClass.$type.namespaceObject();
                var TestingNamespaceParts = TestingNamespace.split('.');
                expect(namespaceObject.isNamespace).toBe(true);
                expect(namespaceObject.name).toBe(TestingNamespaceParts[1]);
                expect(namespaceObject.parent.name).toBe(TestingNamespaceParts[0]);
            });

        });

        describe('Observable', function() {

            it('should create an observable and be able to bind to a model', function() {
                var model = {
                    id: 1001,
                    name: 'Rifle',
                    description: '',
                    dates: {
                        created: Date.now(),
                        modified: Date.now()
                    },
                    discounts: [],
                    MSRP: 649.99
                };

                var observable = new Factory.Observable(model);
                expect(typeof observable.id).toBe('function');
                expect(typeof observable.dates.created).toBe('function');
            });

        });

    });

})();
