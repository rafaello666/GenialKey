"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeSchedule = executeSchedule;
function executeSchedule(parentSubscription, scheduler, work, delay, repeat) {
    if (delay === void 0) { delay = 0; }
    if (repeat === void 0) { repeat = false; }
    var scheduleSubscription = scheduler.schedule(function () {
        work();
        if (repeat) {
            parentSubscription.add(this.schedule(null, delay));
        }
        else {
            this.unsubscribe();
        }
    }, delay);
    parentSubscription.add(scheduleSubscription);
    if (!repeat) {
        // Because user-land scheduler implementations are unlikely to properly reuse
        // Actions for repeat scheduling, we can't trust that the returned subscription
        // will control repeat subscription scenarios. So we're trying to avoid using them
        // incorrectly within this library.
        return scheduleSubscription;
    }
}
