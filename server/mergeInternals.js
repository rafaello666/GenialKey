"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeInternals = mergeInternals;
var innerFrom_1 = require("../observable/innerFrom");
var executeSchedule_1 = require("../util/executeSchedule");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
/**
 * A process embodying the general "merge" strategy. This is used in
 * `mergeMap` and `mergeScan` because the logic is otherwise nearly identical.
 * @param source The original source observable
 * @param subscriber The consumer subscriber
 * @param project The projection function to get our inner sources
 * @param concurrent The number of concurrent inner subscriptions
 * @param onBeforeNext Additional logic to apply before nexting to our consumer
 * @param expand If `true` this will perform an "expand" strategy, which differs only
 * in that it recurses, and the inner subscription must be schedule-able.
 * @param innerSubScheduler A scheduler to use to schedule inner subscriptions,
 * this is to support the expand strategy, mostly, and should be deprecated
 */
function mergeInternals(source, subscriber, project, concurrent, onBeforeNext, expand, innerSubScheduler, additionalFinalizer) {
    // Buffered values, in the event of going over our concurrency limit
    var buffer = [];
    // The number of active inner subscriptions.
    var active = 0;
    // An index to pass to our accumulator function
    var index = 0;
    // Whether or not the outer source has completed.
    var isComplete = false;
    /**
     * Checks to see if we can complete our result or not.
     */
    var checkComplete = function () {
        // If the outer has completed, and nothing is left in the buffer,
        // and we don't have any active inner subscriptions, then we can
        // Emit the state and complete.
        if (isComplete && !buffer.length && !active) {
            subscriber.complete();
        }
    };
    // If we're under our concurrency limit, just start the inner subscription, otherwise buffer and wait.
    var outerNext = function (value) { return (active < concurrent ? doInnerSub(value) : buffer.push(value)); };
    var doInnerSub = function (value) {
        // If we're expanding, we need to emit the outer values and the inner values
        // as the inners will "become outers" in a way as they are recursively fed
        // back to the projection mechanism.
        expand && subscriber.next(value);
        // Increment the number of active subscriptions so we can track it
        // against our concurrency limit later.
        active++;
        // A flag used to show that the inner observable completed.
        // This is checked during finalization to see if we should
        // move to the next item in the buffer, if there is on.
        var innerComplete = false;
        // Start our inner subscription.
        (0, innerFrom_1.innerFrom)(project(value, index++)).subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function (innerValue) {
            // `mergeScan` has additional handling here. For example
            // taking the inner value and updating state.
            onBeforeNext === null || onBeforeNext === void 0 ? void 0 : onBeforeNext(innerValue);
            if (expand) {
                // If we're expanding, then just recurse back to our outer
                // handler. It will emit the value first thing.
                outerNext(innerValue);
            }
            else {
                // Otherwise, emit the inner value.
                subscriber.next(innerValue);
            }
        }, function () {
            // Flag that we have completed, so we know to check the buffer
            // during finalization.
            innerComplete = true;
        }, 
        // Errors are passed to the destination.
        undefined, function () {
            // During finalization, if the inner completed (it wasn't errored or
            // cancelled), then we want to try the next item in the buffer if
            // there is one.
            if (innerComplete) {
                // We have to wrap this in a try/catch because it happens during
                // finalization, possibly asynchronously, and we want to pass
                // any errors that happen (like in a projection function) to
                // the outer Subscriber.
                try {
                    // INNER SOURCE COMPLETE
                    // Decrement the active count to ensure that the next time
                    // we try to call `doInnerSub`, the number is accurate.
                    active--;
                    var _loop_1 = function () {
                        var bufferedValue = buffer.shift();
                        // Particularly for `expand`, we need to check to see if a scheduler was provided
                        // for when we want to start our inner subscription. Otherwise, we just start
                        // are next inner subscription.
                        if (innerSubScheduler) {
                            (0, executeSchedule_1.executeSchedule)(subscriber, innerSubScheduler, function () { return doInnerSub(bufferedValue); });
                        }
                        else {
                            doInnerSub(bufferedValue);
                        }
                    };
                    // If we have more values in the buffer, try to process those
                    // Note that this call will increment `active` ahead of the
                    // next conditional, if there were any more inner subscriptions
                    // to start.
                    while (buffer.length && active < concurrent) {
                        _loop_1();
                    }
                    // Check to see if we can complete, and complete if so.
                    checkComplete();
                }
                catch (err) {
                    subscriber.error(err);
                }
            }
        }));
    };
    // Subscribe to our source observable.
    source.subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, outerNext, function () {
        // Outer completed, make a note of it, and check to see if we can complete everything.
        isComplete = true;
        checkComplete();
    }));
    // Additional finalization (for when the destination is torn down).
    // Other finalization is added implicitly via subscription above.
    return function () {
        additionalFinalizer === null || additionalFinalizer === void 0 ? void 0 : additionalFinalizer();
    };
}
