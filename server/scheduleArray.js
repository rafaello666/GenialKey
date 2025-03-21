"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleArray = scheduleArray;
var Observable_1 = require("../Observable");
function scheduleArray(input, scheduler) {
    return new Observable_1.Observable(function (subscriber) {
        // The current array index.
        var i = 0;
        // Start iterating over the array like on a schedule.
        return scheduler.schedule(function () {
            if (i === input.length) {
                // If we have hit the end of the array like in the
                // previous job, we can complete.
                subscriber.complete();
            }
            else {
                // Otherwise let's next the value at the current index,
                // then increment our index.
                subscriber.next(input[i++]);
                // If the last emission didn't cause us to close the subscriber
                // (via take or some side effect), reschedule the job and we'll
                // make another pass.
                if (!subscriber.closed) {
                    this.schedule();
                }
            }
        });
    });
}
