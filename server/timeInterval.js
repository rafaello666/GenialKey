"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeInterval = void 0;
exports.timeInterval = timeInterval;
var async_1 = require("../scheduler/async");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
/**
 * Emits an object containing the current value, and the time that has
 * passed between emitting the current value and the previous value, which is
 * calculated by using the provided `scheduler`'s `now()` method to retrieve
 * the current time at each emission, then calculating the difference. The `scheduler`
 * defaults to {@link asyncScheduler}, so by default, the `interval` will be in
 * milliseconds.
 *
 * <span class="informal">Convert an Observable that emits items into one that
 * emits indications of the amount of time elapsed between those emissions.</span>
 *
 * ![](timeInterval.png)
 *
 * ## Example
 *
 * Emit interval between current value with the last value
 *
 * ```ts
 * import { interval, timeInterval } from 'rxjs';
 *
 * const seconds = interval(1000);
 *
 * seconds
 *   .pipe(timeInterval())
 *   .subscribe(value => console.log(value));
 *
 * // NOTE: The values will never be this precise,
 * // intervals created with `interval` or `setInterval`
 * // are non-deterministic.
 *
 * // { value: 0, interval: 1000 }
 * // { value: 1, interval: 1000 }
 * // { value: 2, interval: 1000 }
 * ```
 *
 * @param scheduler Scheduler used to get the current time.
 * @return A function that returns an Observable that emits information about
 * value and interval.
 */
function timeInterval(scheduler) {
    if (scheduler === void 0) { scheduler = async_1.asyncScheduler; }
    return (0, lift_1.operate)(function (source, subscriber) {
        var last = scheduler.now();
        source.subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function (value) {
            var now = scheduler.now();
            var interval = now - last;
            last = now;
            subscriber.next(new TimeInterval(value, interval));
        }));
    });
}
// TODO(benlesh): make this an interface, export the interface, but not the implemented class,
// there's no reason users should be manually creating this type.
var TimeInterval = /** @class */ (function () {
    /**
     * @deprecated Internal implementation detail, do not construct directly. Will be made an interface in v8.
     */
    function TimeInterval(value, interval) {
        this.value = value;
        this.interval = interval;
    }
    return TimeInterval;
}());
exports.TimeInterval = TimeInterval;
