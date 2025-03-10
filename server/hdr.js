"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isHdrSupported = isHdrSupported;
exports.getVideoSelectionOptions = getVideoSelectionOptions;
var level_1 = require("../types/level");
/**
 * @returns Whether we can detect and validate HDR capability within the window context
 */
function isHdrSupported() {
    if (typeof matchMedia === 'function') {
        var mediaQueryList = matchMedia('(dynamic-range: high)');
        var badQuery = matchMedia('bad query');
        if (mediaQueryList.media !== badQuery.media) {
            return mediaQueryList.matches === true;
        }
    }
    return false;
}
/**
 * Sanitizes inputs to return the active video selection options for HDR/SDR.
 * When both inputs are null:
 *
 *    `{ preferHDR: false, allowedVideoRanges: [] }`
 *
 * When `currentVideoRange` non-null, maintain the active range:
 *
 *    `{ preferHDR: currentVideoRange !== 'SDR', allowedVideoRanges: [currentVideoRange] }`
 *
 * When VideoSelectionOption non-null:
 *
 *  - Allow all video ranges if `allowedVideoRanges` unspecified.
 *  - If `preferHDR` is non-null use the value to filter `allowedVideoRanges`.
 *  - Else check window for HDR support and set `preferHDR` to the result.
 *
 * @param currentVideoRange
 * @param videoPreference
 */
function getVideoSelectionOptions(currentVideoRange, videoPreference) {
    var preferHDR = false;
    var allowedVideoRanges = [];
    if (currentVideoRange) {
        preferHDR = currentVideoRange !== 'SDR';
        allowedVideoRanges = [currentVideoRange];
    }
    if (videoPreference) {
        allowedVideoRanges =
            videoPreference.allowedVideoRanges || level_1.VideoRangeValues.slice(0);
        preferHDR =
            videoPreference.preferHDR !== undefined
                ? videoPreference.preferHDR
                : isHdrSupported();
        if (preferHDR) {
            allowedVideoRanges = allowedVideoRanges.filter(function (range) { return range !== 'SDR'; });
        }
        else {
            allowedVideoRanges = ['SDR'];
        }
    }
    return {
        preferHDR: preferHDR,
        allowedVideoRanges: allowedVideoRanges,
    };
}
