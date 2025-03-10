"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRecognizers = useRecognizers;
/* eslint-disable react-hooks/exhaustive-deps */
var react_1 = require("react");
var core_1 = require("@use-gesture/core");
/**
 * Utility hook called by all gesture hooks and that will be responsible for
 * the internals.
 *
 * @param {InternalHandlers} handlers
 * @param {GenericOptions} config
 * @param {GestureKey} gestureKey
 * @param {NativeHandler} nativeHandlers
 * @returns nothing when config.target is set, a binding function when not.
 */
function useRecognizers(handlers, config, gestureKey, nativeHandlers) {
    if (config === void 0) { config = {}; }
    var ctrl = react_1.default.useMemo(function () { return new core_1.Controller(handlers); }, []);
    ctrl.applyHandlers(handlers, nativeHandlers);
    ctrl.applyConfig(config, gestureKey);
    react_1.default.useEffect(ctrl.effect.bind(ctrl));
    react_1.default.useEffect(function () {
        return ctrl.clean.bind(ctrl);
    }, []);
    // When target is undefined we return the bind function of the controller which
    // returns prop handlers.
    // @ts-ignore
    if (config.target === undefined) {
        return ctrl.bind.bind(ctrl);
    }
    return undefined;
}
