"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skipLast = skipLast;
var identity_1 = require("../util/identity");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
/**
 * Skip a specified number of values before the completion of an observable.
 *
 * ![](skipLast.png)
 *
 * Returns an observable that will emit values as soon as it can, given a number of
 * skipped values. For example, if you `skipLast(3)` on a source, when the source
 * emits its fourth value, the first value the source emitted will finally be emitted
 * from the returned observable, as it is no longer part of what needs to be skipped.
 *
 * All values emitted by the result of `skipLast(N)` will be delayed by `N` emissions,
 * as each value is held in a buffer until enough values have been emitted that that
 * the buffered value may finally be sent to the consumer.
 *
 * After subscribing, unsubscribing will not result in the emission of the buffered
 * skipped values.
 *
 * ## Example
 *
 * Skip the last 2 values of an observable with many values
 *
 * ```ts
 * import { of, skipLast } from 'rxjs';
 *
 * const numbers = of(1, 2, 3, 4, 5);
 * const skipLastTwo = numbers.pipe(skipLast(2));
 * skipLastTwo.subscribe(x => console.log(x));
 *
 * // Results in:
 * // 1 2 3
 * // (4 and 5 are skipped)
 * ```
 *
 * @see {@link skip}
 * @see {@link skipUntil}
 * @see {@link skipWhile}
 * @see {@link take}
 *
 * @param skipCount Number of elements to skip from the end of the source Observable.
 * @return A function that returns an Observable that skips the last `count`
 * values emitted by the source Observable.
 */
function skipLast(skipCount) {
    return skipCount <= 0
        ? // For skipCounts less than or equal to zero, we are just mirroring the source.
            identity_1.identity
        : (0, lift_1.operate)(function (source, subscriber) {
            // A ring buffer to hold the values while we wait to see
            // if we can emit it or it's part of the "skipped" last values.
            // Note that it is the _same size_ as the skip count.
            var ring = new Array(skipCount);
            // The number of values seen so far. This is used to get
            // the index of the current value when it arrives.
            var seen = 0;
            source.subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function (value) {
                // Get the index of the value we have right now
                // relative to all other values we've seen, then
                // increment `seen`. This ensures we've moved to
                // the next slot in our ring buffer.
                var valueIndex = seen++;
                if (valueIndex < skipCount) {
                    // If we haven't seen enough values to fill our buffer yet,
                    // Then we aren't to a number of seen values where we can
                    // emit anything, so let's just start by filling the ring buffer.
                    ring[valueIndex] = value;
                }
                else {
                    // We are traversing over the ring array in such
                    // a way that when we get to the end, we loop back
                    // and go to the start.
                    var index = valueIndex % skipCount;
                    // Pull the oldest value out so we can emit it,
                    // and stuff the new value in it's place.
                    var oldValue = ring[index];
                    ring[index] = value;
                    // Emit the old value. It is important that this happens
                    // after we swap the value in the buffer, if it happens
                    // before we swap the value in the buffer, then a synchronous
                    // source can get the buffer out of whack.
                    subscriber.next(oldValue);
                }
            }));
            return function () {
                // Release our values in memory
                ring = null;
            };
        });
}
