"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buffer = buffer;
var lift_1 = require("../util/lift");
var noop_1 = require("../util/noop");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var innerFrom_1 = require("../observable/innerFrom");
/**
 * Buffers the source Observable values until `closingNotifier` emits.
 *
 * <span class="informal">Collects values from the past as an array, and emits
 * that array only when another Observable emits.</span>
 *
 * ![](buffer.png)
 *
 * Buffers the incoming Observable values until the given `closingNotifier`
 * `ObservableInput` (that internally gets converted to an Observable)
 * emits a value, at which point it emits the buffer on the output
 * Observable and starts a new buffer internally, awaiting the next time
 * `closingNotifier` emits.
 *
 * ## Example
 *
 * On every click, emit array of most recent interval events
 *
 * ```ts
 * import { fromEvent, interval, buffer } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const intervalEvents = interval(1000);
 * const buffered = intervalEvents.pipe(buffer(clicks));
 * buffered.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link bufferCount}
 * @see {@link bufferTime}
 * @see {@link bufferToggle}
 * @see {@link bufferWhen}
 * @see {@link window}
 *
 * @param closingNotifier An `ObservableInput` that signals the
 * buffer to be emitted on the output Observable.
 * @return A function that returns an Observable of buffers, which are arrays
 * of values.
 */
function buffer(closingNotifier) {
    return (0, lift_1.operate)(function (source, subscriber) {
        // The current buffered values.
        var currentBuffer = [];
        // Subscribe to our source.
        source.subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function (value) { return currentBuffer.push(value); }, function () {
            subscriber.next(currentBuffer);
            subscriber.complete();
        }));
        // Subscribe to the closing notifier.
        (0, innerFrom_1.innerFrom)(closingNotifier).subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function () {
            // Start a new buffer and emit the previous one.
            var b = currentBuffer;
            currentBuffer = [];
            subscriber.next(b);
        }, noop_1.noop));
        return function () {
            // Ensure buffered values are released on finalization.
            currentBuffer = null;
        };
    });
}
