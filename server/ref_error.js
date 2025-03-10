"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var resolve_1 = require("./resolve");
var MissingRefError = /** @class */ (function (_super) {
    __extends(MissingRefError, _super);
    function MissingRefError(resolver, baseId, ref, msg) {
        var _this = _super.call(this, msg || "can't resolve reference ".concat(ref, " from id ").concat(baseId)) || this;
        _this.missingRef = (0, resolve_1.resolveUrl)(resolver, baseId, ref);
        _this.missingSchema = (0, resolve_1.normalizeId)((0, resolve_1.getFullPath)(resolver, _this.missingRef));
        return _this;
    }
    return MissingRefError;
}(Error));
exports.default = MissingRefError;
