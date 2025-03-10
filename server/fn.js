"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.call = call;
exports.noop = noop;
exports.chain = chain;
exports.assignDefault = assignDefault;
function call(v) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    if (typeof v === 'function') {
        // @ts-ignore
        return v.apply(void 0, args);
    }
    else {
        return v;
    }
}
function noop() { }
function chain() {
    var fns = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        fns[_i] = arguments[_i];
    }
    if (fns.length === 0)
        return noop;
    if (fns.length === 1)
        return fns[0];
    return function () {
        var result;
        for (var _i = 0, fns_1 = fns; _i < fns_1.length; _i++) {
            var fn = fns_1[_i];
            result = fn.apply(this, arguments) || result;
        }
        return result;
    };
}
function assignDefault(value, fallback) {
    return Object.assign({}, fallback, value || {});
}
