"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePinch = usePinch;
var actions_1 = require("@use-gesture/core/actions");
var useRecognizers_1 = require("./useRecognizers");
/**
 * Pinch hook.
 *
 * @param {Handler<'pinch'>} handler - the function fired every time the pinch gesture updates
 * @param {UserPinchConfig} config - the config object including generic options and pinch options
 */
function usePinch(handler, config) {
    (0, actions_1.registerAction)(actions_1.pinchAction);
    return (0, useRecognizers_1.useRecognizers)({ pinch: handler }, config || {}, 'pinch');
}
