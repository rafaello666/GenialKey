"use strict";
/**
 * MediaSource helper
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMediaSource = getMediaSource;
exports.isManagedMediaSource = isManagedMediaSource;
function getMediaSource(preferManagedMediaSource) {
    if (preferManagedMediaSource === void 0) { preferManagedMediaSource = true; }
    if (typeof self === 'undefined')
        return undefined;
    var mms = (preferManagedMediaSource || !self.MediaSource) &&
        self.ManagedMediaSource;
    return (mms ||
        self.MediaSource ||
        self.WebKitMediaSource);
}
function isManagedMediaSource(source) {
    return (typeof self !== 'undefined' && source === self.ManagedMediaSource);
}
