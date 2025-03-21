"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultIfEmpty = defaultIfEmpty;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
/**
 * Emits a given value if the source Observable completes without emitting any
 * `next` value, otherwise mirrors the source Observable.
 *
 * <span class="informal">If the source Observable turns out to be empty, then
 * this operator will emit a default value.</span>
 *
 * ![](defaultIfEmpty.png)
 *
 * `defaultIfEmpty` emits the values emitted by the source Observable or a
 * specified default value if the source Observable is empty (completes without
 * having emitted any `next` value).
 *
 * ## Example
 *
 * If no clicks happen in 5 seconds, then emit 'no clicks'
 *
 * ```ts
 * import { fromEvent, takeUntil, interval, defaultIfEmpty } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const clicksBeforeFive = clicks.pipe(takeUntil(interval(5000)));
 * const result = clicksBeforeFive.pipe(defaultIfEmpty('no clicks'));
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link empty}
 * @see {@link last}
 *
 * @param defaultValue The default value used if the source
 * Observable is empty.
 * @return A function that returns an Observable that emits either the
 * specified `defaultValue` if the source Observable emits no items, or the
 * values emitted by the source Observable.
 */
function defaultIfEmpty(defaultValue) {
    return (0, lift_1.operate)(function (source, subscriber) {
        var hasValue = false;
        source.subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function (value) {
            hasValue = true;
            subscriber.next(value);
        }, function () {
            if (!hasValue) {
                subscriber.next(defaultValue);
            }
            subscriber.complete();
        }));
    });
}
