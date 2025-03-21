"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elementAt = elementAt;
var ArgumentOutOfRangeError_1 = require("../util/ArgumentOutOfRangeError");
var filter_1 = require("./filter");
var throwIfEmpty_1 = require("./throwIfEmpty");
var defaultIfEmpty_1 = require("./defaultIfEmpty");
var take_1 = require("./take");
/**
 * Emits the single value at the specified `index` in a sequence of emissions
 * from the source Observable.
 *
 * <span class="informal">Emits only the i-th value, then completes.</span>
 *
 * ![](elementAt.png)
 *
 * `elementAt` returns an Observable that emits the item at the specified
 * `index` in the source Observable, or a default value if that `index` is out
 * of range and the `default` argument is provided. If the `default` argument is
 * not given and the `index` is out of range, the output Observable will emit an
 * `ArgumentOutOfRangeError` error.
 *
 * ## Example
 *
 * Emit only the third click event
 *
 * ```ts
 * import { fromEvent, elementAt } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(elementAt(2));
 * result.subscribe(x => console.log(x));
 *
 * // Results in:
 * // click 1 = nothing
 * // click 2 = nothing
 * // click 3 = MouseEvent object logged to console
 * ```
 *
 * @see {@link first}
 * @see {@link last}
 * @see {@link skip}
 * @see {@link single}
 * @see {@link take}
 *
 * @throws {ArgumentOutOfRangeError} When using `elementAt(i)`, it delivers an
 * `ArgumentOutOfRangeError` to the Observer's `error` callback if `i < 0` or the
 * Observable has completed before emitting the i-th `next` notification.
 *
 * @param index Is the number `i` for the i-th source emission that has happened
 * since the subscription, starting from the number `0`.
 * @param defaultValue The default value returned for missing indices.
 * @return A function that returns an Observable that emits a single item, if
 * it is found. Otherwise, it will emit the default value if given. If not, it
 * emits an error.
 */
function elementAt(index, defaultValue) {
    if (index < 0) {
        throw new ArgumentOutOfRangeError_1.ArgumentOutOfRangeError();
    }
    var hasDefaultValue = arguments.length >= 2;
    return function (source) {
        return source.pipe((0, filter_1.filter)(function (v, i) { return i === index; }), (0, take_1.take)(1), hasDefaultValue ? (0, defaultIfEmpty_1.defaultIfEmpty)(defaultValue) : (0, throwIfEmpty_1.throwIfEmpty)(function () { return new ArgumentOutOfRangeError_1.ArgumentOutOfRangeError(); }));
    };
}
