"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.take = take;
var empty_1 = require("../observable/empty");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
/**
 * Emits only the first `count` values emitted by the source Observable.
 *
 * <span class="informal">Takes the first `count` values from the source, then
 * completes.</span>
 *
 * ![](take.png)
 *
 * `take` returns an Observable that emits only the first `count` values emitted
 * by the source Observable. If the source emits fewer than `count` values then
 * all of its values are emitted. After that, it completes, regardless if the
 * source completes.
 *
 * ## Example
 *
 * Take the first 5 seconds of an infinite 1-second interval Observable
 *
 * ```ts
 * import { interval, take } from 'rxjs';
 *
 * const intervalCount = interval(1000);
 * const takeFive = intervalCount.pipe(take(5));
 * takeFive.subscribe(x => console.log(x));
 *
 * // Logs:
 * // 0
 * // 1
 * // 2
 * // 3
 * // 4
 * ```
 *
 * @see {@link takeLast}
 * @see {@link takeUntil}
 * @see {@link takeWhile}
 * @see {@link skip}
 *
 * @param count The maximum number of `next` values to emit.
 * @return A function that returns an Observable that emits only the first
 * `count` values emitted by the source Observable, or all of the values from
 * the source if the source emits fewer than `count` values.
 */
function take(count) {
    return count <= 0
        ? // If we are taking no values, that's empty.
            function () { return empty_1.EMPTY; }
        : (0, lift_1.operate)(function (source, subscriber) {
            var seen = 0;
            source.subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function (value) {
                // Increment the number of values we have seen,
                // then check it against the allowed count to see
                // if we are still letting values through.
                if (++seen <= count) {
                    subscriber.next(value);
                    // If we have met or passed our allowed count,
                    // we need to complete. We have to do <= here,
                    // because re-entrant code will increment `seen` twice.
                    if (count <= seen) {
                        subscriber.complete();
                    }
                }
            }));
        });
}
