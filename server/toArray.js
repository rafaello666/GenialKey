"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toArray = toArray;
var reduce_1 = require("./reduce");
var lift_1 = require("../util/lift");
var arrReducer = function (arr, value) { return (arr.push(value), arr); };
/**
 * Collects all source emissions and emits them as an array when the source completes.
 *
 * <span class="informal">Get all values inside an array when the source completes</span>
 *
 * ![](toArray.png)
 *
 * `toArray` will wait until the source Observable completes before emitting
 * the array containing all emissions. When the source Observable errors no
 * array will be emitted.
 *
 * ## Example
 *
 * ```ts
 * import { interval, take, toArray } from 'rxjs';
 *
 * const source = interval(1000);
 * const example = source.pipe(
 *   take(10),
 *   toArray()
 * );
 *
 * example.subscribe(value => console.log(value));
 *
 * // output: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
 * ```
 *
 * @return A function that returns an Observable that emits an array of items
 * emitted by the source Observable when source completes.
 */
function toArray() {
    // Because arrays are mutable, and we're mutating the array in this
    // reducer process, we have to encapsulate the creation of the initial
    // array within this `operate` function.
    return (0, lift_1.operate)(function (source, subscriber) {
        (0, reduce_1.reduce)(arrReducer, [])(source).subscribe(subscriber);
    });
}
