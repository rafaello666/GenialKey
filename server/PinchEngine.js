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
exports.PinchEngine = void 0;
var Engine_1 = require("./Engine");
var events_1 = require("../utils/events");
var maths_1 = require("../utils/maths");
var state_1 = require("../utils/state");
var SCALE_ANGLE_RATIO_INTENT_DEG = 30;
var PINCH_WHEEL_RATIO = 100;
var PinchEngine = /** @class */ (function (_super) {
    __extends(PinchEngine, _super);
    function PinchEngine() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.ingKey = 'pinching';
        _this.aliasKey = 'da';
        return _this;
    }
    PinchEngine.prototype.init = function () {
        this.state.offset = [1, 0];
        this.state.lastOffset = [1, 0];
        this.state._pointerEvents = new Map();
    };
    // superseeds generic Engine reset call
    PinchEngine.prototype.reset = function () {
        _super.prototype.reset.call(this);
        var state = this.state;
        state._touchIds = [];
        state.canceled = false;
        state.cancel = this.cancel.bind(this);
        state.turns = 0;
    };
    PinchEngine.prototype.computeOffset = function () {
        var _a = this.state, type = _a.type, movement = _a.movement, lastOffset = _a.lastOffset;
        if (type === 'wheel') {
            this.state.offset = maths_1.V.add(movement, lastOffset);
        }
        else {
            this.state.offset = [(1 + movement[0]) * lastOffset[0], movement[1] + lastOffset[1]];
        }
    };
    PinchEngine.prototype.computeMovement = function () {
        var _a = this.state, offset = _a.offset, lastOffset = _a.lastOffset;
        this.state.movement = [offset[0] / lastOffset[0], offset[1] - lastOffset[1]];
    };
    PinchEngine.prototype.axisIntent = function () {
        var state = this.state;
        var _a = state._movement, _m0 = _a[0], _m1 = _a[1];
        if (!state.axis) {
            var axisMovementDifference = Math.abs(_m0) * SCALE_ANGLE_RATIO_INTENT_DEG - Math.abs(_m1);
            if (axisMovementDifference < 0)
                state.axis = 'angle';
            else if (axisMovementDifference > 0)
                state.axis = 'scale';
        }
    };
    PinchEngine.prototype.restrictToAxis = function (v) {
        if (this.config.lockDirection) {
            if (this.state.axis === 'scale')
                v[1] = 0;
            else if (this.state.axis === 'angle')
                v[0] = 0;
        }
    };
    PinchEngine.prototype.cancel = function () {
        var _this = this;
        var state = this.state;
        if (state.canceled)
            return;
        setTimeout(function () {
            state.canceled = true;
            state._active = false;
            // we run compute with no event so that kinematics won't be computed
            _this.compute();
            _this.emit();
        }, 0);
    };
    PinchEngine.prototype.touchStart = function (event) {
        this.ctrl.setEventIds(event);
        var state = this.state;
        var ctrlTouchIds = this.ctrl.touchIds;
        if (state._active) {
            // check that the touchIds that initiated the gesture are still enabled
            // This is useful for when the page loses track of the pointers (minifying
            // gesture on iPad).
            if (state._touchIds.every(function (id) { return ctrlTouchIds.has(id); }))
                return;
            // The gesture is still active, but probably didn't have the opportunity to
            // end properly, so we restart the pinch.
        }
        if (ctrlTouchIds.size < 2)
            return;
        this.start(event);
        state._touchIds = Array.from(ctrlTouchIds).slice(0, 2);
        var payload = (0, events_1.touchDistanceAngle)(event, state._touchIds);
        if (!payload)
            return;
        this.pinchStart(event, payload);
    };
    PinchEngine.prototype.pointerStart = function (event) {
        if (event.buttons != null && event.buttons % 2 !== 1)
            return;
        this.ctrl.setEventIds(event);
        event.target.setPointerCapture(event.pointerId);
        var state = this.state;
        var _pointerEvents = state._pointerEvents;
        var ctrlPointerIds = this.ctrl.pointerIds;
        if (state._active) {
            // see touchStart comment
            if (Array.from(_pointerEvents.keys()).every(function (id) { return ctrlPointerIds.has(id); }))
                return;
        }
        if (_pointerEvents.size < 2) {
            _pointerEvents.set(event.pointerId, event);
        }
        if (state._pointerEvents.size < 2)
            return;
        this.start(event);
        // @ts-ignore
        var payload = events_1.distanceAngle.apply(void 0, Array.from(_pointerEvents.values()));
        if (!payload)
            return;
        this.pinchStart(event, payload);
    };
    PinchEngine.prototype.pinchStart = function (event, payload) {
        var state = this.state;
        state.origin = payload.origin;
        this.computeValues([payload.distance, payload.angle]);
        this.computeInitial();
        this.compute(event);
        this.emit();
    };
    PinchEngine.prototype.touchMove = function (event) {
        if (!this.state._active)
            return;
        var payload = (0, events_1.touchDistanceAngle)(event, this.state._touchIds);
        if (!payload)
            return;
        this.pinchMove(event, payload);
    };
    PinchEngine.prototype.pointerMove = function (event) {
        var _pointerEvents = this.state._pointerEvents;
        if (_pointerEvents.has(event.pointerId)) {
            _pointerEvents.set(event.pointerId, event);
        }
        if (!this.state._active)
            return;
        // @ts-ignore
        var payload = events_1.distanceAngle.apply(void 0, Array.from(_pointerEvents.values()));
        if (!payload)
            return;
        this.pinchMove(event, payload);
    };
    PinchEngine.prototype.pinchMove = function (event, payload) {
        var state = this.state;
        var prev_a = state._values[1];
        var delta_a = payload.angle - prev_a;
        var delta_turns = 0;
        if (Math.abs(delta_a) > 270)
            delta_turns += Math.sign(delta_a);
        this.computeValues([payload.distance, payload.angle - 360 * delta_turns]);
        state.origin = payload.origin;
        state.turns = delta_turns;
        state._movement = [state._values[0] / state._initial[0] - 1, state._values[1] - state._initial[1]];
        this.compute(event);
        this.emit();
    };
    PinchEngine.prototype.touchEnd = function (event) {
        var _this = this;
        this.ctrl.setEventIds(event);
        if (!this.state._active)
            return;
        if (this.state._touchIds.some(function (id) { return !_this.ctrl.touchIds.has(id); })) {
            this.state._active = false;
            this.compute(event);
            this.emit();
        }
    };
    PinchEngine.prototype.pointerEnd = function (event) {
        var state = this.state;
        this.ctrl.setEventIds(event);
        try {
            // @ts-ignore r3f
            event.target.releasePointerCapture(event.pointerId);
        }
        catch (_a) { }
        if (state._pointerEvents.has(event.pointerId)) {
            state._pointerEvents.delete(event.pointerId);
        }
        if (!state._active)
            return;
        if (state._pointerEvents.size < 2) {
            state._active = false;
            this.compute(event);
            this.emit();
        }
    };
    PinchEngine.prototype.gestureStart = function (event) {
        if (event.cancelable)
            event.preventDefault();
        var state = this.state;
        if (state._active)
            return;
        this.start(event);
        this.computeValues([event.scale, event.rotation]);
        state.origin = [event.clientX, event.clientY];
        this.compute(event);
        this.emit();
    };
    PinchEngine.prototype.gestureMove = function (event) {
        if (event.cancelable)
            event.preventDefault();
        if (!this.state._active)
            return;
        var state = this.state;
        this.computeValues([event.scale, event.rotation]);
        state.origin = [event.clientX, event.clientY];
        var _previousMovement = state._movement;
        state._movement = [event.scale - 1, event.rotation];
        state._delta = maths_1.V.sub(state._movement, _previousMovement);
        this.compute(event);
        this.emit();
    };
    PinchEngine.prototype.gestureEnd = function (event) {
        if (!this.state._active)
            return;
        this.state._active = false;
        this.compute(event);
        this.emit();
    };
    PinchEngine.prototype.wheel = function (event) {
        var modifierKey = this.config.modifierKey;
        if (modifierKey && (Array.isArray(modifierKey) ? !modifierKey.find(function (k) { return event[k]; }) : !event[modifierKey]))
            return;
        if (!this.state._active)
            this.wheelStart(event);
        else
            this.wheelChange(event);
        this.timeoutStore.add('wheelEnd', this.wheelEnd.bind(this));
    };
    PinchEngine.prototype.wheelStart = function (event) {
        this.start(event);
        this.wheelChange(event);
    };
    PinchEngine.prototype.wheelChange = function (event) {
        var isR3f = 'uv' in event;
        if (!isR3f) {
            if (event.cancelable) {
                event.preventDefault();
            }
            if (process.env.NODE_ENV === 'development' && !event.defaultPrevented) {
                // eslint-disable-next-line no-console
                console.warn("[@use-gesture]: To properly support zoom on trackpads, try using the `target` option.\n\nThis message will only appear in development mode.");
            }
        }
        var state = this.state;
        state._delta = [(-(0, events_1.wheelValues)(event)[1] / PINCH_WHEEL_RATIO) * state.offset[0], 0];
        maths_1.V.addTo(state._movement, state._delta);
        // _movement rolls back to when it passed the bounds.
        (0, state_1.clampStateInternalMovementToBounds)(state);
        this.state.origin = [event.clientX, event.clientY];
        this.compute(event);
        this.emit();
    };
    PinchEngine.prototype.wheelEnd = function () {
        if (!this.state._active)
            return;
        this.state._active = false;
        this.compute();
        this.emit();
    };
    PinchEngine.prototype.bind = function (bindFunction) {
        var device = this.config.device;
        if (!!device) {
            // @ts-ignore
            bindFunction(device, 'start', this[device + 'Start'].bind(this));
            // @ts-ignore
            bindFunction(device, 'change', this[device + 'Move'].bind(this));
            // @ts-ignore
            bindFunction(device, 'end', this[device + 'End'].bind(this));
            // @ts-ignore
            bindFunction(device, 'cancel', this[device + 'End'].bind(this));
            // @ts-ignore
            bindFunction('lostPointerCapture', '', this[device + 'End'].bind(this));
        }
        // we try to set a passive listener, knowing that in any case React will
        // ignore it.
        if (this.config.pinchOnWheel) {
            bindFunction('wheel', '', this.wheel.bind(this), { passive: false });
        }
    };
    return PinchEngine;
}(Engine_1.Engine));
exports.PinchEngine = PinchEngine;
