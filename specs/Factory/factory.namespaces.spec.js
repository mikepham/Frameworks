(function() {

    var Factory = typeof require === 'function'
        ? require('Factory/src/factory.js').Factory
        : window.Factory;

    describe('Factory.namespace', function() {

        var TestingNamespace = 'Testing.Factory.namespace';

        // This is an invalid test until we have something that clears namespaces
        // between test runs.
        it('should be able to define a namespace', function() {
            var namespace = Factory.namespace(TestingNamespace);
            expect(namespace).toBeDefined();
            expect(namespace.isNamespace).toBe(true);
        });

    });

})();
