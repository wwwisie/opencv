// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.com/#x15.4.4.18
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function forEach(callback, thisArg) {
      'use strict';
      var T, k;
      if (this == null) {
        throw new TypeError("this is null or not defined");
      }
      var kValue,
          O = Object(this),
          len = O.length >>> 0;
      if ({}.toString.call(callback) !== "[object Function]") {
        throw new TypeError(callback + " is not a function");
      }
      if (arguments.length >= 2) {
        T = thisArg;
      }
      k = 0;
      while (k < len) {
        if (k in O) {
          kValue = O[k];
          callback.call(T, kValue, k, O);
        }
        k++;
      }
    };
  }