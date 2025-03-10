"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useScroll = useScroll;
var actions_1 = require("@use-gesture/core/actions");
var useRecognizers_1 = require("./useRecognizers");
/**
 * Scroll hook.
 *
 * @param {Handler<'scroll'>} handler - the function fired every time the scroll gesture updates
 * @param {UserScrollConfig} config - the config object including generic options and scroll options
 */
function useScroll(handler, config) {
    (0, actions_1.registerAction)(actions_1.scrollAction);
    return (0, useRecognizers_1.useRecognizers)({ scroll: handler }, config || {}, 'scroll');
}
