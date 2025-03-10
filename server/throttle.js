"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throttle = throttle;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var innerFrom_1 = require("../observable/innerFrom");
/**
 * Emits a value from the source Observable, then ignores subsequent source
 * values for a duration determined by another Observable, then repeats this
 * process.
 *
 * <span class="informal">It's like {@link throttleTime}, but the silencing
 * duration is determined by a second Observable.</span>
 *
 * ![](throttle.svg)
 *
 * `throttle` emits the source Observable values on the output Observable
 * when its internal timer is disabled, and ignores source values when the timer
 * is enabled. Initially, the timer is disabled. As soon as the first source
 * value arrives, it is forwarded to the output Observable, and then the timer
 * is enabled by calling the `durationSelector` function with the source value,
 * which returns the "duration" Observable. When the duration Observable emits a
 * value, the timer is disabled, and this process repeats for the
 * next source value.
 *
 * ## Example
 *
 * Emit clicks at a rate of at most one click per second
 *
 * ```ts
 * import { fromEvent, throttle, interval } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(throttle(() => interval(1000)));
 *
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link audit}
 * @see {@link debounce}
 * @see {@link delayWhen}
 * @see {@link sample}
 * @see {@link throttleTime}
 *
 * @param durationSelector A function that receives a value from the source
 * Observable, for computing the silencing duration for each source value,
 * returned as an `ObservableInput`.
 * @param config A configuration object to define `leading` and `trailing`
 * behavior. Defaults to `{ leading: true, trailing: false }`.
 * @return A function that returns an Observable that performs the throttle
 * operation to limit the rate of emissions from the source.
 */
function throttle(durationSelector, config) {
    return (0, lift_1.operate)(function (source, subscriber) {
        var _a = config !== null && config !== void 0 ? config : {}, _b = _a.leading, leading = _b === void 0 ? true : _b, _c = _a.trailing, trailing = _c === void 0 ? false : _c;
        var hasValue = false;
        var sendValue = null;
        var throttled = null;
        var isComplete = false;
        var endThrottling = function () {
            throttled === null || throttled === void 0 ? void 0 : throttled.unsubscribe();
            throttled = null;
            if (trailing) {
                send();
                isComplete && subscriber.complete();
            }
        };
        var cleanupThrottling = function () {
            throttled = null;
            isComplete && subscriber.complete();
        };
        var startThrottle = function (value) {
            return (throttled = (0, innerFrom_1.innerFrom)(durationSelector(value)).subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, endThrottling, cleanupThrottling)));
        };
        var send = function () {
            if (hasValue) {
                // Ensure we clear out our value and hasValue flag
                // before we emit, otherwise reentrant code can cause
                // issues here.
                hasValue = false;
                var value = sendValue;
                sendValue = null;
                // Emit the value.
                subscriber.next(value);
                !isComplete && startThrottle(value);
            }
        };
        source.subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, 
        // Regarding the presence of throttled.closed in the following
        // conditions, if a synchronous duration selector is specified - weird,
        // but legal - an already-closed subscription will be assigned to
        // throttled, so the subscription's closed property needs to be checked,
        // too.
        function (value) {
            hasValue = true;
            sendValue = value;
            !(throttled && !throttled.closed) && (leading ? send() : startThrottle(value));
        }, function () {
            isComplete = true;
            !(trailing && hasValue && throttled && !throttled.closed) && subscriber.complete();
        }));
    });
}
