"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleAsyncIterable = scheduleAsyncIterable;
var Observable_1 = require("../Observable");
var executeSchedule_1 = require("../util/executeSchedule");
function scheduleAsyncIterable(input, scheduler) {
    if (!input) {
        throw new Error('Iterable cannot be null');
    }
    return new Observable_1.Observable(function (subscriber) {
        (0, executeSchedule_1.executeSchedule)(subscriber, scheduler, function () {
            var iterator = input[Symbol.asyncIterator]();
            (0, executeSchedule_1.executeSchedule)(subscriber, scheduler, function () {
                iterator.next().then(function (result) {
                    if (result.done) {
                        // This will remove the subscriptions from
                        // the parent subscription.
                        subscriber.complete();
                    }
                    else {
                        subscriber.next(result.value);
                    }
                });
            }, 0, true);
        });
    });
}
