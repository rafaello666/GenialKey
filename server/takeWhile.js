"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.takeWhile = takeWhile;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
/**
 * Emits values emitted by the source Observable so long as each value satisfies
 * the given `predicate`, and then completes as soon as this `predicate` is not
 * satisfied.
 *
 * <span class="informal">Takes values from the source only while they pass the
 * condition given. When the first value does not satisfy, it completes.</span>
 *
 * ![](takeWhile.png)
 *
 * `takeWhile` subscribes and begins mirroring the source Observable. Each value
 * emitted on the source is given to the `predicate` function which returns a
 * boolean, representing a condition to be satisfied by the source values. The
 * output Observable emits the source values until such time as the `predicate`
 * returns false, at which point `takeWhile` stops mirroring the source
 * Observable and completes the output Observable.
 *
 * ## Example
 *
 * Emit click events only while the clientX property is greater than 200
 *
 * ```ts
 * import { fromEvent, takeWhile } from 'rxjs';
 *
 * const clicks = fromEvent<PointerEvent>(document, 'click');
 * const result = clicks.pipe(takeWhile(ev => ev.clientX > 200));
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link take}
 * @see {@link takeLast}
 * @see {@link takeUntil}
 * @see {@link skip}
 *
 * @param predicate A function that evaluates a value emitted by the source
 * Observable and returns a boolean. Also takes the (zero-based) index as the
 * second argument.
 * @param inclusive When set to `true` the value that caused `predicate` to
 * return `false` will also be emitted.
 * @return A function that returns an Observable that emits values from the
 * source Observable so long as each value satisfies the condition defined by
 * the `predicate`, then completes.
 */
function takeWhile(predicate, inclusive) {
    if (inclusive === void 0) { inclusive = false; }
    return (0, lift_1.operate)(function (source, subscriber) {
        var index = 0;
        source.subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function (value) {
            var result = predicate(value, index++);
            (result || inclusive) && subscriber.next(value);
            !result && subscriber.complete();
        }));
    });
}
