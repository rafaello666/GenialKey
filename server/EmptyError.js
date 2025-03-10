"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptyError = void 0;
var createErrorClass_1 = require("./createErrorClass");
/**
 * An error thrown when an Observable or a sequence was queried but has no
 * elements.
 *
 * @see {@link first}
 * @see {@link last}
 * @see {@link single}
 * @see {@link firstValueFrom}
 * @see {@link lastValueFrom}
 */
exports.EmptyError = (0, createErrorClass_1.createErrorClass)(function (_super) {
    return function EmptyErrorImpl() {
        _super(this);
        this.name = 'EmptyError';
        this.message = 'no elements in sequence';
    };
});
