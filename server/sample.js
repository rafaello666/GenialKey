"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sample = sample;
var innerFrom_1 = require("../observable/innerFrom");
var lift_1 = require("../util/lift");
var noop_1 = require("../util/noop");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
/**
 * Emits the most recently emitted value from the source Observable whenever
 * another Observable, the `notifier`, emits.
 *
 * <span class="informal">It's like {@link sampleTime}, but samples whenever
 * the `notifier` `ObservableInput` emits something.</span>
 *
 * ![](sample.png)
 *
 * Whenever the `notifier` `ObservableInput` emits a value, `sample`
 * looks at the source Observable and emits whichever value it has most recently
 * emitted since the previous sampling, unless the source has not emitted
 * anything since the previous sampling. The `notifier` is subscribed to as soon
 * as the output Observable is subscribed.
 *
 * ## Example
 *
 * On every click, sample the most recent `seconds` timer
 *
 * ```ts
 * import { fromEvent, interval, sample } from 'rxjs';
 *
 * const seconds = interval(1000);
 * const clicks = fromEvent(document, 'click');
 * const result = seconds.pipe(sample(clicks));
 *
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link audit}
 * @see {@link debounce}
 * @see {@link sampleTime}
 * @see {@link throttle}
 *
 * @param notifier The `ObservableInput` to use for sampling the
 * source Observable.
 * @return A function that returns an Observable that emits the results of
 * sampling the values emitted by the source Observable whenever the notifier
 * Observable emits value or completes.
 */
function sample(notifier) {
    return (0, lift_1.operate)(function (source, subscriber) {
        var hasValue = false;
        var lastValue = null;
        source.subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function (value) {
            hasValue = true;
            lastValue = value;
        }));
        (0, innerFrom_1.innerFrom)(notifier).subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function () {
            if (hasValue) {
                hasValue = false;
                var value = lastValue;
                lastValue = null;
                subscriber.next(value);
            }
        }, noop_1.noop));
    });
}
