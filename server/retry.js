"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retry = retry;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var identity_1 = require("../util/identity");
var timer_1 = require("../observable/timer");
var innerFrom_1 = require("../observable/innerFrom");
/**
 * Returns an Observable that mirrors the source Observable with the exception of an `error`.
 *
 * If the source Observable calls `error`, this method will resubscribe to the source Observable for a maximum of
 * `count` resubscriptions rather than propagating the `error` call.
 *
 * ![](retry.png)
 *
 * The number of retries is determined by the `count` parameter. It can be set either by passing a number to
 * `retry` function or by setting `count` property when `retry` is configured using {@link RetryConfig}. If
 * `count` is omitted, `retry` will try to resubscribe on errors infinite number of times.
 *
 * Any and all items emitted by the source Observable will be emitted by the resulting Observable, even those
 * emitted during failed subscriptions. For example, if an Observable fails at first but emits `[1, 2]` then
 * succeeds the second time and emits: `[1, 2, 3, 4, 5, complete]` then the complete stream of emissions and
 * notifications would be: `[1, 2, 1, 2, 3, 4, 5, complete]`.
 *
 * ## Example
 *
 * ```ts
 * import { interval, mergeMap, throwError, of, retry } from 'rxjs';
 *
 * const source = interval(1000);
 * const result = source.pipe(
 *   mergeMap(val => val > 5 ? throwError(() => 'Error!') : of(val)),
 *   retry(2) // retry 2 times on error
 * );
 *
 * result.subscribe({
 *   next: value => console.log(value),
 *   error: err => console.log(`${ err }: Retried 2 times then quit!`)
 * });
 *
 * // Output:
 * // 0..1..2..3..4..5..
 * // 0..1..2..3..4..5..
 * // 0..1..2..3..4..5..
 * // 'Error!: Retried 2 times then quit!'
 * ```
 *
 * @see {@link retryWhen}
 *
 * @param configOrCount Either number of retry attempts before failing or a
 * {@link RetryConfig} object.
 * @return A function that returns an Observable that will resubscribe to the
 * source stream when the source stream errors, at most `count` times.
 */
function retry(configOrCount) {
    if (configOrCount === void 0) { configOrCount = Infinity; }
    var config;
    if (configOrCount && typeof configOrCount === 'object') {
        config = configOrCount;
    }
    else {
        config = {
            count: configOrCount,
        };
    }
    var _a = config.count, count = _a === void 0 ? Infinity : _a, delay = config.delay, _b = config.resetOnSuccess, resetOnSuccess = _b === void 0 ? false : _b;
    return count <= 0
        ? identity_1.identity
        : (0, lift_1.operate)(function (source, subscriber) {
            var soFar = 0;
            var innerSub;
            var subscribeForRetry = function () {
                var syncUnsub = false;
                innerSub = source.subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function (value) {
                    // If we're resetting on success
                    if (resetOnSuccess) {
                        soFar = 0;
                    }
                    subscriber.next(value);
                }, 
                // Completions are passed through to consumer.
                undefined, function (err) {
                    if (soFar++ < count) {
                        // We are still under our retry count
                        var resub_1 = function () {
                            if (innerSub) {
                                innerSub.unsubscribe();
                                innerSub = null;
                                subscribeForRetry();
                            }
                            else {
                                syncUnsub = true;
                            }
                        };
                        if (delay != null) {
                            // The user specified a retry delay.
                            // They gave us a number, use a timer, otherwise, it's a function,
                            // and we're going to call it to get a notifier.
                            var notifier = typeof delay === 'number' ? (0, timer_1.timer)(delay) : (0, innerFrom_1.innerFrom)(delay(err, soFar));
                            var notifierSubscriber_1 = (0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function () {
                                // After we get the first notification, we
                                // unsubscribe from the notifier, because we don't want anymore
                                // and we resubscribe to the source.
                                notifierSubscriber_1.unsubscribe();
                                resub_1();
                            }, function () {
                                // The notifier completed without emitting.
                                // The author is telling us they want to complete.
                                subscriber.complete();
                            });
                            notifier.subscribe(notifierSubscriber_1);
                        }
                        else {
                            // There was no notifier given. Just resub immediately.
                            resub_1();
                        }
                    }
                    else {
                        // We're past our maximum number of retries.
                        // Just send along the error.
                        subscriber.error(err);
                    }
                }));
                if (syncUnsub) {
                    innerSub.unsubscribe();
                    innerSub = null;
                    subscribeForRetry();
                }
            };
            subscribeForRetry();
        });
}
