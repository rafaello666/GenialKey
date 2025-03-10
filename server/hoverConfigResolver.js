"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hoverConfigResolver = void 0;
var coordinatesConfigResolver_1 = require("./coordinatesConfigResolver");
exports.hoverConfigResolver = __assign(__assign({}, coordinatesConfigResolver_1.coordinatesConfigResolver), { mouseOnly: function (value) {
        if (value === void 0) { value = true; }
        return value;
    } });
