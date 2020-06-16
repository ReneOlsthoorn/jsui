(function () {
    "use strict";

    if (!Number.prototype.padLeft) {
        Number.prototype.padLeft = function (width, c) {
            var r = '', i, e;

            if (!c) {
                c = " ";
            }

            if (c.length > 1) {
                c = c.substr(0, 1);
            }

            if (this.toString().length >= width) {
                return this.toString();
            }

            e = width - this.toString().length;

            for (i = 0; i < e; i++) {
                r = r + c;
            }
            return r + this;
        };
    }

    if (typeof String.prototype.padLeft != 'function') {
        String.prototype.padLeft = function (len, c) {
            var s = this,
                c = c || '0';
            while (s.length < len) s = c + s;

            return s;
        };
    }

    if (typeof Array.prototype.forEach != 'function') {
        Array.prototype.forEach = function (callback) {
            for (var i = 0; i < this.length; i++) {
                callback.apply(this, [this[i], i, this]);
            }
        };
    }

    if (!Array.prototype.map) {
        Array.prototype.map = function (callback, thisArg) {

            var T, A, k;

            if (this == null) {
                throw new TypeError(' this is null or not defined');
            }

            // 1. Let O be the result of calling ToObject passing the |this| 
            //    value as the argument.
            var O = Object(this);

            // 2. Let lenValue be the result of calling the Get internal 
            //    method of O with the argument "length".
            // 3. Let len be ToUint32(lenValue).
            var len = O.length >>> 0;

            // 4. If IsCallable(callback) is false, throw a TypeError exception.
            // See: http://es5.github.com/#x9.11
            if (typeof callback !== 'function') {
                throw new TypeError(callback + ' is not a function');
            }

            // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
            if (arguments.length > 1) {
                T = thisArg;
            }

            // 6. Let A be a new array created as if by the expression new Array(len) 
            //    where Array is the standard built-in constructor with that name and 
            //    len is the value of len.
            A = new Array(len);

            // 7. Let k be 0
            k = 0;

            // 8. Repeat, while k < len
            while (k < len) {

                var kValue, mappedValue;

                // a. Let Pk be ToString(k).
                //   This is implicit for LHS operands of the in operator
                // b. Let kPresent be the result of calling the HasProperty internal 
                //    method of O with argument Pk.
                //   This step can be combined with c
                // c. If kPresent is true, then
                if (k in O) {

                    // i. Let kValue be the result of calling the Get internal 
                    //    method of O with argument Pk.
                    kValue = O[k];

                    // ii. Let mappedValue be the result of calling the Call internal 
                    //     method of callback with T as the this value and argument 
                    //     list containing kValue, k, and O.
                    mappedValue = callback.call(T, kValue, k, O);

                    // iii. Call the DefineOwnProperty internal method of A with arguments
                    // Pk, Property Descriptor
                    // { Value: mappedValue,
                    //   Writable: true,
                    //   Enumerable: true,
                    //   Configurable: true },
                    // and false.

                    // In browsers that support Object.defineProperty, use the following:
                    // Object.defineProperty(A, k, {
                    //   value: mappedValue,
                    //   writable: true,
                    //   enumerable: true,
                    //   configurable: true
                    // });

                    // For best browser support, use the following:
                    A[k] = mappedValue;
                }
                // d. Increase k by 1.
                k++;
            }

            // 9. return A
            return A;
        };
    }

    if (!String.prototype.trim) {
        String.prototype.trim = function () {
            return this.replace(/^\s*/, "").replace(/\s*$/, "");
        };
    }

    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (searchString, position) {
            position = position || 0;
            return this.substr(position, searchString.length) === searchString;
        };
    }

    if (!String.prototype.endsWith) {
        String.prototype.endsWith = function (suffix) {
            return this.indexOf(suffix, this.length - suffix.length) !== -1;
        };
    }

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (obj, start) {
            var i, j;

            for (i = (start || 0), j = this.length; i < j; i++) {
                if (this[i] === obj) {
                    return i;
                }
            }
            return -1;
        };
    }

    if (!Array.prototype.contains) {
        Array.prototype.contains = function (obj) {
            var i;

            for (i = 0; i < this.length; i++) {
                if (this[i] === obj) {
                    return true;
                }
            }
            return false;
        };
    }

    if (!String.prototype.contains) {
        String.prototype.contains = function (s) {
            return this.indexOf(s) !== -1;
        };
    }

    if (!String.prototype.includes) {
        String.prototype.includes = function (search, start) {
            'use strict';
            if (typeof start !== 'number') {
                start = 0;
            }

            if (start + search.length > this.length) {
                return false;
            } else {
                return this.indexOf(search, start) !== -1;
            }
        };
    }

    if (!String.prototype.ltrim) {
        String.prototype.ltrim = function () { return this.replace(/^\s+/, ''); };
    }

    if (!Function.prototype.bind) {
        Function.prototype.bind = function (obj) {
            var fn = this, args;

            if (arguments.length > 1) {
                args = [].slice.call(arguments, 1);

                return function () {
                    return arguments.length ? fn.apply(obj, args.concat([].slice.call(arguments))) : fn.apply(obj, args);
                };
            }

            return function () {
                return arguments.length ? fn.apply(obj, arguments) : fn.call(obj);
            };
        };
    }

    if (!Array.prototype.filter) {
        Array.prototype.filter = function (fun/*, thisArg*/) {
            'use strict';

            if (this === void 0 || this === null) {
                throw new TypeError();
            }

            var t = Object(this);
            var len = t.length >>> 0;
            if (typeof fun !== 'function') {
                throw new TypeError();
            }

            var res = [];
            var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
            for (var i = 0; i < len; i++) {
                if (i in t) {
                    var val = t[i];

                    // NOTE: Technically this should Object.defineProperty at
                    //       the next index, as push can be affected by
                    //       properties on Object.prototype and Array.prototype.
                    //       But that method's new, and collisions should be
                    //       rare, so use the more-compatible alternative.
                    if (fun.call(thisArg, val, i, t)) {
                        res.push(val);
                    }
                }
            }

            return res;
        };
    }

    if (!Array.prototype.distinct) {
        Array.prototype.distinct = function () {
            'use strict';

            var i,
                u = {},
                a = [];

            for (i = 0; i < this.length; i++) {
                if (!u.hasOwnProperty(this[i])) {
                    a.push(this[i]);
                    u[this[i]] = 1;
                }
            }
            return a;
        };
    }

})();
