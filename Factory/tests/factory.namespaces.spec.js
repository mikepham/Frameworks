(function() {

    var Factory = typeof require === 'function'
        ? require('Factory/src/factory.js')
        : window.Factory;

    describe('Namespaces', function() {

        var TestingNamespace = 'Factory.Testing';

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
            expect(namespaceObject.isNamespace).toBe(true);
            expect(namespaceObject.name).toBe('Testing');
            expect(namespaceObject.parent.name).toBe('Factory');
        });

    });

})();
