"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.V = void 0;
exports.clamp = clamp;
exports.rubberbandIfOutOfBounds = rubberbandIfOutOfBounds;
exports.computeRubberband = computeRubberband;
function clamp(v, min, max) {
    return Math.max(min, Math.min(v, max));
}
exports.V = {
    toVector: function (v, fallback) {
        if (v === undefined)
            v = fallback;
        return Array.isArray(v) ? v : [v, v];
    },
    add: function (v1, v2) {
        return [v1[0] + v2[0], v1[1] + v2[1]];
    },
    sub: function (v1, v2) {
        return [v1[0] - v2[0], v1[1] - v2[1]];
    },
    addTo: function (v1, v2) {
        v1[0] += v2[0];
        v1[1] += v2[1];
    },
    subTo: function (v1, v2) {
        v1[0] -= v2[0];
        v1[1] -= v2[1];
    }
};
// Based on @aholachek ;)
// https://twitter.com/chpwn/status/285540192096497664
// iOS constant = 0.55
// https://medium.com/@nathangitter/building-fluid-interfaces-ios-swift-9732bb934bf5
function rubberband(distance, dimension, constant) {
    if (dimension === 0 || Math.abs(dimension) === Infinity)
        return Math.pow(distance, constant * 5);
    return (distance * dimension * constant) / (dimension + constant * distance);
}
function rubberbandIfOutOfBounds(position, min, max, constant) {
    if (constant === void 0) { constant = 0.15; }
    if (constant === 0)
        return clamp(position, min, max);
    if (position < min)
        return -rubberband(min - position, max - min, constant) + min;
    if (position > max)
        return +rubberband(position - max, max - min, constant) + max;
    return position;
}
function computeRubberband(bounds, _a, _b) {
    var Vx = _a[0], Vy = _a[1];
    var Rx = _b[0], Ry = _b[1];
    var _c = bounds[0], X0 = _c[0], X1 = _c[1], _d = bounds[1], Y0 = _d[0], Y1 = _d[1];
    return [rubberbandIfOutOfBounds(Vx, X0, X1, Rx), rubberbandIfOutOfBounds(Vy, Y0, Y1, Ry)];
}
