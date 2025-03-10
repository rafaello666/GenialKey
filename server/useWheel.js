"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWheel = useWheel;
var actions_1 = require("@use-gesture/core/actions");
var useRecognizers_1 = require("./useRecognizers");
/**
 * Wheel hook.
 *
 * @param {Handler<'wheel'>} handler - the function fired every time the wheel gesture updates
 * @param {UserWheelConfig} config - the config object including generic options and wheel options
 */
function useWheel(handler, config) {
    (0, actions_1.registerAction)(actions_1.wheelAction);
    return (0, useRecognizers_1.useRecognizers)({ wheel: handler }, config || {}, 'wheel');
}
