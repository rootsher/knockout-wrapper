define(['when', 'knockout'], function (when, ko) {
    // ### Library content ###

    function KnockoutModel(container) {
        this._container = container || undefined;
        this._elements = {}; // own model
        this._promises = [];
        this._caller = [];
    }

    /**
     * Default everything elements will be dynamic observable. If you want create static element set option flag static to true.
     */
    KnockoutModel.prototype.observe = function (element, value, options) {
        // Set default properties.
        if (!options) {
            options = {};
        }

        // Check if model exists and element not exists in model.
        if (this._elements && (this._elements[element] !== undefined)) {
            return;
        }

        // Set value is promise as default.
        value = when(value);

        // Build promises array.
        this._promises.push(value);

        this._caller.push({
            element: element,
            options: options
        });
    };

    KnockoutModel.prototype.call = function (element, method, fn) {
        fn = fn || undefined;

        // Check if model exists and element not exists in model.
        if (!this._elements || (this._elements[element] === undefined)) {
            return;
        }

        var elementIsObservable = (Object.prototype.toString.call(this._elements[element]) === '[object Function]');
        var operateValue;

        if (elementIsObservable && ko.isObservable(this._elements[element])) {
            operateValue = this._elements[element]();
        } else {
            operateValue = this._elements[element];
        }

        if (Object.prototype.toString.call(operateValue) === '[object Array]') {
            if (method === 'shift') {
                this._elements[element].shift(); // Removes the first value from the array and returns it.
            } else if (method === 'reverse') {
                this._elements[element].reverse(); // Reverses the order of the array.
            } else if (method === 'sort') {
                this._elements[element].sort(fn); // Sorts the array contents.
            } else if (method === 'pop') {
                this._elements[element].pop(); // Removes the last value from the array and returns it.
            }
        }
    };

    KnockoutModel.prototype.modify = function (element, value, method, idKey) {
        var self = this;

        // Check if model exists and element not exists in model.
        if (!this._elements || (this._elements[element] === undefined)) {
            return;
        }

        function setValue(value) {
            var elementIsObservable = (Object.prototype.toString.call(self._elements[element]) === '[object Function]');
            var operateValue;

            if (elementIsObservable && ko.isObservable(self._elements[element])) {
                operateValue = self._elements[element]();
            } else {
                operateValue = self._elements[element];
            }

            if (Object.prototype.toString.call(operateValue) === '[object Array]') {
                if (method === 'push') {
                    self._elements[element].push(value); // Adds a new item to the end of array.
                } else if (method === 'unshift') {
                    self._elements[element].unshift(value); // Inserts a new item at the beginning of the array.
                } else if (method === 'remove') {
                     // Removes all values that equal value and returns them as an array.
                    self._elements[element].remove(function (item) {
                        return item[idKey] === String(value);
                    });
                } else {
                    // Check if static element is enable.
                    if (self._caller.some(function (caller) {
                        return ((element === caller.element) && (caller.options.static !== true));
                    })) {
                        self._elements[element](value);
                    } else {
                        self._elements[element] = value;
                    }
                }
                return;
            }

            if (elementIsObservable) {
                self._elements[element](value);
            } else {
                self._elements[element] = value;
            }
        }

        if (when.isPromiseLike(value)) {
            // Set value is promise as default.
            var promiseValue = when(value);

            return promiseValue.then(setValue);
        }
        setValue(value);
    };

    KnockoutModel.prototype.get = function (element) {
        var self = this;

        // Check if model exists and element not exists in model.
        if (!this._elements || (this._elements[element] === undefined)) {
            return;
        }

        // Check if static element is enable.
        if (self._caller.some(function (caller) {
            return ((element === caller.element) && (caller.options.static !== true));
        })) {
            return self._elements[element]();
        } else {
            return self._elements[element];
        }
    };

    KnockoutModel.prototype.apply = function () {
        var self = this;

        return when.all(this._promises).then(function (values) {
            values.forEach(function (value, i) {
                var element = self._caller[i].element;
                var options = self._caller[i].options;

                // Check if option exists and static is set to true.
                if (options && (options.static === true)) {
                    // Warning: If value is function this is set on model.
                    self._elements[element] = value;
                    return self._elements;
                }

                var type = Object.prototype.toString.call(value);

                // Check type and respectively observed or computed.
                if (type === '[object Array]') {
                    self._elements[element] = ko.observableArray(value);
                } else if ((type === '[object String]') || (type === '[object Number]') || (type === '[object Boolean]')) {
                    self._elements[element] = ko.observable(value);
                } else if (type === '[object Function]') {
                    if (self._caller[i].options.type === 'computed') {
                        self._elements[element] = ko.computed(value, self._elements);
                    } else {
                        self._elements[element] = ko.observable(value);
                    }
                } else if (type === '[object Object]') {
                    self._elements[element] = ko.observable(value);
                }
            });

            return self._elements;
        }).then(function (model) {
            ko.applyBindings(model, self._container);
        });
    };

    return KnockoutModel;
});