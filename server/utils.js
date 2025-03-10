"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useIsomorphicLayoutEffect = void 0;
exports.useMutableCallback = useMutableCallback;
const react_1 = __importDefault(require("react"));
/**
 * An SSR-friendly useLayoutEffect.
 *
 * React currently throws a warning when using useLayoutEffect on the server.
 * To get around it, we can conditionally useEffect on the server (no-op) and
 * useLayoutEffect elsewhere.
 *
 * @see https://github.com/facebook/react/issues/14927
 */
exports.useIsomorphicLayoutEffect = typeof window !== 'undefined' && (window.document?.createElement || window.navigator?.product === 'ReactNative')
    ? react_1.default.useLayoutEffect
    : react_1.default.useEffect;
function useMutableCallback(fn) {
    const ref = react_1.default.useRef(fn);
    (0, exports.useIsomorphicLayoutEffect)(() => void (ref.current = fn), [fn]);
    return ref;
}
