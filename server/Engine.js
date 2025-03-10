"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Engine = void 0;
var events_1 = require("../utils/events");
var fn_1 = require("../utils/fn");
var maths_1 = require("../utils/maths");
/**
 * The lib doesn't compute the kinematics on the last event of the gesture
 * (i.e. for a drag gesture, the `pointerup` coordinates will generally match the
 * last `pointermove` coordinates which would result in all drags ending with a
 * `[0,0]` velocity). However, when the timestamp difference between the last
 * event (ie pointerup) and the before last event (ie pointermove) is greater
 * than BEFORE_LAST_KINEMATICS_DELAY, the kinematics are computed (which would
 * mean that if you release your drag after stopping for more than
 * BEFORE_LAST_KINEMATICS_DELAY, the velocity will be indeed 0).
 *
 * See https://github.com/pmndrs/use-gesture/issues/332 for more details.
 */
var BEFORE_LAST_KINEMATICS_DELAY = 32;
var Engine = /** @class */ (function () {
    function Engine(ctrl, args, key) {
        this.ctrl = ctrl;
        this.args = args;
        this.key = key;
        if (!this.state) {
            this.state = {};
            this.computeValues([0, 0]);
            this.computeInitial();
            if (this.init)
                this.init();
            this.reset();
        }
    }
    Object.defineProperty(Engine.prototype, "state", {
        /**
         * Shortcut to the gesture state read from the Controller.
         */
        get: function () {
            return this.ctrl.state[this.key];
        },
        set: function (state) {
            this.ctrl.state[this.key] = state;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Engine.prototype, "shared", {
        /**
         * Shortcut to the shared state read from the Controller
         */
        get: function () {
            return this.ctrl.state.shared;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Engine.prototype, "eventStore", {
        /**
         * Shortcut to the gesture event store read from the Controller.
         */
        get: function () {
            return this.ctrl.gestureEventStores[this.key];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Engine.prototype, "timeoutStore", {
        /**
         * Shortcut to the gesture timeout store read from the Controller.
         */
        get: function () {
            return this.ctrl.gestureTimeoutStores[this.key];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Engine.prototype, "config", {
        /**
         * Shortcut to the gesture config read from the Controller.
         */
        get: function () {
            return this.ctrl.config[this.key];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Engine.prototype, "sharedConfig", {
        /**
         * Shortcut to the shared config read from the Controller.
         */
        get: function () {
            return this.ctrl.config.shared;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Engine.prototype, "handler", {
        /**
         * Shortcut to the gesture handler read from the Controller.
         */
        get: function () {
            return this.ctrl.handlers[this.key];
        },
        enumerable: false,
        configurable: true
    });
    Engine.prototype.reset = function () {
        var _a = this, state = _a.state, shared = _a.shared, ingKey = _a.ingKey, args = _a.args;
        shared[ingKey] = state._active = state.active = state._blocked = state._force = false;
        state._step = [false, false];
        state.intentional = false;
        state._movement = [0, 0];
        state._distance = [0, 0];
        state._direction = [0, 0];
        state._delta = [0, 0];
        // prettier-ignore
        state._bounds = [[-Infinity, Infinity], [-Infinity, Infinity]];
        state.args = args;
        state.axis = undefined;
        state.memo = undefined;
        state.elapsedTime = state.timeDelta = 0;
        state.direction = [0, 0];
        state.distance = [0, 0];
        state.overflow = [0, 0];
        state._movementBound = [false, false];
        state.velocity = [0, 0];
        state.movement = [0, 0];
        state.delta = [0, 0];
        state.timeStamp = 0;
    };
    /**
     * Function ran at the start of the gesture.
     * @param event
     */
    Engine.prototype.start = function (event) {
        var state = this.state;
        var config = this.config;
        if (!state._active) {
            this.reset();
            this.computeInitial();
            state._active = true;
            state.target = event.target;
            state.currentTarget = event.currentTarget;
            state.lastOffset = config.from ? (0, fn_1.call)(config.from, state) : state.offset;
            state.offset = state.lastOffset;
            state.startTime = state.timeStamp = event.timeStamp;
        }
    };
    /**
     * Assign raw values to `state._values` and transformed values to
     * `state.values`.
     * @param values
     */
    Engine.prototype.computeValues = function (values) {
        var state = this.state;
        state._values = values;
        // transforming values into user-defined coordinates (#402)
        state.values = this.config.transform(values);
    };
    /**
     * Assign `state._values` to `state._initial` and transformed `state.values` to
     * `state.initial`.
     * @param values
     */
    Engine.prototype.computeInitial = function () {
        var state = this.state;
        state._initial = state._values;
        state.initial = state.values;
    };
    /**
     * Computes all sorts of state attributes, including kinematics.
     * @param event
     */
    Engine.prototype.compute = function (event) {
        var _a = this, state = _a.state, config = _a.config, shared = _a.shared;
        state.args = this.args;
        var dt = 0;
        if (event) {
            // sets the shared state with event properties
            state.event = event;
            // if config.preventDefault is true, then preventDefault
            if (config.preventDefault && event.cancelable)
                state.event.preventDefault();
            state.type = event.type;
            shared.touches = this.ctrl.pointerIds.size || this.ctrl.touchIds.size;
            shared.locked = !!document.pointerLockElement;
            Object.assign(shared, (0, events_1.getEventDetails)(event));
            shared.down = shared.pressed = shared.buttons % 2 === 1 || shared.touches > 0;
            // sets time stamps
            dt = event.timeStamp - state.timeStamp;
            state.timeStamp = event.timeStamp;
            state.elapsedTime = state.timeStamp - state.startTime;
        }
        // only compute _distance if the state is active otherwise we might compute it
        // twice when the gesture ends because state._delta wouldn't have changed on
        // the last frame.
        if (state._active) {
            var _absoluteDelta = state._delta.map(Math.abs);
            maths_1.V.addTo(state._distance, _absoluteDelta);
        }
        // let's run intentionality check.
        if (this.axisIntent)
            this.axisIntent(event);
        // _movement is calculated by each gesture engine
        var _b = state._movement, _m0 = _b[0], _m1 = _b[1];
        var _c = config.threshold, t0 = _c[0], t1 = _c[1];
        var _step = state._step, values = state.values;
        if (config.hasCustomTransform) {
            // When the user is using a custom transform, we're using `_step` to store
            // the first value passing the threshold.
            if (_step[0] === false)
                _step[0] = Math.abs(_m0) >= t0 && values[0];
            if (_step[1] === false)
                _step[1] = Math.abs(_m1) >= t1 && values[1];
        }
        else {
            // `_step` will hold the threshold at which point the gesture was triggered.
            // The threshold is signed depending on which direction triggered it.
            if (_step[0] === false)
                _step[0] = Math.abs(_m0) >= t0 && Math.sign(_m0) * t0;
            if (_step[1] === false)
                _step[1] = Math.abs(_m1) >= t1 && Math.sign(_m1) * t1;
        }
        state.intentional = _step[0] !== false || _step[1] !== false;
        if (!state.intentional)
            return;
        var movement = [0, 0];
        if (config.hasCustomTransform) {
            var v0 = values[0], v1 = values[1];
            movement[0] = _step[0] !== false ? v0 - _step[0] : 0;
            movement[1] = _step[1] !== false ? v1 - _step[1] : 0;
        }
        else {
            movement[0] = _step[0] !== false ? _m0 - _step[0] : 0;
            movement[1] = _step[1] !== false ? _m1 - _step[1] : 0;
        }
        if (this.restrictToAxis && !state._blocked)
            this.restrictToAxis(movement);
        var previousOffset = state.offset;
        var gestureIsActive = (state._active && !state._blocked) || state.active;
        if (gestureIsActive) {
            state.first = state._active && !state.active;
            state.last = !state._active && state.active;
            state.active = shared[this.ingKey] = state._active;
            if (event) {
                if (state.first) {
                    if ('bounds' in config)
                        state._bounds = (0, fn_1.call)(config.bounds, state);
                    if (this.setup)
                        this.setup();
                }
                state.movement = movement;
                this.computeOffset();
            }
        }
        var _d = state.offset, ox = _d[0], oy = _d[1];
        var _e = state._bounds, _f = _e[0], x0 = _f[0], x1 = _f[1], _g = _e[1], y0 = _g[0], y1 = _g[1];
        state.overflow = [ox < x0 ? -1 : ox > x1 ? 1 : 0, oy < y0 ? -1 : oy > y1 ? 1 : 0];
        // _movementBound will store the latest _movement value
        // before it went off bounds.
        state._movementBound[0] = state.overflow[0]
            ? state._movementBound[0] === false
                ? state._movement[0]
                : state._movementBound[0]
            : false;
        state._movementBound[1] = state.overflow[1]
            ? state._movementBound[1] === false
                ? state._movement[1]
                : state._movementBound[1]
            : false;
        // @ts-ignore
        var rubberband = state._active ? config.rubberband || [0, 0] : [0, 0];
        state.offset = (0, maths_1.computeRubberband)(state._bounds, state.offset, rubberband);
        state.delta = maths_1.V.sub(state.offset, previousOffset);
        this.computeMovement();
        if (gestureIsActive && (!state.last || dt > BEFORE_LAST_KINEMATICS_DELAY)) {
            state.delta = maths_1.V.sub(state.offset, previousOffset);
            var absoluteDelta = state.delta.map(Math.abs);
            maths_1.V.addTo(state.distance, absoluteDelta);
            state.direction = state.delta.map(Math.sign);
            state._direction = state._delta.map(Math.sign);
            // calculates kinematics unless the gesture starts or ends or if the
            // dt === 0 (which can happen on high frame rate monitors, see issue #581)
            // because of privacy protection:
            // https://developer.mozilla.org/en-US/docs/Web/API/Event/timeStamp#reduced_time_precision
            if (!state.first && dt > 0) {
                state.velocity = [absoluteDelta[0] / dt, absoluteDelta[1] / dt];
                state.timeDelta = dt;
            }
        }
    };
    /**
     * Fires the gesture handler.
     */
    Engine.prototype.emit = function () {
        var _a;
        var state = this.state;
        var shared = this.shared;
        var config = this.config;
        if (!state._active)
            this.clean();
        // we don't trigger the handler if the gesture is blocked or non intentional,
        // unless the `_force` flag was set or the `triggerAllEvents` option was set
        // to true in the config.
        if ((state._blocked || !state.intentional) && !state._force && !config.triggerAllEvents)
            return;
        // @ts-ignore
        var memo = this.handler(__assign(__assign(__assign({}, shared), state), (_a = {}, _a[this.aliasKey] = state.values, _a)));
        // Sets memo to the returned value of the handler (unless it's  undefined)
        if (memo !== undefined)
            state.memo = memo;
    };
    /**
     * Cleans the gesture timeouts and event listeners.
     */
    Engine.prototype.clean = function () {
        this.eventStore.clean();
        this.timeoutStore.clean();
    };
    return Engine;
}());
exports.Engine = Engine;
