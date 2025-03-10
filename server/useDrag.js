"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDrag = useDrag;
var actions_1 = require("@use-gesture/core/actions");
var useRecognizers_1 = require("./useRecognizers");
/**
 * Drag hook.
 *
 * @param {Handler<'drag'>} handler - the function fired every time the drag gesture updates
 * @param {UserDragConfig} config - the config object including generic options and drag options
 */
function useDrag(handler, config) {
    (0, actions_1.registerAction)(actions_1.dragAction);
    return (0, useRecognizers_1.useRecognizers)({ drag: handler }, config || {}, 'drag');
}
