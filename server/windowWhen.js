"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.windowWhen = windowWhen;
var Subject_1 = require("../Subject");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var innerFrom_1 = require("../observable/innerFrom");
/**
 * Branch out the source Observable values as a nested Observable using a
 * factory function of closing Observables to determine when to start a new
 * window.
 *
 * <span class="informal">It's like {@link bufferWhen}, but emits a nested
 * Observable instead of an array.</span>
 *
 * ![](windowWhen.png)
 *
 * Returns an Observable that emits windows of items it collects from the source
 * Observable. The output Observable emits connected, non-overlapping windows.
 * It emits the current window and opens a new one whenever the Observable
 * produced by the specified `closingSelector` function emits an item. The first
 * window is opened immediately when subscribing to the output Observable.
 *
 * ## Example
 *
 * Emit only the first two clicks events in every window of [1-5] random seconds
 *
 * ```ts
 * import { fromEvent, windowWhen, interval, map, take, mergeAll } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(
 *   windowWhen(() => interval(1000 + Math.random() * 4000)),
 *   map(win => win.pipe(take(2))), // take at most 2 emissions from each window
 *   mergeAll()                     // flatten the Observable-of-Observables
 * );
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link window}
 * @see {@link windowCount}
 * @see {@link windowTime}
 * @see {@link windowToggle}
 * @see {@link bufferWhen}
 *
 * @param closingSelector A function that takes no arguments and returns an
 * {@link ObservableInput} (that gets converted to Observable) that signals
 * (on either `next` or `complete`) when to close the previous window and
 * start a new one.
 * @return A function that returns an Observable of windows, which in turn are
 * Observables.
 */
function windowWhen(closingSelector) {
    return (0, lift_1.operate)(function (source, subscriber) {
        var window;
        var closingSubscriber;
        /**
         * When we get an error, we have to notify both the
         * destination subscriber and the window.
         */
        var handleError = function (err) {
            window.error(err);
            subscriber.error(err);
        };
        /**
         * Called every time we need to open a window.
         * Recursive, as it will start the closing notifier, which
         * inevitably *should* call openWindow -- but may not if
         * it is a "never" observable.
         */
        var openWindow = function () {
            // We need to clean up our closing subscription,
            // we only cared about the first next or complete notification.
            closingSubscriber === null || closingSubscriber === void 0 ? void 0 : closingSubscriber.unsubscribe();
            // Close our window before starting a new one.
            window === null || window === void 0 ? void 0 : window.complete();
            // Start the new window.
            window = new Subject_1.Subject();
            subscriber.next(window.asObservable());
            // Get our closing notifier.
            var closingNotifier;
            try {
                closingNotifier = (0, innerFrom_1.innerFrom)(closingSelector());
            }
            catch (err) {
                handleError(err);
                return;
            }
            // Subscribe to the closing notifier, be sure
            // to capture the subscriber (aka Subscription)
            // so we can clean it up when we close the window
            // and open a new one.
            closingNotifier.subscribe((closingSubscriber = (0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, openWindow, openWindow, handleError)));
        };
        // Start the first window.
        openWindow();
        // Subscribe to the source
        source.subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function (value) { return window.next(value); }, function () {
            // The source completed, close the window and complete.
            window.complete();
            subscriber.complete();
        }, handleError, function () {
            // Be sure to clean up our closing subscription
            // when this tears down.
            closingSubscriber === null || closingSubscriber === void 0 ? void 0 : closingSubscriber.unsubscribe();
            window = null;
        }));
    });
}
