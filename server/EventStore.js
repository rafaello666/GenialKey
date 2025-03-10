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
exports.EventStore = void 0;
var events_1 = require("./utils/events");
var EventStore = /** @class */ (function () {
    function EventStore(ctrl, gestureKey) {
        this._listeners = new Set();
        this._ctrl = ctrl;
        this._gestureKey = gestureKey;
    }
    EventStore.prototype.add = function (element, device, action, handler, options) {
        var listeners = this._listeners;
        var type = (0, events_1.toDomEventType)(device, action);
        var _options = this._gestureKey ? this._ctrl.config[this._gestureKey].eventOptions : {};
        var eventOptions = __assign(__assign({}, _options), options);
        element.addEventListener(type, handler, eventOptions);
        var remove = function () {
            element.removeEventListener(type, handler, eventOptions);
            listeners.delete(remove);
        };
        listeners.add(remove);
        return remove;
    };
    EventStore.prototype.clean = function () {
        this._listeners.forEach(function (remove) { return remove(); });
        this._listeners.clear(); // just for safety
    };
    return EventStore;
}());
exports.EventStore = EventStore;
