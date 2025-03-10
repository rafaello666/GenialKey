"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LevelKey = void 0;
var keysystem_util_1 = require("../utils/keysystem-util");
var mediakeys_helper_1 = require("../utils/mediakeys-helper");
var mp4_tools_1 = require("../utils/mp4-tools");
var logger_1 = require("../utils/logger");
var keyUriToKeyIdMap = {};
var LevelKey = /** @class */ (function () {
    function LevelKey(method, uri, format, formatversions, iv) {
        if (formatversions === void 0) { formatversions = [1]; }
        if (iv === void 0) { iv = null; }
        this.iv = null;
        this.key = null;
        this.keyId = null;
        this.pssh = null;
        this.method = method;
        this.uri = uri;
        this.keyFormat = format;
        this.keyFormatVersions = formatversions;
        this.iv = iv;
        this.encrypted = method ? method !== 'NONE' : false;
        this.isCommonEncryption = this.encrypted && method !== 'AES-128';
    }
    LevelKey.clearKeyUriToKeyIdMap = function () {
        keyUriToKeyIdMap = {};
    };
    LevelKey.prototype.isSupported = function () {
        // If it's Segment encryption or No encryption, just select that key system
        if (this.method) {
            if (this.method === 'AES-128' || this.method === 'NONE') {
                return true;
            }
            if (this.keyFormat === 'identity') {
                // Maintain support for clear SAMPLE-AES with MPEG-3 TS
                return this.method === 'SAMPLE-AES';
            }
            else if (__USE_EME_DRM__) {
                switch (this.keyFormat) {
                    case mediakeys_helper_1.KeySystemFormats.FAIRPLAY:
                    case mediakeys_helper_1.KeySystemFormats.WIDEVINE:
                    case mediakeys_helper_1.KeySystemFormats.PLAYREADY:
                    case mediakeys_helper_1.KeySystemFormats.CLEARKEY:
                        return ([
                            'ISO-23001-7',
                            'SAMPLE-AES',
                            'SAMPLE-AES-CENC',
                            'SAMPLE-AES-CTR',
                        ].indexOf(this.method) !== -1);
                }
            }
        }
        return false;
    };
    LevelKey.prototype.getDecryptData = function (sn) {
        if (!this.encrypted || !this.uri) {
            return null;
        }
        if (this.method === 'AES-128' && this.uri && !this.iv) {
            if (typeof sn !== 'number') {
                // We are fetching decryption data for a initialization segment
                // If the segment was encrypted with AES-128
                // It must have an IV defined. We cannot substitute the Segment Number in.
                if (this.method === 'AES-128' && !this.iv) {
                    logger_1.logger.warn("missing IV for initialization segment with method=\"".concat(this.method, "\" - compliance issue"));
                }
                // Explicitly set sn to resulting value from implicit conversions 'initSegment' values for IV generation.
                sn = 0;
            }
            var iv = createInitializationVector(sn);
            var decryptdata = new LevelKey(this.method, this.uri, 'identity', this.keyFormatVersions, iv);
            return decryptdata;
        }
        if (!__USE_EME_DRM__) {
            return this;
        }
        // Initialize keyId if possible
        var keyBytes = (0, keysystem_util_1.convertDataUriToArrayBytes)(this.uri);
        if (keyBytes) {
            switch (this.keyFormat) {
                case mediakeys_helper_1.KeySystemFormats.WIDEVINE:
                    // Setting `pssh` on this LevelKey/DecryptData allows HLS.js to generate a session using
                    // the playlist-key before the "encrypted" event. (Comment out to only use "encrypted" path.)
                    this.pssh = keyBytes;
                    // In case of widevine keyID is embedded in PSSH box. Read Key ID.
                    if (keyBytes.length >= 22) {
                        this.keyId = keyBytes.subarray(keyBytes.length - 22, keyBytes.length - 6);
                    }
                    break;
                case mediakeys_helper_1.KeySystemFormats.PLAYREADY: {
                    var PlayReadyKeySystemUUID = new Uint8Array([
                        0x9a, 0x04, 0xf0, 0x79, 0x98, 0x40, 0x42, 0x86, 0xab, 0x92, 0xe6,
                        0x5b, 0xe0, 0x88, 0x5f, 0x95,
                    ]);
                    // Setting `pssh` on this LevelKey/DecryptData allows HLS.js to generate a session using
                    // the playlist-key before the "encrypted" event. (Comment out to only use "encrypted" path.)
                    this.pssh = (0, mp4_tools_1.mp4pssh)(PlayReadyKeySystemUUID, null, keyBytes);
                    this.keyId = (0, mediakeys_helper_1.parsePlayReadyWRM)(keyBytes);
                    break;
                }
                default: {
                    var keydata = keyBytes.subarray(0, 16);
                    if (keydata.length !== 16) {
                        var padded = new Uint8Array(16);
                        padded.set(keydata, 16 - keydata.length);
                        keydata = padded;
                    }
                    this.keyId = keydata;
                    break;
                }
            }
        }
        // Default behavior: assign a new keyId for each uri
        if (!this.keyId || this.keyId.byteLength !== 16) {
            var keyId = keyUriToKeyIdMap[this.uri];
            if (!keyId) {
                var val = Object.keys(keyUriToKeyIdMap).length % Number.MAX_SAFE_INTEGER;
                keyId = new Uint8Array(16);
                var dv = new DataView(keyId.buffer, 12, 4); // Just set the last 4 bytes
                dv.setUint32(0, val);
                keyUriToKeyIdMap[this.uri] = keyId;
            }
            this.keyId = keyId;
        }
        return this;
    };
    return LevelKey;
}());
exports.LevelKey = LevelKey;
function createInitializationVector(segmentNumber) {
    var uint8View = new Uint8Array(16);
    for (var i = 12; i < 16; i++) {
        uint8View[i] = (segmentNumber >> (8 * (15 - i))) & 0xff;
    }
    return uint8View;
}
