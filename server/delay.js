"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = delay;
var async_1 = require("../scheduler/async");
var delayWhen_1 = require("./delayWhen");
var timer_1 = require("../observable/timer");
/**
 * Delays the emission of items from the source Observable by a given timeout or
 * until a given Date.
 *
 * <span class="informal">Time shifts each item by some specified amount of
 * milliseconds.</span>
 *
 * ![](delay.svg)
 *
 * If the delay argument is a Number, this operator time shifts the source
 * Observable by that amount of time expressed in milliseconds. The relative
 * time intervals between the values are preserved.
 *
 * If the delay argument is a Date, this operator time shifts the start of the
 * Observable execution until the given date occurs.
 *
 * ## Examples
 *
 * Delay each click by one second
 *
 * ```ts
 * import { fromEvent, delay } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const delayedClicks = clicks.pipe(delay(1000)); // each click emitted after 1 second
 * delayedClicks.subscribe(x => console.log(x));
 * ```
 *
 * Delay all clicks until a future date happens
 *
 * ```ts
 * import { fromEvent, delay } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const date = new Date('March 15, 2050 12:00:00'); // in the future
 * const delayedClicks = clicks.pipe(delay(date)); // click emitted only after that date
 * delayedClicks.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link delayWhen}
 * @see {@link throttle}
 * @see {@link throttleTime}
 * @see {@link debounce}
 * @see {@link debounceTime}
 * @see {@link sample}
 * @see {@link sampleTime}
 * @see {@link audit}
 * @see {@link auditTime}
 *
 * @param due The delay duration in milliseconds (a `number`) or a `Date` until
 * which the emission of the source items is delayed.
 * @param scheduler The {@link SchedulerLike} to use for managing the timers
 * that handle the time-shift for each item.
 * @return A function that returns an Observable that delays the emissions of
 * the source Observable by the specified timeout or Date.
 */
function delay(due, scheduler) {
    if (scheduler === void 0) { scheduler = async_1.asyncScheduler; }
    var duration = (0, timer_1.timer)(due, scheduler);
    return (0, delayWhen_1.delayWhen)(function () { return duration; });
}
