"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.map = map;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
/**
 * Applies a given `project` function to each value emitted by the source
 * Observable, and emits the resulting values as an Observable.
 *
 * <span class="informal">Like [Array.prototype.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map),
 * it passes each source value through a transformation function to get
 * corresponding output values.</span>
 *
 * ![](map.png)
 *
 * Similar to the well known `Array.prototype.map` function, this operator
 * applies a projection to each value and emits that projection in the output
 * Observable.
 *
 * ## Example
 *
 * Map every click to the `clientX` position of that click
 *
 * ```ts
 * import { fromEvent, map } from 'rxjs';
 *
 * const clicks = fromEvent<PointerEvent>(document, 'click');
 * const positions = clicks.pipe(map(ev => ev.clientX));
 *
 * positions.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link mapTo}
 * @see {@link pluck}
 *
 * @param project The function to apply to each `value` emitted by the source
 * Observable. The `index` parameter is the number `i` for the i-th emission
 * that has happened since the subscription, starting from the number `0`.
 * @param thisArg An optional argument to define what `this` is in the
 * `project` function.
 * @return A function that returns an Observable that emits the values from the
 * source Observable transformed by the given `project` function.
 */
function map(project, thisArg) {
    return (0, lift_1.operate)(function (source, subscriber) {
        // The index of the value from the source. Used with projection.
        var index = 0;
        // Subscribe to the source, all errors and completions are sent along
        // to the consumer.
        source.subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function (value) {
            // Call the projection function with the appropriate this context,
            // and send the resulting value to the consumer.
            subscriber.next(project.call(thisArg, value, index++));
        }));
    });
}
