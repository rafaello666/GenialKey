"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsubscriptionError = void 0;
var createErrorClass_1 = require("./createErrorClass");
/**
 * An error thrown when one or more errors have occurred during the
 * `unsubscribe` of a {@link Subscription}.
 */
exports.UnsubscriptionError = (0, createErrorClass_1.createErrorClass)(function (_super) {
    return function UnsubscriptionErrorImpl(errors) {
        _super(this);
        this.message = errors
            ? "".concat(errors.length, " errors occurred during unsubscription:\n").concat(errors.map(function (err, i) { return "".concat(i + 1, ") ").concat(err.toString()); }).join('\n  '))
            : '';
        this.name = 'UnsubscriptionError';
        this.errors = errors;
    };
});
