"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interval = interval;
var async_1 = require("../scheduler/async");
var timer_1 = require("./timer");
/**
 * Creates an Observable that emits sequential numbers every specified
 * interval of time, on a specified {@link SchedulerLike}.
 *
 * <span class="informal">Emits incremental numbers periodically in time.</span>
 *
 * ![](interval.png)
 *
 * `interval` returns an Observable that emits an infinite sequence of
 * ascending integers, with a constant interval of time of your choosing
 * between those emissions. The first emission is not sent immediately, but
 * only after the first period has passed. By default, this operator uses the
 * `async` {@link SchedulerLike} to provide a notion of time, but you may pass any
 * {@link SchedulerLike} to it.
 *
 * ## Example
 *
 * Emits ascending numbers, one every second (1000ms) up to the number 3
 *
 * ```ts
 * import { interval, take } from 'rxjs';
 *
 * const numbers = interval(1000);
 *
 * const takeFourNumbers = numbers.pipe(take(4));
 *
 * takeFourNumbers.subscribe(x => console.log('Next: ', x));
 *
 * // Logs:
 * // Next: 0
 * // Next: 1
 * // Next: 2
 * // Next: 3
 * ```
 *
 * @see {@link timer}
 * @see {@link delay}
 *
 * @param period The interval size in milliseconds (by default) or the time unit determined
 * by the scheduler's clock.
 * @param scheduler The {@link SchedulerLike} to use for scheduling the emission of values,
 * and providing a notion of "time".
 * @return An Observable that emits a sequential number each time interval.
 */
function interval(period, scheduler) {
    if (period === void 0) { period = 0; }
    if (scheduler === void 0) { scheduler = async_1.asyncScheduler; }
    if (period < 0) {
        // We cannot schedule an interval in the past.
        period = 0;
    }
    return (0, timer_1.timer)(period, period, scheduler);
}
