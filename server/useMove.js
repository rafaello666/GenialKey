"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMove = useMove;
var actions_1 = require("@use-gesture/core/actions");
var useRecognizers_1 = require("./useRecognizers");
/**
 * Move hook.
 *
 * @param {Handler<'move'>} handler - the function fired every time the move gesture updates
 * @param {UserMoveConfig} config - the config object including generic options and move options
 */
function useMove(handler, config) {
    (0, actions_1.registerAction)(actions_1.moveAction);
    return (0, useRecognizers_1.useRecognizers)({ move: handler }, config || {}, 'move');
}
