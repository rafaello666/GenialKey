"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repeat = repeat;
var empty_1 = require("../observable/empty");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var innerFrom_1 = require("../observable/innerFrom");
var timer_1 = require("../observable/timer");
/**
 * Returns an Observable that will resubscribe to the source stream when the source stream completes.
 *
 * <span class="informal">Repeats all values emitted on the source. It's like {@link retry}, but for non error cases.</span>
 *
 * ![](repeat.png)
 *
 * Repeat will output values from a source until the source completes, then it will resubscribe to the
 * source a specified number of times, with a specified delay. Repeat can be particularly useful in
 * combination with closing operators like {@link take}, {@link takeUntil}, {@link first}, or {@link takeWhile},
 * as it can be used to restart a source again from scratch.
 *
 * Repeat is very similar to {@link retry}, where {@link retry} will resubscribe to the source in the error case, but
 * `repeat` will resubscribe if the source completes.
 *
 * Note that `repeat` will _not_ catch errors. Use {@link retry} for that.
 *
 * - `repeat(0)` returns an empty observable
 * - `repeat()` will repeat forever
 * - `repeat({ delay: 200 })` will repeat forever, with a delay of 200ms between repetitions.
 * - `repeat({ count: 2, delay: 400 })` will repeat twice, with a delay of 400ms between repetitions.
 * - `repeat({ delay: (count) => timer(count * 1000) })` will repeat forever, but will have a delay that grows by one second for each repetition.
 *
 * ## Example
 *
 * Repeat a message stream
 *
 * ```ts
 * import { of, repeat } from 'rxjs';
 *
 * const source = of('Repeat message');
 * const result = source.pipe(repeat(3));
 *
 * result.subscribe(x => console.log(x));
 *
 * // Results
 * // 'Repeat message'
 * // 'Repeat message'
 * // 'Repeat message'
 * ```
 *
 * Repeat 3 values, 2 times
 *
 * ```ts
 * import { interval, take, repeat } from 'rxjs';
 *
 * const source = interval(1000);
 * const result = source.pipe(take(3), repeat(2));
 *
 * result.subscribe(x => console.log(x));
 *
 * // Results every second
 * // 0
 * // 1
 * // 2
 * // 0
 * // 1
 * // 2
 * ```
 *
 * Defining two complex repeats with delays on the same source.
 * Note that the second repeat cannot be called until the first
 * repeat as exhausted it's count.
 *
 * ```ts
 * import { defer, of, repeat } from 'rxjs';
 *
 * const source = defer(() => {
 *    return of(`Hello, it is ${new Date()}`)
 * });
 *
 * source.pipe(
 *    // Repeat 3 times with a delay of 1 second between repetitions
 *    repeat({
 *      count: 3,
 *      delay: 1000,
 *    }),
 *
 *    // *Then* repeat forever, but with an exponential step-back
 *    // maxing out at 1 minute.
 *    repeat({
 *      delay: (count) => timer(Math.min(60000, 2 ^ count * 1000))
 *    })
 * )
 * ```
 *
 * @see {@link repeatWhen}
 * @see {@link retry}
 *
 * @param countOrConfig Either the number of times the source Observable items are repeated
 * (a count of 0 will yield an empty Observable) or a {@link RepeatConfig} object.
 */
function repeat(countOrConfig) {
    var _a;
    var count = Infinity;
    var delay;
    if (countOrConfig != null) {
        if (typeof countOrConfig === 'object') {
            (_a = countOrConfig.count, count = _a === void 0 ? Infinity : _a, delay = countOrConfig.delay);
        }
        else {
            count = countOrConfig;
        }
    }
    return count <= 0
        ? function () { return empty_1.EMPTY; }
        : (0, lift_1.operate)(function (source, subscriber) {
            var soFar = 0;
            var sourceSub;
            var resubscribe = function () {
                sourceSub === null || sourceSub === void 0 ? void 0 : sourceSub.unsubscribe();
                sourceSub = null;
                if (delay != null) {
                    var notifier = typeof delay === 'number' ? (0, timer_1.timer)(delay) : (0, innerFrom_1.innerFrom)(delay(soFar));
                    var notifierSubscriber_1 = (0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function () {
                        notifierSubscriber_1.unsubscribe();
                        subscribeToSource();
                    });
                    notifier.subscribe(notifierSubscriber_1);
                }
                else {
                    subscribeToSource();
                }
            };
            var subscribeToSource = function () {
                var syncUnsub = false;
                sourceSub = source.subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, undefined, function () {
                    if (++soFar < count) {
                        if (sourceSub) {
                            resubscribe();
                        }
                        else {
                            syncUnsub = true;
                        }
                    }
                    else {
                        subscriber.complete();
                    }
                }));
                if (syncUnsub) {
                    resubscribe();
                }
            };
            subscribeToSource();
        });
}
