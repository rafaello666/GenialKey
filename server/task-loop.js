"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @ignore
 * Sub-class specialization of EventHandler base class.
 *
 * TaskLoop allows to schedule a task function being called (optionnaly repeatedly) on the main loop,
 * scheduled asynchroneously, avoiding recursive calls in the same tick.
 *
 * The task itself is implemented in `doTick`. It can be requested and called for single execution
 * using the `tick` method.
 *
 * It will be assured that the task execution method (`tick`) only gets called once per main loop "tick",
 * no matter how often it gets requested for execution. Execution in further ticks will be scheduled accordingly.
 *
 * If further execution requests have already been scheduled on the next tick, it can be checked with `hasNextTick`,
 * and cancelled with `clearNextTick`.
 *
 * The task can be scheduled as an interval repeatedly with a period as parameter (see `setInterval`, `clearInterval`).
 *
 * Sub-classes need to implement the `doTick` method which will effectively have the task execution routine.
 *
 * Further explanations:
 *
 * The baseclass has a `tick` method that will schedule the doTick call. It may be called synchroneously
 * only for a stack-depth of one. On re-entrant calls, sub-sequent calls are scheduled for next main loop ticks.
 *
 * When the task execution (`tick` method) is called in re-entrant way this is detected and
 * we are limiting the task execution per call stack to exactly one, but scheduling/post-poning further
 * task processing on the next main loop iteration (also known as "next tick" in the Node/JS runtime lingo).
 */
var TaskLoop = /** @class */ (function () {
    function TaskLoop() {
        this._tickTimer = null;
        this._tickInterval = null;
        this._tickCallCount = 0;
        this._boundTick = this.tick.bind(this);
    }
    TaskLoop.prototype.destroy = function () {
        this.onHandlerDestroying();
        this.onHandlerDestroyed();
    };
    TaskLoop.prototype.onHandlerDestroying = function () {
        // clear all timers before unregistering from event bus
        this.clearNextTick();
        this.clearInterval();
    };
    TaskLoop.prototype.onHandlerDestroyed = function () { };
    TaskLoop.prototype.hasInterval = function () {
        return !!this._tickInterval;
    };
    TaskLoop.prototype.hasNextTick = function () {
        return !!this._tickTimer;
    };
    /**
     * @param millis - Interval time (ms)
     * @eturns True when interval has been scheduled, false when already scheduled (no effect)
     */
    TaskLoop.prototype.setInterval = function (millis) {
        if (!this._tickInterval) {
            this._tickCallCount = 0;
            this._tickInterval = self.setInterval(this._boundTick, millis);
            return true;
        }
        return false;
    };
    /**
     * @returns True when interval was cleared, false when none was set (no effect)
     */
    TaskLoop.prototype.clearInterval = function () {
        if (this._tickInterval) {
            self.clearInterval(this._tickInterval);
            this._tickInterval = null;
            return true;
        }
        return false;
    };
    /**
     * @returns True when timeout was cleared, false when none was set (no effect)
     */
    TaskLoop.prototype.clearNextTick = function () {
        if (this._tickTimer) {
            self.clearTimeout(this._tickTimer);
            this._tickTimer = null;
            return true;
        }
        return false;
    };
    /**
     * Will call the subclass doTick implementation in this main loop tick
     * or in the next one (via setTimeout(,0)) in case it has already been called
     * in this tick (in case this is a re-entrant call).
     */
    TaskLoop.prototype.tick = function () {
        this._tickCallCount++;
        if (this._tickCallCount === 1) {
            this.doTick();
            // re-entrant call to tick from previous doTick call stack
            // -> schedule a call on the next main loop iteration to process this task processing request
            if (this._tickCallCount > 1) {
                // make sure only one timer exists at any time at max
                this.tickImmediate();
            }
            this._tickCallCount = 0;
        }
    };
    TaskLoop.prototype.tickImmediate = function () {
        this.clearNextTick();
        this._tickTimer = self.setTimeout(this._boundTick, 0);
    };
    /**
     * For subclass to implement task logic
     * @abstract
     */
    TaskLoop.prototype.doTick = function () { };
    return TaskLoop;
}());
exports.default = TaskLoop;
