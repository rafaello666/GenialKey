"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skip = skip;
var filter_1 = require("./filter");
/**
 * Returns an Observable that skips the first `count` items emitted by the source Observable.
 *
 * ![](skip.png)
 *
 * Skips the values until the sent notifications are equal or less than provided skip count. It raises
 * an error if skip count is equal or more than the actual number of emits and source raises an error.
 *
 * ## Example
 *
 * Skip the values before the emission
 *
 * ```ts
 * import { interval, skip } from 'rxjs';
 *
 * // emit every half second
 * const source = interval(500);
 * // skip the first 10 emitted values
 * const result = source.pipe(skip(10));
 *
 * result.subscribe(value => console.log(value));
 * // output: 10...11...12...13...
 * ```
 *
 * @see {@link last}
 * @see {@link skipWhile}
 * @see {@link skipUntil}
 * @see {@link skipLast}
 *
 * @param count The number of times, items emitted by source Observable should be skipped.
 * @return A function that returns an Observable that skips the first `count`
 * values emitted by the source Observable.
 */
function skip(count) {
    return (0, filter_1.filter)(function (_, index) { return count <= index; });
}
