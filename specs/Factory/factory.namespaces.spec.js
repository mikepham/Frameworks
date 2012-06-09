(function() {

    /// <summary>
    /// This is a special import that checks if we are running in a NodeJS environment or
    /// running within a browser.
    /// </summary>
    var API = (typeof module !== 'undefined') ? module.exports : this.API || (this.API = {});

    var Factory = API.Factory;

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
