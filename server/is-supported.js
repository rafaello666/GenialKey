"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMSESupported = isMSESupported;
exports.isSupported = isSupported;
exports.changeTypeSupported = changeTypeSupported;
var mediasource_helper_1 = require("./utils/mediasource-helper");
var codecs_1 = require("./utils/codecs");
function getSourceBuffer() {
    return self.SourceBuffer || self.WebKitSourceBuffer;
}
function isMSESupported() {
    var mediaSource = (0, mediasource_helper_1.getMediaSource)();
    if (!mediaSource) {
        return false;
    }
    // if SourceBuffer is exposed ensure its API is valid
    // Older browsers do not expose SourceBuffer globally so checking SourceBuffer.prototype is impossible
    var sourceBuffer = getSourceBuffer();
    return (!sourceBuffer ||
        (sourceBuffer.prototype &&
            typeof sourceBuffer.prototype.appendBuffer === 'function' &&
            typeof sourceBuffer.prototype.remove === 'function'));
}
function isSupported() {
    if (!isMSESupported()) {
        return false;
    }
    var mediaSource = (0, mediasource_helper_1.getMediaSource)();
    return (typeof (mediaSource === null || mediaSource === void 0 ? void 0 : mediaSource.isTypeSupported) === 'function' &&
        (['avc1.42E01E,mp4a.40.2', 'av01.0.01M.08', 'vp09.00.50.08'].some(function (codecsForVideoContainer) {
            return mediaSource.isTypeSupported((0, codecs_1.mimeTypeForCodec)(codecsForVideoContainer, 'video'));
        }) ||
            ['mp4a.40.2', 'fLaC'].some(function (codecForAudioContainer) {
                return mediaSource.isTypeSupported((0, codecs_1.mimeTypeForCodec)(codecForAudioContainer, 'audio'));
            })));
}
function changeTypeSupported() {
    var _a;
    var sourceBuffer = getSourceBuffer();
    return (typeof ((_a = sourceBuffer === null || sourceBuffer === void 0 ? void 0 : sourceBuffer.prototype) === null || _a === void 0 ? void 0 : _a.changeType) ===
        'function');
}
