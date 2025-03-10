"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTimescaleFromBase = toTimescaleFromBase;
exports.toTimescaleFromScale = toTimescaleFromScale;
exports.toMsFromMpegTsClock = toMsFromMpegTsClock;
exports.toMpegTsClockFromTimescale = toMpegTsClockFromTimescale;
var MPEG_TS_CLOCK_FREQ_HZ = 90000;
function toTimescaleFromBase(baseTime, destScale, srcBase, round) {
    if (srcBase === void 0) { srcBase = 1; }
    if (round === void 0) { round = false; }
    var result = baseTime * destScale * srcBase; // equivalent to `(value * scale) / (1 / base)`
    return round ? Math.round(result) : result;
}
function toTimescaleFromScale(baseTime, destScale, srcScale, round) {
    if (srcScale === void 0) { srcScale = 1; }
    if (round === void 0) { round = false; }
    return toTimescaleFromBase(baseTime, destScale, 1 / srcScale, round);
}
function toMsFromMpegTsClock(baseTime, round) {
    if (round === void 0) { round = false; }
    return toTimescaleFromBase(baseTime, 1000, 1 / MPEG_TS_CLOCK_FREQ_HZ, round);
}
function toMpegTsClockFromTimescale(baseTime, srcScale) {
    if (srcScale === void 0) { srcScale = 1; }
    return toTimescaleFromBase(baseTime, MPEG_TS_CLOCK_FREQ_HZ, 1 / srcScale);
}
