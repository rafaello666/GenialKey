"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clampStateInternalMovementToBounds = clampStateInternalMovementToBounds;
// _movement rolls back to when it passed the bounds.
/**
 * @note code is currently used in WheelEngine and PinchEngine.
 */
function clampStateInternalMovementToBounds(state) {
    var _a = state.overflow, ox = _a[0], oy = _a[1];
    var _b = state._delta, dx = _b[0], dy = _b[1];
    var _c = state._direction, dirx = _c[0], diry = _c[1];
    if ((ox < 0 && dx > 0 && dirx < 0) || (ox > 0 && dx < 0 && dirx > 0)) {
        state._movement[0] = state._movementBound[0];
    }
    if ((oy < 0 && dy > 0 && diry < 0) || (oy > 0 && dy < 0 && diry > 0)) {
        state._movement[1] = state._movementBound[1];
    }
}
