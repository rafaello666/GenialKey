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
exports.Controller = void 0;
var actions_1 = require("./actions");
var resolver_1 = require("./config/resolver");
var events_1 = require("./utils/events");
var EventStore_1 = require("./EventStore");
var TimeoutStore_1 = require("./TimeoutStore");
var fn_1 = require("./utils/fn");
var Controller = /** @class */ (function () {
    function Controller(handlers) {
        /**
         * The list of gestures handled by the Controller.
         */
        this.gestures = new Set();
        /**
         * The event store that keeps track of the config.target listeners.
         */
        this._targetEventStore = new EventStore_1.EventStore(this);
        /**
         * Object that keeps track of all gesture event listeners.
         */
        this.gestureEventStores = {};
        this.gestureTimeoutStores = {};
        this.handlers = {};
        this.config = {};
        this.pointerIds = new Set();
        this.touchIds = new Set();
        this.state = {
            shared: {
                shiftKey: false,
                metaKey: false,
                ctrlKey: false,
                altKey: false
            }
        };
        resolveGestures(this, handlers);
    }
    /**
     * Sets pointer or touch ids based on the event.
     * @param event
     */
    Controller.prototype.setEventIds = function (event) {
        if ((0, events_1.isTouch)(event)) {
            this.touchIds = new Set((0, events_1.touchIds)(event));
            return this.touchIds;
        }
        else if ('pointerId' in event) {
            if (event.type === 'pointerup' || event.type === 'pointercancel')
                this.pointerIds.delete(event.pointerId);
            else if (event.type === 'pointerdown')
                this.pointerIds.add(event.pointerId);
            return this.pointerIds;
        }
    };
    /**
     * Attaches handlers to the controller.
     * @param handlers
     * @param nativeHandlers
     */
    Controller.prototype.applyHandlers = function (handlers, nativeHandlers) {
        this.handlers = handlers;
        this.nativeHandlers = nativeHandlers;
    };
    /**
     * Compute and attaches a config to the controller.
     * @param config
     * @param gestureKey
     */
    Controller.prototype.applyConfig = function (config, gestureKey) {
        this.config = (0, resolver_1.parse)(config, gestureKey, this.config);
    };
    /**
     * Cleans all side effects (listeners, timeouts). When the gesture is
     * destroyed (in React, when the component is unmounted.)
     */
    Controller.prototype.clean = function () {
        this._targetEventStore.clean();
        for (var _i = 0, _a = this.gestures; _i < _a.length; _i++) {
            var key = _a[_i];
            this.gestureEventStores[key].clean();
            this.gestureTimeoutStores[key].clean();
        }
    };
    /**
     * Executes side effects (attaching listeners to a `config.target`). Ran on
     * each render.
     */
    Controller.prototype.effect = function () {
        var _this = this;
        if (this.config.shared.target)
            this.bind();
        return function () { return _this._targetEventStore.clean(); };
    };
    /**
     * The bind function that can be returned by the gesture handler (a hook in
     * React for example.)
     * @param args
     */
    Controller.prototype.bind = function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var sharedConfig = this.config.shared;
        var props = {};
        var target;
        if (sharedConfig.target) {
            target = sharedConfig.target();
            // if target is undefined let's stop
            if (!target)
                return;
        }
        if (sharedConfig.enabled) {
            // Adding gesture handlers
            for (var _a = 0, _b = this.gestures; _a < _b.length; _a++) {
                var gestureKey = _b[_a];
                var gestureConfig = this.config[gestureKey];
                var bindFunction = bindToProps(props, gestureConfig.eventOptions, !!target);
                if (gestureConfig.enabled) {
                    var Engine = actions_1.EngineMap.get(gestureKey);
                    // @ts-ignore
                    new Engine(this, args, gestureKey).bind(bindFunction);
                }
            }
            // Adding native handlers
            var nativeBindFunction = bindToProps(props, sharedConfig.eventOptions, !!target);
            var _loop_1 = function (eventKey) {
                nativeBindFunction(eventKey, '', 
                // @ts-ignore
                function (event) { return _this.nativeHandlers[eventKey](__assign(__assign({}, _this.state.shared), { event: event, args: args })); }, undefined, true);
            };
            for (var eventKey in this.nativeHandlers) {
                _loop_1(eventKey);
            }
        }
        // If target isn't set, we return an object that contains gesture handlers
        // mapped to props handler event keys.
        for (var handlerProp in props) {
            props[handlerProp] = fn_1.chain.apply(void 0, props[handlerProp]);
        }
        // When target isn't specified then return hanlder props.
        if (!target)
            return props;
        // When target is specified, then add listeners to the controller target
        // store.
        for (var handlerProp in props) {
            var _c = (0, events_1.parseProp)(handlerProp), device = _c.device, capture = _c.capture, passive = _c.passive;
            this._targetEventStore.add(target, device, '', props[handlerProp], { capture: capture, passive: passive });
        }
    };
    return Controller;
}());
exports.Controller = Controller;
function setupGesture(ctrl, gestureKey) {
    ctrl.gestures.add(gestureKey);
    ctrl.gestureEventStores[gestureKey] = new EventStore_1.EventStore(ctrl, gestureKey);
    ctrl.gestureTimeoutStores[gestureKey] = new TimeoutStore_1.TimeoutStore();
}
function resolveGestures(ctrl, internalHandlers) {
    // make sure hover handlers are added first to prevent bugs such as #322
    // where the hover pointerLeave handler is removed before the move
    // pointerLeave, which prevents hovering: false to be fired.
    if (internalHandlers.drag)
        setupGesture(ctrl, 'drag');
    if (internalHandlers.wheel)
        setupGesture(ctrl, 'wheel');
    if (internalHandlers.scroll)
        setupGesture(ctrl, 'scroll');
    if (internalHandlers.move)
        setupGesture(ctrl, 'move');
    if (internalHandlers.pinch)
        setupGesture(ctrl, 'pinch');
    if (internalHandlers.hover)
        setupGesture(ctrl, 'hover');
}
var bindToProps = function (props, eventOptions, withPassiveOption) {
    return function (device, action, handler, options, isNative) {
        var _a, _b;
        if (options === void 0) { options = {}; }
        if (isNative === void 0) { isNative = false; }
        var capture = (_a = options.capture) !== null && _a !== void 0 ? _a : eventOptions.capture;
        var passive = (_b = options.passive) !== null && _b !== void 0 ? _b : eventOptions.passive;
        // a native handler is already passed as a prop like "onMouseDown"
        var handlerProp = isNative ? device : (0, events_1.toHandlerProp)(device, action, capture);
        if (withPassiveOption && passive)
            handlerProp += 'Passive';
        props[handlerProp] = props[handlerProp] || [];
        props[handlerProp].push(handler);
    };
};
