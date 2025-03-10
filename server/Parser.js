"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMergedHandlers = parseMergedHandlers;
var actions_1 = require("./actions");
var RE_NOT_NATIVE = /^on(Drag|Wheel|Scroll|Move|Pinch|Hover)/;
function sortHandlers(_handlers) {
    var native = {};
    var handlers = {};
    var actions = new Set();
    for (var key in _handlers) {
        if (RE_NOT_NATIVE.test(key)) {
            actions.add(RegExp.lastMatch);
            // @ts-ignore
            handlers[key] = _handlers[key];
        }
        else {
            // @ts-ignore
            native[key] = _handlers[key];
        }
    }
    return [handlers, native, actions];
}
function registerGesture(actions, handlers, handlerKey, key, internalHandlers, config) {
    if (!actions.has(handlerKey))
        return;
    if (!actions_1.EngineMap.has(key)) {
        if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.warn("[@use-gesture]: You've created a custom handler that that uses the `".concat(key, "` gesture but isn't properly configured.\n\nPlease add `").concat(key, "Action` when creating your handler."));
        }
        return;
    }
    var startKey = handlerKey + 'Start';
    var endKey = handlerKey + 'End';
    var fn = function (state) {
        var memo = undefined;
        // @ts-ignore
        if (state.first && startKey in handlers)
            handlers[startKey](state);
        // @ts-ignore
        if (handlerKey in handlers)
            memo = handlers[handlerKey](state);
        // @ts-ignore
        if (state.last && endKey in handlers)
            handlers[endKey](state);
        return memo;
    };
    internalHandlers[key] = fn;
    config[key] = config[key] || {};
}
function parseMergedHandlers(mergedHandlers, mergedConfig) {
    var _a = sortHandlers(mergedHandlers), handlers = _a[0], nativeHandlers = _a[1], actions = _a[2];
    var internalHandlers = {};
    registerGesture(actions, handlers, 'onDrag', 'drag', internalHandlers, mergedConfig);
    registerGesture(actions, handlers, 'onWheel', 'wheel', internalHandlers, mergedConfig);
    registerGesture(actions, handlers, 'onScroll', 'scroll', internalHandlers, mergedConfig);
    registerGesture(actions, handlers, 'onPinch', 'pinch', internalHandlers, mergedConfig);
    registerGesture(actions, handlers, 'onMove', 'move', internalHandlers, mergedConfig);
    registerGesture(actions, handlers, 'onHover', 'hover', internalHandlers, mergedConfig);
    return { handlers: internalHandlers, config: mergedConfig, nativeHandlers: nativeHandlers };
}
