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
exports.TestScheduler = void 0;
var Observable_1 = require("../Observable");
var ColdObservable_1 = require("./ColdObservable");
var HotObservable_1 = require("./HotObservable");
var SubscriptionLog_1 = require("./SubscriptionLog");
var VirtualTimeScheduler_1 = require("../scheduler/VirtualTimeScheduler");
var NotificationFactories_1 = require("../NotificationFactories");
var dateTimestampProvider_1 = require("../scheduler/dateTimestampProvider");
var performanceTimestampProvider_1 = require("../scheduler/performanceTimestampProvider");
var animationFrameProvider_1 = require("../scheduler/animationFrameProvider");
var immediateProvider_1 = require("../scheduler/immediateProvider");
var intervalProvider_1 = require("../scheduler/intervalProvider");
var timeoutProvider_1 = require("../scheduler/timeoutProvider");
var defaultMaxFrame = 750;
var TestScheduler = /** @class */ (function (_super) {
    __extends(TestScheduler, _super);
    /**
     *
     * @param assertDeepEqual A function to set up your assertion for your test harness
     */
    function TestScheduler(assertDeepEqual) {
        var _this = _super.call(this, VirtualTimeScheduler_1.VirtualAction, defaultMaxFrame) || this;
        _this.assertDeepEqual = assertDeepEqual;
        /**
         * @deprecated Internal implementation detail, do not use directly. Will be made internal in v8.
         */
        _this.hotObservables = [];
        /**
         * @deprecated Internal implementation detail, do not use directly. Will be made internal in v8.
         */
        _this.coldObservables = [];
        /**
         * Test meta data to be processed during `flush()`
         */
        _this.flushTests = [];
        /**
         * Indicates whether the TestScheduler instance is operating in "run mode",
         * meaning it's processing a call to `run()`
         */
        _this.runMode = false;
        return _this;
    }
    TestScheduler.prototype.createTime = function (marbles) {
        var indexOf = this.runMode ? marbles.trim().indexOf('|') : marbles.indexOf('|');
        if (indexOf === -1) {
            throw new Error('marble diagram for time should have a completion marker "|"');
        }
        return indexOf * TestScheduler.frameTimeFactor;
    };
    /**
     * @param marbles A diagram in the marble DSL. Letters map to keys in `values` if provided.
     * @param values Values to use for the letters in `marbles`. If omitted, the letters themselves are used.
     * @param error The error to use for the `#` marble (if present).
     */
    TestScheduler.prototype.createColdObservable = function (marbles, values, error) {
        if (marbles.indexOf('^') !== -1) {
            throw new Error('cold observable cannot have subscription offset "^"');
        }
        if (marbles.indexOf('!') !== -1) {
            throw new Error('cold observable cannot have unsubscription marker "!"');
        }
        var messages = TestScheduler.parseMarbles(marbles, values, error, undefined, this.runMode);
        var cold = new ColdObservable_1.ColdObservable(messages, this);
        this.coldObservables.push(cold);
        return cold;
    };
    /**
     * @param marbles A diagram in the marble DSL. Letters map to keys in `values` if provided.
     * @param values Values to use for the letters in `marbles`. If omitted, the letters themselves are used.
     * @param error The error to use for the `#` marble (if present).
     */
    TestScheduler.prototype.createHotObservable = function (marbles, values, error) {
        if (marbles.indexOf('!') !== -1) {
            throw new Error('hot observable cannot have unsubscription marker "!"');
        }
        var messages = TestScheduler.parseMarbles(marbles, values, error, undefined, this.runMode);
        var subject = new HotObservable_1.HotObservable(messages, this);
        this.hotObservables.push(subject);
        return subject;
    };
    TestScheduler.prototype.materializeInnerObservable = function (observable, outerFrame) {
        var _this = this;
        var messages = [];
        observable.subscribe({
            next: function (value) {
                messages.push({ frame: _this.frame - outerFrame, notification: (0, NotificationFactories_1.nextNotification)(value) });
            },
            error: function (error) {
                messages.push({ frame: _this.frame - outerFrame, notification: (0, NotificationFactories_1.errorNotification)(error) });
            },
            complete: function () {
                messages.push({ frame: _this.frame - outerFrame, notification: NotificationFactories_1.COMPLETE_NOTIFICATION });
            },
        });
        return messages;
    };
    TestScheduler.prototype.expectObservable = function (observable, subscriptionMarbles) {
        var _this = this;
        if (subscriptionMarbles === void 0) { subscriptionMarbles = null; }
        var actual = [];
        var flushTest = { actual: actual, ready: false };
        var subscriptionParsed = TestScheduler.parseMarblesAsSubscriptions(subscriptionMarbles, this.runMode);
        var subscriptionFrame = subscriptionParsed.subscribedFrame === Infinity ? 0 : subscriptionParsed.subscribedFrame;
        var unsubscriptionFrame = subscriptionParsed.unsubscribedFrame;
        var subscription;
        this.schedule(function () {
            subscription = observable.subscribe({
                next: function (x) {
                    // Support Observable-of-Observables
                    var value = x instanceof Observable_1.Observable ? _this.materializeInnerObservable(x, _this.frame) : x;
                    actual.push({ frame: _this.frame, notification: (0, NotificationFactories_1.nextNotification)(value) });
                },
                error: function (error) {
                    actual.push({ frame: _this.frame, notification: (0, NotificationFactories_1.errorNotification)(error) });
                },
                complete: function () {
                    actual.push({ frame: _this.frame, notification: NotificationFactories_1.COMPLETE_NOTIFICATION });
                },
            });
        }, subscriptionFrame);
        if (unsubscriptionFrame !== Infinity) {
            this.schedule(function () { return subscription.unsubscribe(); }, unsubscriptionFrame);
        }
        this.flushTests.push(flushTest);
        var runMode = this.runMode;
        return {
            toBe: function (marbles, values, errorValue) {
                flushTest.ready = true;
                flushTest.expected = TestScheduler.parseMarbles(marbles, values, errorValue, true, runMode);
            },
            toEqual: function (other) {
                flushTest.ready = true;
                flushTest.expected = [];
                _this.schedule(function () {
                    subscription = other.subscribe({
                        next: function (x) {
                            // Support Observable-of-Observables
                            var value = x instanceof Observable_1.Observable ? _this.materializeInnerObservable(x, _this.frame) : x;
                            flushTest.expected.push({ frame: _this.frame, notification: (0, NotificationFactories_1.nextNotification)(value) });
                        },
                        error: function (error) {
                            flushTest.expected.push({ frame: _this.frame, notification: (0, NotificationFactories_1.errorNotification)(error) });
                        },
                        complete: function () {
                            flushTest.expected.push({ frame: _this.frame, notification: NotificationFactories_1.COMPLETE_NOTIFICATION });
                        },
                    });
                }, subscriptionFrame);
            },
        };
    };
    TestScheduler.prototype.expectSubscriptions = function (actualSubscriptionLogs) {
        var flushTest = { actual: actualSubscriptionLogs, ready: false };
        this.flushTests.push(flushTest);
        var runMode = this.runMode;
        return {
            toBe: function (marblesOrMarblesArray) {
                var marblesArray = typeof marblesOrMarblesArray === 'string' ? [marblesOrMarblesArray] : marblesOrMarblesArray;
                flushTest.ready = true;
                flushTest.expected = marblesArray
                    .map(function (marbles) { return TestScheduler.parseMarblesAsSubscriptions(marbles, runMode); })
                    .filter(function (marbles) { return marbles.subscribedFrame !== Infinity; });
            },
        };
    };
    TestScheduler.prototype.flush = function () {
        var _this = this;
        var hotObservables = this.hotObservables;
        while (hotObservables.length > 0) {
            hotObservables.shift().setup();
        }
        _super.prototype.flush.call(this);
        this.flushTests = this.flushTests.filter(function (test) {
            if (test.ready) {
                _this.assertDeepEqual(test.actual, test.expected);
                return false;
            }
            return true;
        });
    };
    TestScheduler.parseMarblesAsSubscriptions = function (marbles, runMode) {
        var _this = this;
        if (runMode === void 0) { runMode = false; }
        if (typeof marbles !== 'string') {
            return new SubscriptionLog_1.SubscriptionLog(Infinity);
        }
        // Spreading the marbles into an array leverages ES2015's support for emoji
        // characters when iterating strings.
        var characters = __spreadArray([], marbles, true);
        var len = characters.length;
        var groupStart = -1;
        var subscriptionFrame = Infinity;
        var unsubscriptionFrame = Infinity;
        var frame = 0;
        var _loop_1 = function (i) {
            var nextFrame = frame;
            var advanceFrameBy = function (count) {
                nextFrame += count * _this.frameTimeFactor;
            };
            var c = characters[i];
            switch (c) {
                case ' ':
                    // Whitespace no longer advances time
                    if (!runMode) {
                        advanceFrameBy(1);
                    }
                    break;
                case '-':
                    advanceFrameBy(1);
                    break;
                case '(':
                    groupStart = frame;
                    advanceFrameBy(1);
                    break;
                case ')':
                    groupStart = -1;
                    advanceFrameBy(1);
                    break;
                case '^':
                    if (subscriptionFrame !== Infinity) {
                        throw new Error("found a second subscription point '^' in a " + 'subscription marble diagram. There can only be one.');
                    }
                    subscriptionFrame = groupStart > -1 ? groupStart : frame;
                    advanceFrameBy(1);
                    break;
                case '!':
                    if (unsubscriptionFrame !== Infinity) {
                        throw new Error("found a second unsubscription point '!' in a " + 'subscription marble diagram. There can only be one.');
                    }
                    unsubscriptionFrame = groupStart > -1 ? groupStart : frame;
                    break;
                default:
                    // time progression syntax
                    if (runMode && c.match(/^[0-9]$/)) {
                        // Time progression must be preceded by at least one space
                        // if it's not at the beginning of the diagram
                        if (i === 0 || characters[i - 1] === ' ') {
                            var buffer = characters.slice(i).join('');
                            var match = buffer.match(/^([0-9]+(?:\.[0-9]+)?)(ms|s|m) /);
                            if (match) {
                                i += match[0].length - 1;
                                var duration = parseFloat(match[1]);
                                var unit = match[2];
                                var durationInMs = void 0;
                                switch (unit) {
                                    case 'ms':
                                        durationInMs = duration;
                                        break;
                                    case 's':
                                        durationInMs = duration * 1000;
                                        break;
                                    case 'm':
                                        durationInMs = duration * 1000 * 60;
                                        break;
                                    default:
                                        break;
                                }
                                advanceFrameBy(durationInMs / this_1.frameTimeFactor);
                                break;
                            }
                        }
                    }
                    throw new Error("there can only be '^' and '!' markers in a " + "subscription marble diagram. Found instead '" + c + "'.");
            }
            frame = nextFrame;
            out_i_1 = i;
        };
        var this_1 = this, out_i_1;
        for (var i = 0; i < len; i++) {
            _loop_1(i);
            i = out_i_1;
        }
        if (unsubscriptionFrame < 0) {
            return new SubscriptionLog_1.SubscriptionLog(subscriptionFrame);
        }
        else {
            return new SubscriptionLog_1.SubscriptionLog(subscriptionFrame, unsubscriptionFrame);
        }
    };
    TestScheduler.parseMarbles = function (marbles, values, errorValue, materializeInnerObservables, runMode) {
        var _this = this;
        if (materializeInnerObservables === void 0) { materializeInnerObservables = false; }
        if (runMode === void 0) { runMode = false; }
        if (marbles.indexOf('!') !== -1) {
            throw new Error('conventional marble diagrams cannot have the ' + 'unsubscription marker "!"');
        }
        // Spreading the marbles into an array leverages ES2015's support for emoji
        // characters when iterating strings.
        var characters = __spreadArray([], marbles, true);
        var len = characters.length;
        var testMessages = [];
        var subIndex = runMode ? marbles.replace(/^[ ]+/, '').indexOf('^') : marbles.indexOf('^');
        var frame = subIndex === -1 ? 0 : subIndex * -this.frameTimeFactor;
        var getValue = typeof values !== 'object'
            ? function (x) { return x; }
            : function (x) {
                // Support Observable-of-Observables
                if (materializeInnerObservables && values[x] instanceof ColdObservable_1.ColdObservable) {
                    return values[x].messages;
                }
                return values[x];
            };
        var groupStart = -1;
        var _loop_2 = function (i) {
            var nextFrame = frame;
            var advanceFrameBy = function (count) {
                nextFrame += count * _this.frameTimeFactor;
            };
            var notification = void 0;
            var c = characters[i];
            switch (c) {
                case ' ':
                    // Whitespace no longer advances time
                    if (!runMode) {
                        advanceFrameBy(1);
                    }
                    break;
                case '-':
                    advanceFrameBy(1);
                    break;
                case '(':
                    groupStart = frame;
                    advanceFrameBy(1);
                    break;
                case ')':
                    groupStart = -1;
                    advanceFrameBy(1);
                    break;
                case '|':
                    notification = NotificationFactories_1.COMPLETE_NOTIFICATION;
                    advanceFrameBy(1);
                    break;
                case '^':
                    advanceFrameBy(1);
                    break;
                case '#':
                    notification = (0, NotificationFactories_1.errorNotification)(errorValue || 'error');
                    advanceFrameBy(1);
                    break;
                default:
                    // Might be time progression syntax, or a value literal
                    if (runMode && c.match(/^[0-9]$/)) {
                        // Time progression must be preceded by at least one space
                        // if it's not at the beginning of the diagram
                        if (i === 0 || characters[i - 1] === ' ') {
                            var buffer = characters.slice(i).join('');
                            var match = buffer.match(/^([0-9]+(?:\.[0-9]+)?)(ms|s|m) /);
                            if (match) {
                                i += match[0].length - 1;
                                var duration = parseFloat(match[1]);
                                var unit = match[2];
                                var durationInMs = void 0;
                                switch (unit) {
                                    case 'ms':
                                        durationInMs = duration;
                                        break;
                                    case 's':
                                        durationInMs = duration * 1000;
                                        break;
                                    case 'm':
                                        durationInMs = duration * 1000 * 60;
                                        break;
                                    default:
                                        break;
                                }
                                advanceFrameBy(durationInMs / this_2.frameTimeFactor);
                                break;
                            }
                        }
                    }
                    notification = (0, NotificationFactories_1.nextNotification)(getValue(c));
                    advanceFrameBy(1);
                    break;
            }
            if (notification) {
                testMessages.push({ frame: groupStart > -1 ? groupStart : frame, notification: notification });
            }
            frame = nextFrame;
            out_i_2 = i;
        };
        var this_2 = this, out_i_2;
        for (var i = 0; i < len; i++) {
            _loop_2(i);
            i = out_i_2;
        }
        return testMessages;
    };
    TestScheduler.prototype.createAnimator = function () {
        var _this = this;
        if (!this.runMode) {
            throw new Error('animate() must only be used in run mode');
        }
        // The TestScheduler assigns a delegate to the provider that's used for
        // requestAnimationFrame (rAF). The delegate works in conjunction with the
        // animate run helper to coordinate the invocation of any rAF callbacks,
        // that are effected within tests, with the animation frames specified by
        // the test's author - in the marbles that are passed to the animate run
        // helper. This allows the test's author to write deterministic tests and
        // gives the author full control over when - or if - animation frames are
        // 'painted'.
        var lastHandle = 0;
        var map;
        var delegate = {
            requestAnimationFrame: function (callback) {
                if (!map) {
                    throw new Error('animate() was not called within run()');
                }
                var handle = ++lastHandle;
                map.set(handle, callback);
                return handle;
            },
            cancelAnimationFrame: function (handle) {
                if (!map) {
                    throw new Error('animate() was not called within run()');
                }
                map.delete(handle);
            },
        };
        var animate = function (marbles) {
            if (map) {
                throw new Error('animate() must not be called more than once within run()');
            }
            if (/[|#]/.test(marbles)) {
                throw new Error('animate() must not complete or error');
            }
            map = new Map();
            var messages = TestScheduler.parseMarbles(marbles, undefined, undefined, undefined, true);
            for (var _i = 0, messages_1 = messages; _i < messages_1.length; _i++) {
                var message = messages_1[_i];
                _this.schedule(function () {
                    var now = _this.now();
                    // Capture the callbacks within the queue and clear the queue
                    // before enumerating the callbacks, as callbacks might
                    // reschedule themselves. (And, yeah, we're using a Map to represent
                    // the queue, but the values are guaranteed to be returned in
                    // insertion order, so it's all good. Trust me, I've read the docs.)
                    var callbacks = Array.from(map.values());
                    map.clear();
                    for (var _i = 0, callbacks_1 = callbacks; _i < callbacks_1.length; _i++) {
                        var callback = callbacks_1[_i];
                        callback(now);
                    }
                }, message.frame);
            }
        };
        return { animate: animate, delegate: delegate };
    };
    TestScheduler.prototype.createDelegates = function () {
        // When in run mode, the TestScheduler provides alternate implementations
        // of set/clearImmediate and set/clearInterval. These implementations are
        // consumed by the scheduler implementations via the providers. This is
        // done to effect deterministic asap and async scheduler behavior so that
        // all of the schedulers are testable in 'run mode'. Prior to v7,
        // delegation occurred at the scheduler level. That is, the asap and
        // animation frame schedulers were identical in behavior to the async
        // scheduler. Now, when in run mode, asap actions are prioritized over
        // async actions and animation frame actions are coordinated using the
        // animate run helper.
        var _this = this;
        var lastHandle = 0;
        var scheduleLookup = new Map();
        var run = function () {
            // Whenever a scheduled run is executed, it must run a single immediate
            // or interval action - with immediate actions being prioritized over
            // interval and timeout actions.
            var now = _this.now();
            var scheduledRecords = Array.from(scheduleLookup.values());
            var scheduledRecordsDue = scheduledRecords.filter(function (_a) {
                var due = _a.due;
                return due <= now;
            });
            var dueImmediates = scheduledRecordsDue.filter(function (_a) {
                var type = _a.type;
                return type === 'immediate';
            });
            if (dueImmediates.length > 0) {
                var _a = dueImmediates[0], handle = _a.handle, handler = _a.handler;
                scheduleLookup.delete(handle);
                handler();
                return;
            }
            var dueIntervals = scheduledRecordsDue.filter(function (_a) {
                var type = _a.type;
                return type === 'interval';
            });
            if (dueIntervals.length > 0) {
                var firstDueInterval = dueIntervals[0];
                var duration = firstDueInterval.duration, handler = firstDueInterval.handler;
                firstDueInterval.due = now + duration;
                // The interval delegate must behave like setInterval, so run needs to
                // be rescheduled. This will continue until the clearInterval delegate
                // unsubscribes and deletes the handle from the map.
                firstDueInterval.subscription = _this.schedule(run, duration);
                handler();
                return;
            }
            var dueTimeouts = scheduledRecordsDue.filter(function (_a) {
                var type = _a.type;
                return type === 'timeout';
            });
            if (dueTimeouts.length > 0) {
                var _b = dueTimeouts[0], handle = _b.handle, handler = _b.handler;
                scheduleLookup.delete(handle);
                handler();
                return;
            }
            throw new Error('Expected a due immediate or interval');
        };
        // The following objects are the delegates that replace conventional
        // runtime implementations with TestScheduler implementations.
        //
        // The immediate delegate is depended upon by the asapScheduler.
        //
        // The interval delegate is depended upon by the asyncScheduler.
        //
        // The timeout delegate is not depended upon by any scheduler, but it's
        // included here because the onUnhandledError and onStoppedNotification
        // configuration points use setTimeout to avoid producer interference. It's
        // inclusion allows for the testing of these configuration points.
        var immediate = {
            setImmediate: function (handler) {
                var handle = ++lastHandle;
                scheduleLookup.set(handle, {
                    due: _this.now(),
                    duration: 0,
                    handle: handle,
                    handler: handler,
                    subscription: _this.schedule(run, 0),
                    type: 'immediate',
                });
                return handle;
            },
            clearImmediate: function (handle) {
                var value = scheduleLookup.get(handle);
                if (value) {
                    value.subscription.unsubscribe();
                    scheduleLookup.delete(handle);
                }
            },
        };
        var interval = {
            setInterval: function (handler, duration) {
                if (duration === void 0) { duration = 0; }
                var handle = ++lastHandle;
                scheduleLookup.set(handle, {
                    due: _this.now() + duration,
                    duration: duration,
                    handle: handle,
                    handler: handler,
                    subscription: _this.schedule(run, duration),
                    type: 'interval',
                });
                return handle;
            },
            clearInterval: function (handle) {
                var value = scheduleLookup.get(handle);
                if (value) {
                    value.subscription.unsubscribe();
                    scheduleLookup.delete(handle);
                }
            },
        };
        var timeout = {
            setTimeout: function (handler, duration) {
                if (duration === void 0) { duration = 0; }
                var handle = ++lastHandle;
                scheduleLookup.set(handle, {
                    due: _this.now() + duration,
                    duration: duration,
                    handle: handle,
                    handler: handler,
                    subscription: _this.schedule(run, duration),
                    type: 'timeout',
                });
                return handle;
            },
            clearTimeout: function (handle) {
                var value = scheduleLookup.get(handle);
                if (value) {
                    value.subscription.unsubscribe();
                    scheduleLookup.delete(handle);
                }
            },
        };
        return { immediate: immediate, interval: interval, timeout: timeout };
    };
    /**
     * The `run` method performs the test in 'run mode' - in which schedulers
     * used within the test automatically delegate to the `TestScheduler`. That
     * is, in 'run mode' there is no need to explicitly pass a `TestScheduler`
     * instance to observable creators or operators.
     *
     * @see {@link /guide/testing/marble-testing}
     */
    TestScheduler.prototype.run = function (callback) {
        var prevFrameTimeFactor = TestScheduler.frameTimeFactor;
        var prevMaxFrames = this.maxFrames;
        TestScheduler.frameTimeFactor = 1;
        this.maxFrames = Infinity;
        this.runMode = true;
        var animator = this.createAnimator();
        var delegates = this.createDelegates();
        animationFrameProvider_1.animationFrameProvider.delegate = animator.delegate;
        dateTimestampProvider_1.dateTimestampProvider.delegate = this;
        immediateProvider_1.immediateProvider.delegate = delegates.immediate;
        intervalProvider_1.intervalProvider.delegate = delegates.interval;
        timeoutProvider_1.timeoutProvider.delegate = delegates.timeout;
        performanceTimestampProvider_1.performanceTimestampProvider.delegate = this;
        var helpers = {
            cold: this.createColdObservable.bind(this),
            hot: this.createHotObservable.bind(this),
            flush: this.flush.bind(this),
            time: this.createTime.bind(this),
            expectObservable: this.expectObservable.bind(this),
            expectSubscriptions: this.expectSubscriptions.bind(this),
            animate: animator.animate,
        };
        try {
            var ret = callback(helpers);
            this.flush();
            return ret;
        }
        finally {
            TestScheduler.frameTimeFactor = prevFrameTimeFactor;
            this.maxFrames = prevMaxFrames;
            this.runMode = false;
            animationFrameProvider_1.animationFrameProvider.delegate = undefined;
            dateTimestampProvider_1.dateTimestampProvider.delegate = undefined;
            immediateProvider_1.immediateProvider.delegate = undefined;
            intervalProvider_1.intervalProvider.delegate = undefined;
            timeoutProvider_1.timeoutProvider.delegate = undefined;
            performanceTimestampProvider_1.performanceTimestampProvider.delegate = undefined;
        }
    };
    /**
     * The number of virtual time units each character in a marble diagram represents. If
     * the test scheduler is being used in "run mode", via the `run` method, this is temporarily
     * set to `1` for the duration of the `run` block, then set back to whatever value it was.
     */
    TestScheduler.frameTimeFactor = 10;
    return TestScheduler;
}(VirtualTimeScheduler_1.VirtualTimeScheduler));
exports.TestScheduler = TestScheduler;
