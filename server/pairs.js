"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pairs = pairs;
var from_1 = require("./from");
/**
 * Convert an object into an Observable of `[key, value]` pairs.
 *
 * <span class="informal">Turn entries of an object into a stream.</span>
 *
 * ![](pairs.png)
 *
 * `pairs` takes an arbitrary object and returns an Observable that emits arrays. Each
 * emitted array has exactly two elements - the first is a key from the object
 * and the second is a value corresponding to that key. Keys are extracted from
 * an object via `Object.keys` function, which means that they will be only
 * enumerable keys that are present on an object directly - not ones inherited
 * via prototype chain.
 *
 * By default, these arrays are emitted synchronously. To change that you can
 * pass a {@link SchedulerLike} as a second argument to `pairs`.
 *
 * ## Example
 *
 * Converts an object to an Observable
 *
 * ```ts
 * import { pairs } from 'rxjs';
 *
 * const obj = {
 *   foo: 42,
 *   bar: 56,
 *   baz: 78
 * };
 *
 * pairs(obj).subscribe({
 *   next: value => console.log(value),
 *   complete: () => console.log('Complete!')
 * });
 *
 * // Logs:
 * // ['foo', 42]
 * // ['bar', 56]
 * // ['baz', 78]
 * // 'Complete!'
 * ```
 *
 * ### Object.entries required
 *
 * In IE, you will need to polyfill `Object.entries` in order to use this.
 * [MDN has a polyfill here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries)
 *
 * @param obj The object to inspect and turn into an Observable sequence.
 * @param scheduler An optional IScheduler to schedule when resulting
 * Observable will emit values.
 * @returns An observable sequence of [key, value] pairs from the object.
 * @deprecated Use `from(Object.entries(obj))` instead. Will be removed in v8.
 */
function pairs(obj, scheduler) {
    return (0, from_1.from)(Object.entries(obj), scheduler);
}
