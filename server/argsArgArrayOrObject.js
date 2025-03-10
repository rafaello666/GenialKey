"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.argsArgArrayOrObject = argsArgArrayOrObject;
var isArray = Array.isArray;
var getPrototypeOf = Object.getPrototypeOf, objectProto = Object.prototype, getKeys = Object.keys;
/**
 * Used in functions where either a list of arguments, a single array of arguments, or a
 * dictionary of arguments can be returned. Returns an object with an `args` property with
 * the arguments in an array, if it is a dictionary, it will also return the `keys` in another
 * property.
 */
function argsArgArrayOrObject(args) {
    if (args.length === 1) {
        var first_1 = args[0];
        if (isArray(first_1)) {
            return { args: first_1, keys: null };
        }
        if (isPOJO(first_1)) {
            var keys = getKeys(first_1);
            return {
                args: keys.map(function (key) { return first_1[key]; }),
                keys: keys,
            };
        }
    }
    return { args: args, keys: null };
}
function isPOJO(obj) {
    return obj && typeof obj === 'object' && getPrototypeOf(obj) === objectProto;
}
