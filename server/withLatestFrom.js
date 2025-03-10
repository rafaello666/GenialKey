"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withLatestFrom = withLatestFrom;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var innerFrom_1 = require("../observable/innerFrom");
var identity_1 = require("../util/identity");
var noop_1 = require("../util/noop");
var args_1 = require("../util/args");
/**
 * Combines the source Observable with other Observables to create an Observable
 * whose values are calculated from the latest values of each, only when the
 * source emits.
 *
 * <span class="informal">Whenever the source Observable emits a value, it
 * computes a formula using that value plus the latest values from other input
 * Observables, then emits the output of that formula.</span>
 *
 * ![](withLatestFrom.png)
 *
 * `withLatestFrom` combines each value from the source Observable (the
 * instance) with the latest values from the other input Observables only when
 * the source emits a value, optionally using a `project` function to determine
 * the value to be emitted on the output Observable. All input Observables must
 * emit at least one value before the output Observable will emit a value.
 *
 * ## Example
 *
 * On every click event, emit an array with the latest timer event plus the click event
 *
 * ```ts
 * import { fromEvent, interval, withLatestFrom } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const timer = interval(1000);
 * const result = clicks.pipe(withLatestFrom(timer));
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link combineLatest}
 *
 * @param inputs An input Observable to combine with the source Observable. More
 * than one input Observables may be given as argument. If the last parameter is
 * a function, it will be used as a projection function for combining values
 * together. When the function is called, it receives all values in order of the
 * Observables passed, where the first parameter is a value from the source
 * Observable. (e.g.
 * `a.pipe(withLatestFrom(b, c), map(([a1, b1, c1]) => a1 + b1 + c1))`). If this
 * is not passed, arrays will be emitted on the output Observable.
 * @return A function that returns an Observable of projected values from the
 * most recent values from each input Observable, or an array of the most
 * recent values from each input Observable.
 */
function withLatestFrom() {
    var inputs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        inputs[_i] = arguments[_i];
    }
    var project = (0, args_1.popResultSelector)(inputs);
    return (0, lift_1.operate)(function (source, subscriber) {
        var len = inputs.length;
        var otherValues = new Array(len);
        // An array of whether or not the other sources have emitted. Matched with them by index.
        // TODO: At somepoint, we should investigate the performance implications here, and look
        // into using a `Set()` and checking the `size` to see if we're ready.
        var hasValue = inputs.map(function () { return false; });
        // Flipped true when we have at least one value from all other sources and
        // we are ready to start emitting values.
        var ready = false;
        var _loop_1 = function (i) {
            (0, innerFrom_1.innerFrom)(inputs[i]).subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function (value) {
                otherValues[i] = value;
                if (!ready && !hasValue[i]) {
                    // If we're not ready yet, flag to show this observable has emitted.
                    hasValue[i] = true;
                    // Intentionally terse code.
                    // If all of our other observables have emitted, set `ready` to `true`,
                    // so we know we can start emitting values, then clean up the `hasValue` array,
                    // because we don't need it anymore.
                    (ready = hasValue.every(identity_1.identity)) && (hasValue = null);
                }
            }, 
            // Completing one of the other sources has
            // no bearing on the completion of our result.
            noop_1.noop));
        };
        // Other sources. Note that here we are not checking `subscriber.closed`,
        // this causes all inputs to be subscribed to, even if nothing can be emitted
        // from them. This is an important distinction because subscription constitutes
        // a side-effect.
        for (var i = 0; i < len; i++) {
            _loop_1(i);
        }
        // Source subscription
        source.subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function (value) {
            if (ready) {
                // We have at least one value from the other sources. Go ahead and emit.
                var values = __spreadArray([value], otherValues, true);
                subscriber.next(project ? project.apply(void 0, values) : values);
            }
        }));
    });
}
