"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundError = void 0;
var createErrorClass_1 = require("./createErrorClass");
/**
 * An error thrown when a value or values are missing from an
 * observable sequence.
 *
 * @see {@link operators/single}
 */
exports.NotFoundError = (0, createErrorClass_1.createErrorClass)(function (_super) {
    return function NotFoundErrorImpl(message) {
        _super(this);
        this.name = 'NotFoundError';
        this.message = message;
    };
});
