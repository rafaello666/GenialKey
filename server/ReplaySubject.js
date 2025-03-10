"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplaySubject = void 0;
var Subject_1 = require("./Subject");
var dateTimestampProvider_1 = require("./scheduler/dateTimestampProvider");
/**
 * A variant of {@link Subject} that "replays" old values to new subscribers by emitting them when they first subscribe.
 *
 * `ReplaySubject` has an internal buffer that will store a specified number of values that it has observed. Like `Subject`,
 * `ReplaySubject` "observes" values by having them passed to its `next` method. When it observes a value, it will store that
 * value for a time determined by the configuration of the `ReplaySubject`, as passed to its constructor.
 *
 * When a new subscriber subscribes to the `ReplaySubject` instance, it will synchronously emit all values in its buffer in
 * a First-In-First-Out (FIFO) manner. The `ReplaySubject` will also complete, if it has observed completion; and it will
 * error if it has observed an error.
 *
 * There are two main configuration items to be concerned with:
 *
 * 1. `bufferSize` - This will determine how many items are stored in the buffer, defaults to infinite.
 * 2. `windowTime` - The amount of time to hold a value in the buffer before removing it from the buffer.
 *
 * Both configurations may exist simultaneously. So if you would like to buffer a maximum of 3 values, as long as the values
 * are less than 2 seconds old, you could do so with a `new ReplaySubject(3, 2000)`.
 *
 * ### Differences with BehaviorSubject
 *
 * `BehaviorSubject` is similar to `new ReplaySubject(1)`, with a couple of exceptions:
 *
 * 1. `BehaviorSubject` comes "primed" with a single value upon construction.
 * 2. `ReplaySubject` will replay values, even after observing an error, where `BehaviorSubject` will not.
 *
 * @see {@link Subject}
 * @see {@link BehaviorSubject}
 * @see {@link shareReplay}
 */
var ReplaySubject = /** @class */ (function (_super) {
    __extends(ReplaySubject, _super);
    /**
     * @param _bufferSize The size of the buffer to replay on subscription
     * @param _windowTime The amount of time the buffered items will stay buffered
     * @param _timestampProvider An object with a `now()` method that provides the current timestamp. This is used to
     * calculate the amount of time something has been buffered.
     */
    function ReplaySubject(_bufferSize, _windowTime, _timestampProvider) {
        if (_bufferSize === void 0) { _bufferSize = Infinity; }
        if (_windowTime === void 0) { _windowTime = Infinity; }
        if (_timestampProvider === void 0) { _timestampProvider = dateTimestampProvider_1.dateTimestampProvider; }
        var _this = _super.call(this) || this;
        _this._bufferSize = _bufferSize;
        _this._windowTime = _windowTime;
        _this._timestampProvider = _timestampProvider;
        _this._buffer = [];
        _this._infiniteTimeWindow = true;
        _this._infiniteTimeWindow = _windowTime === Infinity;
        _this._bufferSize = Math.max(1, _bufferSize);
        _this._windowTime = Math.max(1, _windowTime);
        return _this;
    }
    ReplaySubject.prototype.next = function (value) {
        var _a = this, isStopped = _a.isStopped, _buffer = _a._buffer, _infiniteTimeWindow = _a._infiniteTimeWindow, _timestampProvider = _a._timestampProvider, _windowTime = _a._windowTime;
        if (!isStopped) {
            _buffer.push(value);
            !_infiniteTimeWindow && _buffer.push(_timestampProvider.now() + _windowTime);
        }
        this._trimBuffer();
        _super.prototype.next.call(this, value);
    };
    /** @internal */
    ReplaySubject.prototype._subscribe = function (subscriber) {
        this._throwIfClosed();
        this._trimBuffer();
        var subscription = this._innerSubscribe(subscriber);
        var _a = this, _infiniteTimeWindow = _a._infiniteTimeWindow, _buffer = _a._buffer;
        // We use a copy here, so reentrant code does not mutate our array while we're
        // emitting it to a new subscriber.
        var copy = _buffer.slice();
        for (var i = 0; i < copy.length && !subscriber.closed; i += _infiniteTimeWindow ? 1 : 2) {
            subscriber.next(copy[i]);
        }
        this._checkFinalizedStatuses(subscriber);
        return subscription;
    };
    ReplaySubject.prototype._trimBuffer = function () {
        var _a = this, _bufferSize = _a._bufferSize, _timestampProvider = _a._timestampProvider, _buffer = _a._buffer, _infiniteTimeWindow = _a._infiniteTimeWindow;
        // If we don't have an infinite buffer size, and we're over the length,
        // use splice to truncate the old buffer values off. Note that we have to
        // double the size for instances where we're not using an infinite time window
        // because we're storing the values and the timestamps in the same array.
        var adjustedBufferSize = (_infiniteTimeWindow ? 1 : 2) * _bufferSize;
        _bufferSize < Infinity && adjustedBufferSize < _buffer.length && _buffer.splice(0, _buffer.length - adjustedBufferSize);
        // Now, if we're not in an infinite time window, remove all values where the time is
        // older than what is allowed.
        if (!_infiniteTimeWindow) {
            var now = _timestampProvider.now();
            var last = 0;
            // Search the array for the first timestamp that isn't expired and
            // truncate the buffer up to that point.
            for (var i = 1; i < _buffer.length && _buffer[i] <= now; i += 2) {
                last = i;
            }
            last && _buffer.splice(0, last + 1);
        }
    };
    return ReplaySubject;
}(Subject_1.Subject));
exports.ReplaySubject = ReplaySubject;
