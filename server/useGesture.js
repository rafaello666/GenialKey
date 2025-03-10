"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGesture = useGesture;
var actions_1 = require("@use-gesture/core/actions");
var createUseGesture_1 = require("./createUseGesture");
/**
 * @public
 *
 * The most complete gesture hook, allowing support for multiple gestures.
 *
 * @param {GestureHandlers} handlers - an object with on[Gesture] keys containg gesture handlers
 * @param {UserGestureConfig} config - the full config object
 */
function useGesture(handlers, config) {
    var hook = (0, createUseGesture_1.createUseGesture)([actions_1.dragAction, actions_1.pinchAction, actions_1.scrollAction, actions_1.wheelAction, actions_1.moveAction, actions_1.hoverAction]);
    return hook(handlers, config || {});
}
