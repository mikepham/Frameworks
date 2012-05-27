The Jasmine tests are going to better reflect the current state of the framework,
so use this as a guide only.

``` javascript

var Person = Factory.BaseObject.extend(function Person(birthGender) {
    // Call our base constructor. Note the use of "this" and how
    // it's not the constructed object. If you need that reference
    // use this.$self. The "this" variable is a reference to a context
    // that is created for the entire chain of constructors. This is our
    // protected variable space.
    this.$init(birthGender);

    // Protected variable.
    this.GenderType = {
        male: 0,
        female: 1
    };

    // Private variable store for property values.
    var properties = {
        firstName: '',
        lastName: '',
        gender: birthGender || this.GenderType.male
    };

    // These become our properties and functions. Note that because
    // we are inside a closure, we can safely have private variables.
    return {
        firstName: function firstName(value) {
            if (typeof value === 'undefined') {
                return properties.firstName;
            }

            properties.firstName = value;
            return this.$self;
        },
        lastName: function lastName(value) {
            if (typeof value === 'undefined') {
                return properties.lastName;
            }

            properties.lastName = value;
            return this.$self;
        },
        gender: function gender() {
            return properties.gender;
        }
    };
});

var Parent = Person.extend(function Parent(birthGender) {
    this.$init(birthGender);

    return {
        init: function init(gender) {
        },
        lastName: function lastName() {
            var ln = this.$base();
            return this.$self.gender() === 0 ? ln + ', Jr.' : ln;
        }
    };
});

var parent = new Parent();

console.log(parent.$type); // type information
console.log(parent.GenderType); // undefined
console.log(parent.lastName); // ', Jr.'

```