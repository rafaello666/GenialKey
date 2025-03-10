"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bufferCount = bufferCount;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var arrRemove_1 = require("../util/arrRemove");
/**
 * Buffers the source Observable values until the size hits the maximum
 * `bufferSize` given.
 *
 * <span class="informal">Collects values from the past as an array, and emits
 * that array only when its size reaches `bufferSize`.</span>
 *
 * ![](bufferCount.png)
 *
 * Buffers a number of values from the source Observable by `bufferSize` then
 * emits the buffer and clears it, and starts a new buffer each
 * `startBufferEvery` values. If `startBufferEvery` is not provided or is
 * `null`, then new buffers are started immediately at the start of the source
 * and when each buffer closes and is emitted.
 *
 * ## Examples
 *
 * Emit the last two click events as an array
 *
 * ```ts
 * import { fromEvent, bufferCount } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const buffered = clicks.pipe(bufferCount(2));
 * buffered.subscribe(x => console.log(x));
 * ```
 *
 * On every click, emit the last two click events as an array
 *
 * ```ts
 * import { fromEvent, bufferCount } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const buffered = clicks.pipe(bufferCount(2, 1));
 * buffered.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link buffer}
 * @see {@link bufferTime}
 * @see {@link bufferToggle}
 * @see {@link bufferWhen}
 * @see {@link pairwise}
 * @see {@link windowCount}
 *
 * @param bufferSize The maximum size of the buffer emitted.
 * @param startBufferEvery Interval at which to start a new buffer.
 * For example if `startBufferEvery` is `2`, then a new buffer will be started
 * on every other value from the source. A new buffer is started at the
 * beginning of the source by default.
 * @return A function that returns an Observable of arrays of buffered values.
 */
function bufferCount(bufferSize, startBufferEvery) {
    if (startBufferEvery === void 0) { startBufferEvery = null; }
    // If no `startBufferEvery` value was supplied, then we're
    // opening and closing on the bufferSize itself.
    startBufferEvery = startBufferEvery !== null && startBufferEvery !== void 0 ? startBufferEvery : bufferSize;
    return (0, lift_1.operate)(function (source, subscriber) {
        var buffers = [];
        var count = 0;
        source.subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function (value) {
            var toEmit = null;
            // Check to see if we need to start a buffer.
            // This will start one at the first value, and then
            // a new one every N after that.
            if (count++ % startBufferEvery === 0) {
                buffers.push([]);
            }
            // Push our value into our active buffers.
            for (var _i = 0, buffers_1 = buffers; _i < buffers_1.length; _i++) {
                var buffer = buffers_1[_i];
                buffer.push(value);
                // Check to see if we're over the bufferSize
                // if we are, record it so we can emit it later.
                // If we emitted it now and removed it, it would
                // mutate the `buffers` array while we're looping
                // over it.
                if (bufferSize <= buffer.length) {
                    toEmit = toEmit !== null && toEmit !== void 0 ? toEmit : [];
                    toEmit.push(buffer);
                }
            }
            if (toEmit) {
                // We have found some buffers that are over the
                // `bufferSize`. Emit them, and remove them from our
                // buffers list.
                for (var _a = 0, toEmit_1 = toEmit; _a < toEmit_1.length; _a++) {
                    var buffer = toEmit_1[_a];
                    (0, arrRemove_1.arrRemove)(buffers, buffer);
                    subscriber.next(buffer);
                }
            }
        }, function () {
            // When the source completes, emit all of our
            // active buffers.
            for (var _i = 0, buffers_2 = buffers; _i < buffers_2.length; _i++) {
                var buffer = buffers_2[_i];
                subscriber.next(buffer);
            }
            subscriber.complete();
        }, 
        // Pass all errors through to consumer.
        undefined, function () {
            // Clean up our memory when we finalize
            buffers = null;
        }));
    });
}
