"use strict";
/**
 * SAMPLE-AES decrypter
 */
Object.defineProperty(exports, "__esModule", { value: true });
var decrypter_1 = require("../crypt/decrypter");
var mp4_tools_1 = require("../utils/mp4-tools");
var SampleAesDecrypter = /** @class */ (function () {
    function SampleAesDecrypter(observer, config, keyData) {
        this.keyData = keyData;
        this.decrypter = new decrypter_1.default(config, {
            removePKCS7Padding: false,
        });
    }
    SampleAesDecrypter.prototype.decryptBuffer = function (encryptedData) {
        return this.decrypter.decrypt(encryptedData, this.keyData.key.buffer, this.keyData.iv.buffer);
    };
    // AAC - encrypt all full 16 bytes blocks starting from offset 16
    SampleAesDecrypter.prototype.decryptAacSample = function (samples, sampleIndex, callback) {
        var _this = this;
        var curUnit = samples[sampleIndex].unit;
        if (curUnit.length <= 16) {
            // No encrypted portion in this sample (first 16 bytes is not
            // encrypted, see https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/HLS_Sample_Encryption/Encryption/Encryption.html),
            return;
        }
        var encryptedData = curUnit.subarray(16, curUnit.length - (curUnit.length % 16));
        var encryptedBuffer = encryptedData.buffer.slice(encryptedData.byteOffset, encryptedData.byteOffset + encryptedData.length);
        this.decryptBuffer(encryptedBuffer).then(function (decryptedBuffer) {
            var decryptedData = new Uint8Array(decryptedBuffer);
            curUnit.set(decryptedData, 16);
            if (!_this.decrypter.isSync()) {
                _this.decryptAacSamples(samples, sampleIndex + 1, callback);
            }
        });
    };
    SampleAesDecrypter.prototype.decryptAacSamples = function (samples, sampleIndex, callback) {
        for (;; sampleIndex++) {
            if (sampleIndex >= samples.length) {
                callback();
                return;
            }
            if (samples[sampleIndex].unit.length < 32) {
                continue;
            }
            this.decryptAacSample(samples, sampleIndex, callback);
            if (!this.decrypter.isSync()) {
                return;
            }
        }
    };
    // AVC - encrypt one 16 bytes block out of ten, starting from offset 32
    SampleAesDecrypter.prototype.getAvcEncryptedData = function (decodedData) {
        var encryptedDataLen = Math.floor((decodedData.length - 48) / 160) * 16 + 16;
        var encryptedData = new Int8Array(encryptedDataLen);
        var outputPos = 0;
        for (var inputPos = 32; inputPos < decodedData.length - 16; inputPos += 160, outputPos += 16) {
            encryptedData.set(decodedData.subarray(inputPos, inputPos + 16), outputPos);
        }
        return encryptedData;
    };
    SampleAesDecrypter.prototype.getAvcDecryptedUnit = function (decodedData, decryptedData) {
        var uint8DecryptedData = new Uint8Array(decryptedData);
        var inputPos = 0;
        for (var outputPos = 32; outputPos < decodedData.length - 16; outputPos += 160, inputPos += 16) {
            decodedData.set(uint8DecryptedData.subarray(inputPos, inputPos + 16), outputPos);
        }
        return decodedData;
    };
    SampleAesDecrypter.prototype.decryptAvcSample = function (samples, sampleIndex, unitIndex, callback, curUnit) {
        var _this = this;
        var decodedData = (0, mp4_tools_1.discardEPB)(curUnit.data);
        var encryptedData = this.getAvcEncryptedData(decodedData);
        this.decryptBuffer(encryptedData.buffer).then(function (decryptedBuffer) {
            curUnit.data = _this.getAvcDecryptedUnit(decodedData, decryptedBuffer);
            if (!_this.decrypter.isSync()) {
                _this.decryptAvcSamples(samples, sampleIndex, unitIndex + 1, callback);
            }
        });
    };
    SampleAesDecrypter.prototype.decryptAvcSamples = function (samples, sampleIndex, unitIndex, callback) {
        if (samples instanceof Uint8Array) {
            throw new Error('Cannot decrypt samples of type Uint8Array');
        }
        for (;; sampleIndex++, unitIndex = 0) {
            if (sampleIndex >= samples.length) {
                callback();
                return;
            }
            var curUnits = samples[sampleIndex].units;
            for (;; unitIndex++) {
                if (unitIndex >= curUnits.length) {
                    break;
                }
                var curUnit = curUnits[unitIndex];
                if (curUnit.data.length <= 48 ||
                    (curUnit.type !== 1 && curUnit.type !== 5)) {
                    continue;
                }
                this.decryptAvcSample(samples, sampleIndex, unitIndex, callback, curUnit);
                if (!this.decrypter.isSync()) {
                    return;
                }
            }
        }
    };
    return SampleAesDecrypter;
}());
exports.default = SampleAesDecrypter;
