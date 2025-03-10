"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupBy = groupBy;
var Observable_1 = require("../Observable");
var innerFrom_1 = require("../observable/innerFrom");
var Subject_1 = require("../Subject");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
// Impl
function groupBy(keySelector, elementOrOptions, duration, connector) {
    return (0, lift_1.operate)(function (source, subscriber) {
        var element;
        if (!elementOrOptions || typeof elementOrOptions === 'function') {
            element = elementOrOptions;
        }
        else {
            (duration = elementOrOptions.duration, element = elementOrOptions.element, connector = elementOrOptions.connector);
        }
        // A lookup for the groups that we have so far.
        var groups = new Map();
        // Used for notifying all groups and the subscriber in the same way.
        var notify = function (cb) {
            groups.forEach(cb);
            cb(subscriber);
        };
        // Used to handle errors from the source, AND errors that occur during the
        // next call from the source.
        var handleError = function (err) { return notify(function (consumer) { return consumer.error(err); }); };
        // The number of actively subscribed groups
        var activeGroups = 0;
        // Whether or not teardown was attempted on this subscription.
        var teardownAttempted = false;
        // Capturing a reference to this, because we need a handle to it
        // in `createGroupedObservable` below. This is what we use to
        // subscribe to our source observable. This sometimes needs to be unsubscribed
        // out-of-band with our `subscriber` which is the downstream subscriber, or destination,
        // in cases where a user unsubscribes from the main resulting subscription, but
        // still has groups from this subscription subscribed and would expect values from it
        // Consider:  `source.pipe(groupBy(fn), take(2))`.
        var groupBySourceSubscriber = new OperatorSubscriber_1.OperatorSubscriber(subscriber, function (value) {
            // Because we have to notify all groups of any errors that occur in here,
            // we have to add our own try/catch to ensure that those errors are propagated.
            // OperatorSubscriber will only send the error to the main subscriber.
            try {
                var key_1 = keySelector(value);
                var group_1 = groups.get(key_1);
                if (!group_1) {
                    // Create our group subject
                    groups.set(key_1, (group_1 = connector ? connector() : new Subject_1.Subject()));
                    // Emit the grouped observable. Note that we can't do a simple `asObservable()` here,
                    // because the grouped observable has special semantics around reference counting
                    // to ensure we don't sever our connection to the source prematurely.
                    var grouped = createGroupedObservable(key_1, group_1);
                    subscriber.next(grouped);
                    if (duration) {
                        var durationSubscriber_1 = (0, OperatorSubscriber_1.createOperatorSubscriber)(
                        // Providing the group here ensures that it is disposed of -- via `unsubscribe` --
                        // when the duration subscription is torn down. That is important, because then
                        // if someone holds a handle to the grouped observable and tries to subscribe to it
                        // after the connection to the source has been severed, they will get an
                        // `ObjectUnsubscribedError` and know they can't possibly get any notifications.
                        group_1, function () {
                            // Our duration notified! We can complete the group.
                            // The group will be removed from the map in the finalization phase.
                            group_1.complete();
                            durationSubscriber_1 === null || durationSubscriber_1 === void 0 ? void 0 : durationSubscriber_1.unsubscribe();
                        }, 
                        // Completions are also sent to the group, but just the group.
                        undefined, 
                        // Errors on the duration subscriber are sent to the group
                        // but only the group. They are not sent to the main subscription.
                        undefined, 
                        // Finalization: Remove this group from our map.
                        function () { return groups.delete(key_1); });
                        // Start our duration notifier.
                        groupBySourceSubscriber.add((0, innerFrom_1.innerFrom)(duration(grouped)).subscribe(durationSubscriber_1));
                    }
                }
                // Send the value to our group.
                group_1.next(element ? element(value) : value);
            }
            catch (err) {
                handleError(err);
            }
        }, 
        // Source completes.
        function () { return notify(function (consumer) { return consumer.complete(); }); }, 
        // Error from the source.
        handleError, 
        // Free up memory.
        // When the source subscription is _finally_ torn down, release the subjects and keys
        // in our groups Map, they may be quite large and we don't want to keep them around if we
        // don't have to.
        function () { return groups.clear(); }, function () {
            teardownAttempted = true;
            // We only kill our subscription to the source if we have
            // no active groups. As stated above, consider this scenario:
            // source$.pipe(groupBy(fn), take(2)).
            return activeGroups === 0;
        });
        // Subscribe to the source
        source.subscribe(groupBySourceSubscriber);
        /**
         * Creates the actual grouped observable returned.
         * @param key The key of the group
         * @param groupSubject The subject that fuels the group
         */
        function createGroupedObservable(key, groupSubject) {
            var result = new Observable_1.Observable(function (groupSubscriber) {
                activeGroups++;
                var innerSub = groupSubject.subscribe(groupSubscriber);
                return function () {
                    innerSub.unsubscribe();
                    // We can kill the subscription to our source if we now have no more
                    // active groups subscribed, and a finalization was already attempted on
                    // the source.
                    --activeGroups === 0 && teardownAttempted && groupBySourceSubscriber.unsubscribe();
                };
            });
            result.key = key;
            return result;
        }
    });
}
