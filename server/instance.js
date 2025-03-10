"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("../core");
var _1 = require(".");
var requireFromString = require("require-from-string");
var AjvPack = /** @class */ (function () {
    function AjvPack(ajv) {
        this.ajv = ajv;
    }
    AjvPack.prototype.validate = function (schemaKeyRef, data) {
        return core_1.default.prototype.validate.call(this, schemaKeyRef, data);
    };
    AjvPack.prototype.compile = function (schema, meta) {
        return this.getStandalone(this.ajv.compile(schema, meta));
    };
    AjvPack.prototype.getSchema = function (keyRef) {
        var v = this.ajv.getSchema(keyRef);
        if (!v)
            return undefined;
        return this.getStandalone(v);
    };
    AjvPack.prototype.getStandalone = function (v) {
        return requireFromString((0, _1.default)(this.ajv, v));
    };
    AjvPack.prototype.addSchema = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        (_a = this.ajv.addSchema).call.apply(_a, __spreadArray([this.ajv], args, false));
        return this;
    };
    AjvPack.prototype.addKeyword = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        (_a = this.ajv.addKeyword).call.apply(_a, __spreadArray([this.ajv], args, false));
        return this;
    };
    return AjvPack;
}());
exports.default = AjvPack;
