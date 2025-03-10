"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestMediaKeySystemAccess = void 0;
exports.keySystemFormatToKeySystemDomain = keySystemFormatToKeySystemDomain;
exports.keySystemIdToKeySystemDomain = keySystemIdToKeySystemDomain;
exports.keySystemDomainToKeySystemFormat = keySystemDomainToKeySystemFormat;
exports.getKeySystemsForConfig = getKeySystemsForConfig;
exports.getSupportedMediaKeySystemConfigurations = getSupportedMediaKeySystemConfigurations;
exports.parsePlayReadyWRM = parsePlayReadyWRM;
var global_1 = require("./global");
var keysystem_util_1 = require("./keysystem-util");
var numeric_encoding_utils_1 = require("./numeric-encoding-utils");
function keySystemFormatToKeySystemDomain(format) {
    switch (format) {
        case "com.apple.streamingkeydelivery" /* KeySystemFormats.FAIRPLAY */:
            return "com.apple.fps" /* KeySystems.FAIRPLAY */;
        case "com.microsoft.playready" /* KeySystemFormats.PLAYREADY */:
            return "com.microsoft.playready" /* KeySystems.PLAYREADY */;
        case "urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed" /* KeySystemFormats.WIDEVINE */:
            return "com.widevine.alpha" /* KeySystems.WIDEVINE */;
        case "org.w3.clearkey" /* KeySystemFormats.CLEARKEY */:
            return "org.w3.clearkey" /* KeySystems.CLEARKEY */;
    }
}
function keySystemIdToKeySystemDomain(systemId) {
    if (systemId === "edef8ba979d64acea3c827dcd51d21ed" /* KeySystemIds.WIDEVINE */) {
        return "com.widevine.alpha" /* KeySystems.WIDEVINE */;
    }
    else if (systemId === "9a04f07998404286ab92e65be0885f95" /* KeySystemIds.PLAYREADY */) {
        return "com.microsoft.playready" /* KeySystems.PLAYREADY */;
    }
    else if (systemId === "1077efecc0b24d02ace33c1e52e2fb4b" /* KeySystemIds.CENC */ ||
        systemId === "e2719d58a985b3c9781ab030af78d30e" /* KeySystemIds.CLEARKEY */) {
        return "org.w3.clearkey" /* KeySystems.CLEARKEY */;
    }
}
function keySystemDomainToKeySystemFormat(keySystem) {
    switch (keySystem) {
        case "com.apple.fps" /* KeySystems.FAIRPLAY */:
            return "com.apple.streamingkeydelivery" /* KeySystemFormats.FAIRPLAY */;
        case "com.microsoft.playready" /* KeySystems.PLAYREADY */:
            return "com.microsoft.playready" /* KeySystemFormats.PLAYREADY */;
        case "com.widevine.alpha" /* KeySystems.WIDEVINE */:
            return "urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed" /* KeySystemFormats.WIDEVINE */;
        case "org.w3.clearkey" /* KeySystems.CLEARKEY */:
            return "org.w3.clearkey" /* KeySystemFormats.CLEARKEY */;
    }
}
function getKeySystemsForConfig(config) {
    var drmSystems = config.drmSystems, widevineLicenseUrl = config.widevineLicenseUrl;
    var keySystemsToAttempt = drmSystems
        ? [
            "com.apple.fps" /* KeySystems.FAIRPLAY */,
            "com.widevine.alpha" /* KeySystems.WIDEVINE */,
            "com.microsoft.playready" /* KeySystems.PLAYREADY */,
            "org.w3.clearkey" /* KeySystems.CLEARKEY */,
        ].filter(function (keySystem) { return !!drmSystems[keySystem]; })
        : [];
    if (!keySystemsToAttempt["com.widevine.alpha" /* KeySystems.WIDEVINE */] && widevineLicenseUrl) {
        keySystemsToAttempt.push("com.widevine.alpha" /* KeySystems.WIDEVINE */);
    }
    return keySystemsToAttempt;
}
exports.requestMediaKeySystemAccess = (function () {
    var _a;
    if ((_a = global_1.optionalSelf === null || global_1.optionalSelf === void 0 ? void 0 : global_1.optionalSelf.navigator) === null || _a === void 0 ? void 0 : _a.requestMediaKeySystemAccess) {
        return self.navigator.requestMediaKeySystemAccess.bind(self.navigator);
    }
    else {
        return null;
    }
})();
/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MediaKeySystemConfiguration
 */
function getSupportedMediaKeySystemConfigurations(keySystem, audioCodecs, videoCodecs, drmSystemOptions) {
    var initDataTypes;
    switch (keySystem) {
        case "com.apple.fps" /* KeySystems.FAIRPLAY */:
            initDataTypes = ['cenc', 'sinf'];
            break;
        case "com.widevine.alpha" /* KeySystems.WIDEVINE */:
        case "com.microsoft.playready" /* KeySystems.PLAYREADY */:
            initDataTypes = ['cenc'];
            break;
        case "org.w3.clearkey" /* KeySystems.CLEARKEY */:
            initDataTypes = ['cenc', 'keyids'];
            break;
        default:
            throw new Error("Unknown key-system: ".concat(keySystem));
    }
    return createMediaKeySystemConfigurations(initDataTypes, audioCodecs, videoCodecs, drmSystemOptions);
}
function createMediaKeySystemConfigurations(initDataTypes, audioCodecs, videoCodecs, drmSystemOptions) {
    var baseConfig = {
        initDataTypes: initDataTypes,
        persistentState: drmSystemOptions.persistentState || 'optional',
        distinctiveIdentifier: drmSystemOptions.distinctiveIdentifier || 'optional',
        sessionTypes: drmSystemOptions.sessionTypes || [
            drmSystemOptions.sessionType || 'temporary',
        ],
        audioCapabilities: audioCodecs.map(function (codec) { return ({
            contentType: "audio/mp4; codecs=\"".concat(codec, "\""),
            robustness: drmSystemOptions.audioRobustness || '',
            encryptionScheme: drmSystemOptions.audioEncryptionScheme || null,
        }); }),
        videoCapabilities: videoCodecs.map(function (codec) { return ({
            contentType: "video/mp4; codecs=\"".concat(codec, "\""),
            robustness: drmSystemOptions.videoRobustness || '',
            encryptionScheme: drmSystemOptions.videoEncryptionScheme || null,
        }); }),
    };
    return [baseConfig];
}
function parsePlayReadyWRM(keyBytes) {
    var keyBytesUtf16 = new Uint16Array(keyBytes.buffer, keyBytes.byteOffset, keyBytes.byteLength / 2);
    var keyByteStr = String.fromCharCode.apply(null, Array.from(keyBytesUtf16));
    // Parse Playready WRMHeader XML
    var xmlKeyBytes = keyByteStr.substring(keyByteStr.indexOf('<'), keyByteStr.length);
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(xmlKeyBytes, 'text/xml');
    var keyData = xmlDoc.getElementsByTagName('KID')[0];
    if (keyData) {
        var keyId = keyData.childNodes[0]
            ? keyData.childNodes[0].nodeValue
            : keyData.getAttribute('VALUE');
        if (keyId) {
            var keyIdArray = (0, numeric_encoding_utils_1.base64Decode)(keyId).subarray(0, 16);
            // KID value in PRO is a base64-encoded little endian GUID interpretation of UUID
            // KID value in ‘tenc’ is a big endian UUID GUID interpretation of UUID
            (0, keysystem_util_1.changeEndianness)(keyIdArray);
            return keyIdArray;
        }
    }
    return null;
}
