"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.last = last;
var EmptyError_1 = require("../util/EmptyError");
var filter_1 = require("./filter");
var takeLast_1 = require("./takeLast");
var throwIfEmpty_1 = require("./throwIfEmpty");
var defaultIfEmpty_1 = require("./defaultIfEmpty");
var identity_1 = require("../util/identity");
/**
 * Returns an Observable that emits only the last item emitted by the source Observable.
 * It optionally takes a predicate function as a parameter, in which case, rather than emitting
 * the last item from the source Observable, the resulting Observable will emit the last item
 * from the source Observable that satisfies the predicate.
 *
 * ![](last.png)
 *
 * It will emit an error notification if the source completes without notification or one that matches
 * the predicate. It returns the last value or if a predicate is provided last value that matches the
 * predicate. It returns the given default value if no notification is emitted or matches the predicate.
 *
 * ## Examples
 *
 * Last alphabet from the sequence
 *
 * ```ts
 * import { from, last } from 'rxjs';
 *
 * const source = from(['x', 'y', 'z']);
 * const result = source.pipe(last());
 *
 * result.subscribe(value => console.log(`Last alphabet: ${ value }`));
 *
 * // Outputs
 * // Last alphabet: z
 * ```
 *
 * Default value when the value in the predicate is not matched
 *
 * ```ts
 * import { from, last } from 'rxjs';
 *
 * const source = from(['x', 'y', 'z']);
 * const result = source.pipe(last(char => char === 'a', 'not found'));
 *
 * result.subscribe(value => console.log(`'a' is ${ value }.`));
 *
 * // Outputs
 * // 'a' is not found.
 * ```
 *
 * @see {@link skip}
 * @see {@link skipUntil}
 * @see {@link skipLast}
 * @see {@link skipWhile}
 * @see {@link first}
 *
 * @throws {EmptyError} Delivers an `EmptyError` to the Observer's `error`
 * callback if the Observable completes before any `next` notification was sent.
 *
 * @param predicate The condition any source emitted item has to satisfy.
 * @param defaultValue An optional default value to provide if last `predicate`
 * isn't met or no values were emitted.
 * @return A function that returns an Observable that emits only the last item
 * satisfying the given condition from the source, or an error notification
 * with an `EmptyError` object if no such items are emitted.
 */
function last(predicate, defaultValue) {
    var hasDefaultValue = arguments.length >= 2;
    return function (source) {
        return source.pipe(predicate ? (0, filter_1.filter)(function (v, i) { return predicate(v, i, source); }) : identity_1.identity, (0, takeLast_1.takeLast)(1), hasDefaultValue ? (0, defaultIfEmpty_1.defaultIfEmpty)(defaultValue) : (0, throwIfEmpty_1.throwIfEmpty)(function () { return new EmptyError_1.EmptyError(); }));
    };
}
