"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.switchScan = switchScan;
var switchMap_1 = require("./switchMap");
var lift_1 = require("../util/lift");
// TODO: Generate a marble diagram for these docs.
/**
 * Applies an accumulator function over the source Observable where the
 * accumulator function itself returns an Observable, emitting values
 * only from the most recently returned Observable.
 *
 * <span class="informal">It's like {@link mergeScan}, but only the most recent
 * Observable returned by the accumulator is merged into the outer Observable.</span>
 *
 * @see {@link scan}
 * @see {@link mergeScan}
 * @see {@link switchMap}
 *
 * @param accumulator
 * The accumulator function called on each source value.
 * @param seed The initial accumulation value.
 * @return A function that returns an observable of the accumulated values.
 */
function switchScan(accumulator, seed) {
    return (0, lift_1.operate)(function (source, subscriber) {
        // The state we will keep up to date to pass into our
        // accumulator function at each new value from the source.
        var state = seed;
        // Use `switchMap` on our `source` to do the work of creating
        // this operator. Note the backwards order here of `switchMap()(source)`
        // to avoid needing to use `pipe` unnecessarily
        (0, switchMap_1.switchMap)(
        // On each value from the source, call the accumulator with
        // our previous state, the value and the index.
        function (value, index) { return accumulator(state, value, index); }, 
        // Using the deprecated result selector here as a dirty trick
        // to update our state with the flattened value.
        function (_, innerValue) { return ((state = innerValue), innerValue); })(source).subscribe(subscriber);
        return function () {
            // Release state on finalization
            state = null;
        };
    });
}
