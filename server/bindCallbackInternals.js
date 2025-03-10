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
exports.bindCallbackInternals = bindCallbackInternals;
var isScheduler_1 = require("../util/isScheduler");
var Observable_1 = require("../Observable");
var subscribeOn_1 = require("../operators/subscribeOn");
var mapOneOrManyArgs_1 = require("../util/mapOneOrManyArgs");
var observeOn_1 = require("../operators/observeOn");
var AsyncSubject_1 = require("../AsyncSubject");
function bindCallbackInternals(isNodeStyle, callbackFunc, resultSelector, scheduler) {
    if (resultSelector) {
        if ((0, isScheduler_1.isScheduler)(resultSelector)) {
            scheduler = resultSelector;
        }
        else {
            // The user provided a result selector.
            return function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return bindCallbackInternals(isNodeStyle, callbackFunc, scheduler)
                    .apply(this, args)
                    .pipe((0, mapOneOrManyArgs_1.mapOneOrManyArgs)(resultSelector));
            };
        }
    }
    // If a scheduler was passed, use our `subscribeOn` and `observeOn` operators
    // to compose that behavior for the user.
    if (scheduler) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return bindCallbackInternals(isNodeStyle, callbackFunc)
                .apply(this, args)
                .pipe((0, subscribeOn_1.subscribeOn)(scheduler), (0, observeOn_1.observeOn)(scheduler));
        };
    }
    return function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        // We're using AsyncSubject, because it emits when it completes,
        // and it will play the value to all late-arriving subscribers.
        var subject = new AsyncSubject_1.AsyncSubject();
        // If this is true, then we haven't called our function yet.
        var uninitialized = true;
        return new Observable_1.Observable(function (subscriber) {
            // Add our subscriber to the subject.
            var subs = subject.subscribe(subscriber);
            if (uninitialized) {
                uninitialized = false;
                // We're going to execute the bound function
                // This bit is to signal that we are hitting the callback asynchronously.
                // Because we don't have any anti-"Zalgo" guarantees with whatever
                // function we are handed, we use this bit to figure out whether or not
                // we are getting hit in a callback synchronously during our call.
                var isAsync_1 = false;
                // This is used to signal that the callback completed synchronously.
                var isComplete_1 = false;
                // Call our function that has a callback. If at any time during this
                // call, an error is thrown, it will be caught by the Observable
                // subscription process and sent to the consumer.
                callbackFunc.apply(
                // Pass the appropriate `this` context.
                _this, __spreadArray(__spreadArray([], args, true), [
                    // And our callback handler.
                    function () {
                        var results = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            results[_i] = arguments[_i];
                        }
                        if (isNodeStyle) {
                            // If this is a node callback, shift the first value off of the
                            // results and check it, as it is the error argument. By shifting,
                            // we leave only the argument(s) we want to pass to the consumer.
                            var err = results.shift();
                            if (err != null) {
                                subject.error(err);
                                // If we've errored, we can stop processing this function
                                // as there's nothing else to do. Just return to escape.
                                return;
                            }
                        }
                        // If we have one argument, notify the consumer
                        // of it as a single value, otherwise, if there's more than one, pass
                        // them as an array. Note that if there are no arguments, `undefined`
                        // will be emitted.
                        subject.next(1 < results.length ? results : results[0]);
                        // Flip this flag, so we know we can complete it in the synchronous
                        // case below.
                        isComplete_1 = true;
                        // If we're not asynchronous, we need to defer the `complete` call
                        // until after the call to the function is over. This is because an
                        // error could be thrown in the function after it calls our callback,
                        // and if that is the case, if we complete here, we are unable to notify
                        // the consumer than an error occurred.
                        if (isAsync_1) {
                            subject.complete();
                        }
                    },
                ], false));
                // If we flipped `isComplete` during the call, we resolved synchronously,
                // notify complete, because we skipped it in the callback to wait
                // to make sure there were no errors during the call.
                if (isComplete_1) {
                    subject.complete();
                }
                // We're no longer synchronous. If the callback is called at this point
                // we can notify complete on the spot.
                isAsync_1 = true;
            }
            // Return the subscription from adding our subscriber to the subject.
            return subs;
        });
    };
}
