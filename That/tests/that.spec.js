(function() {

    var exports = (typeof module === 'undefined') ? window : module.exports;
    var that = exports.that;

    var Data = function() {
        return {
            customers: [
                {
                    firstName: 'Mike',
                    lastName: 'Pham',
                    orders: [
                        {
                            number: 2100,
                            items: [
                                { description: 'Hat', quantity: 2, cost: 29.99 },
                                { description: 'Shaw', quantity: 1, cost: 69.99 }
                            ]
                        },
                        {
                            number: 2101,
                            items: [
                                { description: 'Boots', quantity: 1, cost: 144.99 },
                                { description: 'Gloves', quantity: 1, cost: 49.99 },
                                { description: 'Ring', quantity: 1, cost: 599.99 }
                            ]
                        }
                    ]
                }
            ]
        }
    };

    describe('That', function() {

        it('should be able to wrap an object', function() {
            var object = {};
            expect(that(object).instance()).toBe(object);
        });

        describe('args', function() {

            it('should be able to convert arguments to array', function() {
                var expectation = function() {
                    return that(arguments).args();
                };

                var result = expectation(1, 2, 3, 4);
                expect(result).toEqual([1, 2, 3, 4]);
                expect(result instanceof Array).toBe(true);
            });

        });

        describe('copy', function() {

            it('should be able to shallow copy an object', function() {
                var customer = Data().customers[0];

                var copy = that(customer).copy();
                expect(copy.firstName).toBe(customer.firstName);
                expect(copy.orders === customer.orders).toBe(true);
                expect(copy.orders[0] === customer.orders[0]).toBe(true);
            });
        });

        describe('clone', function() {

            it('should be able to deep copy an object', function() {
                var customer = Data().customers[0];

                var clone = that(customer).clone();
                expect(clone.firstName).toBe(customer.firstName);
                expect(clone.orders === customer.orders).toBe(false);
                expect(clone.orders[0] === customer.orders[0]).toBe(false);
            });

        });

        describe('events', function() {

            it('should create events', function() {
                var object = {};
                that(object).events('testEvent');

                expect(object.events).toBeDefined();
                expect(object.events.testEvent).toBeDefined();
                expect(object.events.testEvent instanceof Function).toBe(true);
            });

            it('should be able to add event handler and call it', function() {
                var object = {}, called = false;
                that(object).events('testEvent');
                object.events.testEvent(function() {
                    called = true;
                });

                object.events.testEvent.notify();

                expect(called).toBe(true);
            });

            it('should be able to add multiple event handlers and call them', function() {
                var object = {}, result = [];
                that(object).events('testEvent');
                object.events.testEvent(function() {
                    result.push(1);
                });
                object.events.testEvent(function() {
                    result.push(2);
                });

                object.events.testEvent.notify();

                expect(result.length).toBe(2);
            });

            it('should be able to pass parameters to handler', function() {
                var object = {}, paramValue;
                that(object).events('testEvent');
                object.events.testEvent(function(param) {
                    paramValue = param;
                });
                object.events.testEvent.notify('a');

                expect(paramValue).toBe('a');
            });

        });

    });

})();
