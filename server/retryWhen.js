"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryWhen = retryWhen;
var innerFrom_1 = require("../observable/innerFrom");
var Subject_1 = require("../Subject");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
/**
 * Returns an Observable that mirrors the source Observable with the exception of an `error`. If the source Observable
 * calls `error`, this method will emit the Throwable that caused the error to the `ObservableInput` returned from `notifier`.
 * If that Observable calls `complete` or `error` then this method will call `complete` or `error` on the child
 * subscription. Otherwise this method will resubscribe to the source Observable.
 *
 * ![](retryWhen.png)
 *
 * Retry an observable sequence on error based on custom criteria.
 *
 * ## Example
 *
 * ```ts
 * import { interval, map, retryWhen, tap, delayWhen, timer } from 'rxjs';
 *
 * const source = interval(1000);
 * const result = source.pipe(
 *   map(value => {
 *     if (value > 5) {
 *       // error will be picked up by retryWhen
 *       throw value;
 *     }
 *     return value;
 *   }),
 *   retryWhen(errors =>
 *     errors.pipe(
 *       // log error message
 *       tap(value => console.log(`Value ${ value } was too high!`)),
 *       // restart in 5 seconds
 *       delayWhen(value => timer(value * 1000))
 *     )
 *   )
 * );
 *
 * result.subscribe(value => console.log(value));
 *
 * // results:
 * // 0
 * // 1
 * // 2
 * // 3
 * // 4
 * // 5
 * // 'Value 6 was too high!'
 * // - Wait 5 seconds then repeat
 * ```
 *
 * @see {@link retry}
 *
 * @param notifier Function that receives an Observable of notifications with which a
 * user can `complete` or `error`, aborting the retry.
 * @return A function that returns an Observable that mirrors the source
 * Observable with the exception of an `error`.
 * @deprecated Will be removed in v9 or v10, use {@link retry}'s `delay` option instead.
 * Will be removed in v9 or v10. Use {@link retry}'s {@link RetryConfig#delay delay} option instead.
 * Instead of `retryWhen(() => notify$)`, use: `retry({ delay: () => notify$ })`.
 */
function retryWhen(notifier) {
    return (0, lift_1.operate)(function (source, subscriber) {
        var innerSub;
        var syncResub = false;
        var errors$;
        var subscribeForRetryWhen = function () {
            innerSub = source.subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, undefined, undefined, function (err) {
                if (!errors$) {
                    errors$ = new Subject_1.Subject();
                    (0, innerFrom_1.innerFrom)(notifier(errors$)).subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function () {
                        // If we have an innerSub, this was an asynchronous call, kick off the retry.
                        // Otherwise, if we don't have an innerSub yet, that's because the inner subscription
                        // call hasn't even returned yet. We've arrived here synchronously.
                        // So we flag that we want to resub, such that we can ensure finalization
                        // happens before we resubscribe.
                        return innerSub ? subscribeForRetryWhen() : (syncResub = true);
                    }));
                }
                if (errors$) {
                    // We have set up the notifier without error.
                    errors$.next(err);
                }
            }));
            if (syncResub) {
                // Ensure that the inner subscription is torn down before
                // moving on to the next subscription in the synchronous case.
                // If we don't do this here, all inner subscriptions will not be
                // torn down until the entire observable is done.
                innerSub.unsubscribe();
                innerSub = null;
                // We may need to do this multiple times, so reset the flag.
                syncResub = false;
                // Resubscribe
                subscribeForRetryWhen();
            }
        };
        // Start the subscription
        subscribeForRetryWhen();
    });
}
