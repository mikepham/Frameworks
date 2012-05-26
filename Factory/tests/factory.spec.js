(function() {

    var Factory = typeof require === 'function'
        ? require('Factory/src/factory.js')
        : window.Factory;

    describe('Factory', function() {

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

    });

})();
