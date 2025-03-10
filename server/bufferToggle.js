"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bufferToggle = bufferToggle;
var Subscription_1 = require("../Subscription");
var lift_1 = require("../util/lift");
var innerFrom_1 = require("../observable/innerFrom");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var noop_1 = require("../util/noop");
var arrRemove_1 = require("../util/arrRemove");
/**
 * Buffers the source Observable values starting from an emission from
 * `openings` and ending when the output of `closingSelector` emits.
 *
 * <span class="informal">Collects values from the past as an array. Starts
 * collecting only when `opening` emits, and calls the `closingSelector`
 * function to get an Observable that tells when to close the buffer.</span>
 *
 * ![](bufferToggle.png)
 *
 * Buffers values from the source by opening the buffer via signals from an
 * Observable provided to `openings`, and closing and sending the buffers when
 * a Subscribable or Promise returned by the `closingSelector` function emits.
 *
 * ## Example
 *
 * Every other second, emit the click events from the next 500ms
 *
 * ```ts
 * import { fromEvent, interval, bufferToggle, EMPTY } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const openings = interval(1000);
 * const buffered = clicks.pipe(bufferToggle(openings, i =>
 *   i % 2 ? interval(500) : EMPTY
 * ));
 * buffered.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link buffer}
 * @see {@link bufferCount}
 * @see {@link bufferTime}
 * @see {@link bufferWhen}
 * @see {@link windowToggle}
 *
 * @param openings A Subscribable or Promise of notifications to start new
 * buffers.
 * @param closingSelector A function that takes
 * the value emitted by the `openings` observable and returns a Subscribable or Promise,
 * which, when it emits, signals that the associated buffer should be emitted
 * and cleared.
 * @return A function that returns an Observable of arrays of buffered values.
 */
function bufferToggle(openings, closingSelector) {
    return (0, lift_1.operate)(function (source, subscriber) {
        var buffers = [];
        // Subscribe to the openings notifier first
        (0, innerFrom_1.innerFrom)(openings).subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function (openValue) {
            var buffer = [];
            buffers.push(buffer);
            // We use this composite subscription, so that
            // when the closing notifier emits, we can tear it down.
            var closingSubscription = new Subscription_1.Subscription();
            var emitBuffer = function () {
                (0, arrRemove_1.arrRemove)(buffers, buffer);
                subscriber.next(buffer);
                closingSubscription.unsubscribe();
            };
            // The line below will add the subscription to the parent subscriber *and* the closing subscription.
            closingSubscription.add((0, innerFrom_1.innerFrom)(closingSelector(openValue)).subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, emitBuffer, noop_1.noop)));
        }, noop_1.noop));
        source.subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function (value) {
            // Value from our source. Add it to all pending buffers.
            for (var _i = 0, buffers_1 = buffers; _i < buffers_1.length; _i++) {
                var buffer = buffers_1[_i];
                buffer.push(value);
            }
        }, function () {
            // Source complete. Emit all pending buffers.
            while (buffers.length > 0) {
                subscriber.next(buffers.shift());
            }
            subscriber.complete();
        }));
    });
}
