"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.takeLast = takeLast;
var empty_1 = require("../observable/empty");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
/**
 * Waits for the source to complete, then emits the last N values from the source,
 * as specified by the `count` argument.
 *
 * ![](takeLast.png)
 *
 * `takeLast` results in an observable that will hold values up to `count` values in memory,
 * until the source completes. It then pushes all values in memory to the consumer, in the
 * order they were received from the source, then notifies the consumer that it is
 * complete.
 *
 * If for some reason the source completes before the `count` supplied to `takeLast` is reached,
 * all values received until that point are emitted, and then completion is notified.
 *
 * **Warning**: Using `takeLast` with an observable that never completes will result
 * in an observable that never emits a value.
 *
 * ## Example
 *
 * Take the last 3 values of an Observable with many values
 *
 * ```ts
 * import { range, takeLast } from 'rxjs';
 *
 * const many = range(1, 100);
 * const lastThree = many.pipe(takeLast(3));
 * lastThree.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link take}
 * @see {@link takeUntil}
 * @see {@link takeWhile}
 * @see {@link skip}
 *
 * @param count The maximum number of values to emit from the end of
 * the sequence of values emitted by the source Observable.
 * @return A function that returns an Observable that emits at most the last
 * `count` values emitted by the source Observable.
 */
function takeLast(count) {
    return count <= 0
        ? function () { return empty_1.EMPTY; }
        : (0, lift_1.operate)(function (source, subscriber) {
            // This buffer will hold the values we are going to emit
            // when the source completes. Since we only want to take the
            // last N values, we can't emit until we're sure we're not getting
            // any more values.
            var buffer = [];
            source.subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function (value) {
                // Add the most recent value onto the end of our buffer.
                buffer.push(value);
                // If our buffer is now larger than the number of values we
                // want to take, we remove the oldest value from the buffer.
                count < buffer.length && buffer.shift();
            }, function () {
                // The source completed, we now know what are last values
                // are, emit them in the order they were received.
                for (var _i = 0, buffer_1 = buffer; _i < buffer_1.length; _i++) {
                    var value = buffer_1[_i];
                    subscriber.next(value);
                }
                subscriber.complete();
            }, 
            // Errors are passed through to the consumer
            undefined, function () {
                // During finalization release the values in our buffer.
                buffer = null;
            }));
        });
}
