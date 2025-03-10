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
exports.DragEngine = void 0;
var CoordinatesEngine_1 = require("./CoordinatesEngine");
var coordinatesConfigResolver_1 = require("../config/coordinatesConfigResolver");
var events_1 = require("../utils/events");
var maths_1 = require("../utils/maths");
var KEYS_DELTA_MAP = {
    ArrowRight: function (displacement, factor) {
        if (factor === void 0) { factor = 1; }
        return [displacement * factor, 0];
    },
    ArrowLeft: function (displacement, factor) {
        if (factor === void 0) { factor = 1; }
        return [-1 * displacement * factor, 0];
    },
    ArrowUp: function (displacement, factor) {
        if (factor === void 0) { factor = 1; }
        return [0, -1 * displacement * factor];
    },
    ArrowDown: function (displacement, factor) {
        if (factor === void 0) { factor = 1; }
        return [0, displacement * factor];
    }
};
var DragEngine = /** @class */ (function (_super) {
    __extends(DragEngine, _super);
    function DragEngine() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.ingKey = 'dragging';
        return _this;
    }
    // superseeds generic Engine reset call
    DragEngine.prototype.reset = function () {
        _super.prototype.reset.call(this);
        var state = this.state;
        state._pointerId = undefined;
        state._pointerActive = false;
        state._keyboardActive = false;
        state._preventScroll = false;
        state._delayed = false;
        state.swipe = [0, 0];
        state.tap = false;
        state.canceled = false;
        state.cancel = this.cancel.bind(this);
    };
    DragEngine.prototype.setup = function () {
        var state = this.state;
        if (state._bounds instanceof HTMLElement) {
            var boundRect = state._bounds.getBoundingClientRect();
            var targetRect = state.currentTarget.getBoundingClientRect();
            var _bounds = {
                left: boundRect.left - targetRect.left + state.offset[0],
                right: boundRect.right - targetRect.right + state.offset[0],
                top: boundRect.top - targetRect.top + state.offset[1],
                bottom: boundRect.bottom - targetRect.bottom + state.offset[1]
            };
            state._bounds = coordinatesConfigResolver_1.coordinatesConfigResolver.bounds(_bounds);
        }
    };
    DragEngine.prototype.cancel = function () {
        var _this = this;
        var state = this.state;
        if (state.canceled)
            return;
        state.canceled = true;
        state._active = false;
        setTimeout(function () {
            // we run compute with no event so that kinematics won't be computed
            _this.compute();
            _this.emit();
        }, 0);
    };
    DragEngine.prototype.setActive = function () {
        this.state._active = this.state._pointerActive || this.state._keyboardActive;
    };
    // superseeds Engine clean function
    DragEngine.prototype.clean = function () {
        this.pointerClean();
        this.state._pointerActive = false;
        this.state._keyboardActive = false;
        _super.prototype.clean.call(this);
    };
    DragEngine.prototype.pointerDown = function (event) {
        var config = this.config;
        var state = this.state;
        if (event.buttons != null &&
            // If the user submits an array as pointer.buttons, don't start the drag
            // if event.buttons isn't included inside that array.
            (Array.isArray(config.pointerButtons)
                ? !config.pointerButtons.includes(event.buttons)
                : // If the user submits a number as pointer.buttons, refuse the drag if
                    // config.pointerButtons is different than `-1` and if event.buttons
                    // doesn't match the combination.
                    config.pointerButtons !== -1 && config.pointerButtons !== event.buttons))
            return;
        var ctrlIds = this.ctrl.setEventIds(event);
        // We need to capture all pointer ids so that we can keep track of them when
        // they're released off the target
        if (config.pointerCapture) {
            ;
            event.target.setPointerCapture(event.pointerId);
        }
        if (
        // in some situations (https://github.com/pmndrs/use-gesture/issues/494#issuecomment-1127584116)
        // like when a new browser tab is opened during a drag gesture, the drag
        // can be interrupted mid-way, and can stall. This happens because the
        // pointerId that initiated the gesture is lost, and since the drag
        // persists until that pointerId is lifted with pointerup, it never ends.
        //
        // Therefore, when we detect that only one pointer is pressing the screen,
        // we consider that the gesture can proceed.
        ctrlIds &&
            ctrlIds.size > 1 &&
            state._pointerActive)
            return;
        this.start(event);
        this.setupPointer(event);
        state._pointerId = (0, events_1.pointerId)(event);
        state._pointerActive = true;
        this.computeValues((0, events_1.pointerValues)(event));
        this.computeInitial();
        if (config.preventScrollAxis && (0, events_1.getPointerType)(event) !== 'mouse') {
            // when preventScrollAxis is set we don't consider the gesture active
            // until it's deliberate
            state._active = false;
            this.setupScrollPrevention(event);
        }
        else if (config.delay > 0) {
            this.setupDelayTrigger(event);
            // makes sure we emit all events when `triggerAllEvents` flag is `true`
            if (config.triggerAllEvents) {
                this.compute(event);
                this.emit();
            }
        }
        else {
            this.startPointerDrag(event);
        }
    };
    DragEngine.prototype.startPointerDrag = function (event) {
        var state = this.state;
        state._active = true;
        state._preventScroll = true;
        state._delayed = false;
        this.compute(event);
        this.emit();
    };
    DragEngine.prototype.pointerMove = function (event) {
        var state = this.state;
        var config = this.config;
        if (!state._pointerActive)
            return;
        var id = (0, events_1.pointerId)(event);
        if (state._pointerId !== undefined && id !== state._pointerId)
            return;
        var _values = (0, events_1.pointerValues)(event);
        if (document.pointerLockElement === event.target) {
            state._delta = [event.movementX, event.movementY];
        }
        else {
            state._delta = maths_1.V.sub(_values, state._values);
            this.computeValues(_values);
        }
        maths_1.V.addTo(state._movement, state._delta);
        this.compute(event);
        // if the gesture is delayed but deliberate, then we can start it
        // immediately.
        if (state._delayed && state.intentional) {
            this.timeoutStore.remove('dragDelay');
            // makes sure `first` is still true when moving for the first time after a
            // delay.
            state.active = false;
            this.startPointerDrag(event);
            return;
        }
        if (config.preventScrollAxis && !state._preventScroll) {
            if (state.axis) {
                if (state.axis === config.preventScrollAxis || config.preventScrollAxis === 'xy') {
                    state._active = false;
                    this.clean();
                    return;
                }
                else {
                    this.timeoutStore.remove('startPointerDrag');
                    this.startPointerDrag(event);
                    return;
                }
            }
            else {
                return;
            }
        }
        this.emit();
    };
    DragEngine.prototype.pointerUp = function (event) {
        this.ctrl.setEventIds(event);
        // We release the pointer id if it has pointer capture
        try {
            if (this.config.pointerCapture && event.target.hasPointerCapture(event.pointerId)) {
                // this shouldn't be necessary as it should be automatic when releasing the pointer
                ;
                event.target.releasePointerCapture(event.pointerId);
            }
        }
        catch (_a) {
            if (process.env.NODE_ENV === 'development') {
                // eslint-disable-next-line no-console
                console.warn("[@use-gesture]: If you see this message, it's likely that you're using an outdated version of `@react-three/fiber`. \n\nPlease upgrade to the latest version.");
            }
        }
        var state = this.state;
        var config = this.config;
        if (!state._active || !state._pointerActive)
            return;
        var id = (0, events_1.pointerId)(event);
        if (state._pointerId !== undefined && id !== state._pointerId)
            return;
        this.state._pointerActive = false;
        this.setActive();
        this.compute(event);
        var _b = state._distance, dx = _b[0], dy = _b[1];
        state.tap = dx <= config.tapsThreshold && dy <= config.tapsThreshold;
        if (state.tap && config.filterTaps) {
            state._force = true;
        }
        else {
            var _c = state._delta, _dx = _c[0], _dy = _c[1];
            var _d = state._movement, _mx = _d[0], _my = _d[1];
            var _e = config.swipe.velocity, svx = _e[0], svy = _e[1];
            var _f = config.swipe.distance, sx = _f[0], sy = _f[1];
            var sdt = config.swipe.duration;
            if (state.elapsedTime < sdt) {
                var _vx = Math.abs(_dx / state.timeDelta);
                var _vy = Math.abs(_dy / state.timeDelta);
                if (_vx > svx && Math.abs(_mx) > sx)
                    state.swipe[0] = Math.sign(_dx);
                if (_vy > svy && Math.abs(_my) > sy)
                    state.swipe[1] = Math.sign(_dy);
            }
        }
        this.emit();
    };
    DragEngine.prototype.pointerClick = function (event) {
        // event.detail indicates the number of buttons being pressed. When it's
        // null, it's likely to be a keyboard event from the Enter Key that could
        // be used for accessibility, and therefore shouldn't be prevented.
        // See https://github.com/pmndrs/use-gesture/issues/530
        if (!this.state.tap && event.detail > 0) {
            event.preventDefault();
            event.stopPropagation();
        }
    };
    DragEngine.prototype.setupPointer = function (event) {
        var config = this.config;
        var device = config.device;
        if (process.env.NODE_ENV === 'development') {
            try {
                if (device === 'pointer' && config.preventScrollDelay === undefined) {
                    // @ts-ignore (warning for r3f)
                    var currentTarget = 'uv' in event ? event.sourceEvent.currentTarget : event.currentTarget;
                    var style = window.getComputedStyle(currentTarget);
                    if (style.touchAction === 'auto') {
                        // eslint-disable-next-line no-console
                        console.warn("[@use-gesture]: The drag target has its `touch-action` style property set to `auto`. It is recommended to add `touch-action: 'none'` so that the drag gesture behaves correctly on touch-enabled devices. For more information read this: https://use-gesture.netlify.app/docs/extras/#touch-action.\n\nThis message will only show in development mode. It won't appear in production. If this is intended, you can ignore it.", currentTarget);
                    }
                }
            }
            catch (_a) { }
        }
        if (config.pointerLock) {
            ;
            event.currentTarget.requestPointerLock();
        }
        if (!config.pointerCapture) {
            this.eventStore.add(this.sharedConfig.window, device, 'change', this.pointerMove.bind(this));
            this.eventStore.add(this.sharedConfig.window, device, 'end', this.pointerUp.bind(this));
            this.eventStore.add(this.sharedConfig.window, device, 'cancel', this.pointerUp.bind(this));
        }
    };
    DragEngine.prototype.pointerClean = function () {
        if (this.config.pointerLock && document.pointerLockElement === this.state.currentTarget) {
            document.exitPointerLock();
        }
    };
    DragEngine.prototype.preventScroll = function (event) {
        if (this.state._preventScroll && event.cancelable) {
            event.preventDefault();
        }
    };
    DragEngine.prototype.setupScrollPrevention = function (event) {
        // fixes https://github.com/pmndrs/use-gesture/issues/497
        this.state._preventScroll = false;
        persistEvent(event);
        // we add window listeners that will prevent the scroll when the user has started dragging
        var remove = this.eventStore.add(this.sharedConfig.window, 'touch', 'change', this.preventScroll.bind(this), {
            passive: false
        });
        this.eventStore.add(this.sharedConfig.window, 'touch', 'end', remove);
        this.eventStore.add(this.sharedConfig.window, 'touch', 'cancel', remove);
        this.timeoutStore.add('startPointerDrag', this.startPointerDrag.bind(this), this.config.preventScrollDelay, event);
    };
    DragEngine.prototype.setupDelayTrigger = function (event) {
        var _this = this;
        this.state._delayed = true;
        this.timeoutStore.add('dragDelay', function () {
            // forces drag to start no matter the threshold when delay is reached
            _this.state._step = [0, 0];
            _this.startPointerDrag(event);
        }, this.config.delay);
    };
    DragEngine.prototype.keyDown = function (event) {
        // @ts-ignore
        var deltaFn = KEYS_DELTA_MAP[event.key];
        if (deltaFn) {
            var state = this.state;
            var factor = event.shiftKey ? 10 : event.altKey ? 0.1 : 1;
            this.start(event);
            state._delta = deltaFn(this.config.keyboardDisplacement, factor);
            state._keyboardActive = true;
            maths_1.V.addTo(state._movement, state._delta);
            this.compute(event);
            this.emit();
        }
    };
    DragEngine.prototype.keyUp = function (event) {
        if (!(event.key in KEYS_DELTA_MAP))
            return;
        this.state._keyboardActive = false;
        this.setActive();
        this.compute(event);
        this.emit();
    };
    DragEngine.prototype.bind = function (bindFunction) {
        var device = this.config.device;
        bindFunction(device, 'start', this.pointerDown.bind(this));
        if (this.config.pointerCapture) {
            bindFunction(device, 'change', this.pointerMove.bind(this));
            bindFunction(device, 'end', this.pointerUp.bind(this));
            bindFunction(device, 'cancel', this.pointerUp.bind(this));
            bindFunction('lostPointerCapture', '', this.pointerUp.bind(this));
        }
        if (this.config.keys) {
            bindFunction('key', 'down', this.keyDown.bind(this));
            bindFunction('key', 'up', this.keyUp.bind(this));
        }
        if (this.config.filterTaps) {
            bindFunction('click', '', this.pointerClick.bind(this), { capture: true, passive: false });
        }
    };
    return DragEngine;
}(CoordinatesEngine_1.CoordinatesEngine));
exports.DragEngine = DragEngine;
function persistEvent(event) {
    // @ts-ignore
    'persist' in event && typeof event.persist === 'function' && event.persist();
}
