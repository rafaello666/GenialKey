"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInvalidObservableTypeError = createInvalidObservableTypeError;
/**
 * Creates the TypeError to throw if an invalid object is passed to `from` or `scheduled`.
 * @param input The object that was passed.
 */
function createInvalidObservableTypeError(input) {
    // TODO: We should create error codes that can be looked up, so this can be less verbose.
    return new TypeError("You provided ".concat(input !== null && typeof input === 'object' ? 'an invalid object' : "'".concat(input, "'"), " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable."));
}
