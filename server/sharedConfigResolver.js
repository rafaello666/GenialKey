"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sharedConfigResolver = void 0;
var support_1 = require("./support");
exports.sharedConfigResolver = {
    target: function (value) {
        if (value) {
            return function () { return ('current' in value ? value.current : value); };
        }
        return undefined;
    },
    enabled: function (value) {
        if (value === void 0) { value = true; }
        return value;
    },
    window: function (value) {
        if (value === void 0) { value = support_1.SUPPORT.isBrowser ? window : undefined; }
        return value;
    },
    eventOptions: function (_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.passive, passive = _c === void 0 ? true : _c, _d = _b.capture, capture = _d === void 0 ? false : _d;
        return { passive: passive, capture: capture };
    },
    transform: function (value) {
        return value;
    }
};
