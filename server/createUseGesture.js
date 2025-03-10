"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUseGesture = createUseGesture;
var core_1 = require("@use-gesture/core");
var actions_1 = require("@use-gesture/core/actions");
var useRecognizers_1 = require("./useRecognizers");
function createUseGesture(actions) {
    actions.forEach(actions_1.registerAction);
    return function useGesture(_handlers, _config) {
        var _a = (0, core_1.parseMergedHandlers)(_handlers, _config || {}), handlers = _a.handlers, nativeHandlers = _a.nativeHandlers, config = _a.config;
        return (0, useRecognizers_1.useRecognizers)(handlers, config, undefined, nativeHandlers);
    };
}
