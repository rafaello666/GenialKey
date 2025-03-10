"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHover = useHover;
var actions_1 = require("@use-gesture/core/actions");
var useRecognizers_1 = require("./useRecognizers");
/**
 * Hover hook.
 *
 * @param {Handler<'hover'>} handler - the function fired every time the hover gesture updates
 * @param {UserHoverConfig} config - the config object including generic options and hover options
 */
function useHover(handler, config) {
    (0, actions_1.registerAction)(actions_1.hoverAction);
    return (0, useRecognizers_1.useRecognizers)({ hover: handler }, config || {}, 'hover');
}
