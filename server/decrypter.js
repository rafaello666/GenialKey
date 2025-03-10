"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var aes_crypto_1 = require("./aes-crypto");
var fast_aes_key_1 = require("./fast-aes-key");
var aes_decryptor_1 = require("./aes-decryptor");
var logger_1 = require("../utils/logger");
var mp4_tools_1 = require("../utils/mp4-tools");
var typed_array_1 = require("../utils/typed-array");
var CHUNK_SIZE = 16; // 16 bytes, 128 bits
var Decrypter = /** @class */ (function () {
    function Decrypter(config, _a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.removePKCS7Padding, removePKCS7Padding = _c === void 0 ? true : _c;
        this.logEnabled = true;
        this.subtle = null;
        this.softwareDecrypter = null;
        this.key = null;
        this.fastAesKey = null;
        this.remainderData = null;
        this.currentIV = null;
        this.currentResult = null;
        this.useSoftware = config.enableSoftwareAES;
        this.removePKCS7Padding = removePKCS7Padding;
        // built in decryptor expects PKCS7 padding
        if (removePKCS7Padding) {
            try {
                var browserCrypto = self.crypto;
                if (browserCrypto) {
                    this.subtle =
                        browserCrypto.subtle ||
                            browserCrypto.webkitSubtle;
                }
            }
            catch (e) {
                /* no-op */
            }
        }
        this.useSoftware = !this.subtle;
    }
    Decrypter.prototype.destroy = function () {
        this.subtle = null;
        this.softwareDecrypter = null;
        this.key = null;
        this.fastAesKey = null;
        this.remainderData = null;
        this.currentIV = null;
        this.currentResult = null;
    };
    Decrypter.prototype.isSync = function () {
        return this.useSoftware;
    };
    Decrypter.prototype.flush = function () {
        var _a = this, currentResult = _a.currentResult, remainderData = _a.remainderData;
        if (!currentResult || remainderData) {
            this.reset();
            return null;
        }
        var data = new Uint8Array(currentResult);
        this.reset();
        if (this.removePKCS7Padding) {
            return (0, aes_decryptor_1.removePadding)(data);
        }
        return data;
    };
    Decrypter.prototype.reset = function () {
        this.currentResult = null;
        this.currentIV = null;
        this.remainderData = null;
        if (this.softwareDecrypter) {
            this.softwareDecrypter = null;
        }
    };
    Decrypter.prototype.decrypt = function (data, key, iv) {
        var _this = this;
        if (this.useSoftware) {
            return new Promise(function (resolve, reject) {
                _this.softwareDecrypt(new Uint8Array(data), key, iv);
                var decryptResult = _this.flush();
                if (decryptResult) {
                    resolve(decryptResult.buffer);
                }
                else {
                    reject(new Error('[softwareDecrypt] Failed to decrypt data'));
                }
            });
        }
        return this.webCryptoDecrypt(new Uint8Array(data), key, iv);
    };
    // Software decryption is progressive. Progressive decryption may not return a result on each call. Any cached
    // data is handled in the flush() call
    Decrypter.prototype.softwareDecrypt = function (data, key, iv) {
        var _a = this, currentIV = _a.currentIV, currentResult = _a.currentResult, remainderData = _a.remainderData;
        this.logOnce('JS AES decrypt');
        // The output is staggered during progressive parsing - the current result is cached, and emitted on the next call
        // This is done in order to strip PKCS7 padding, which is found at the end of each segment. We only know we've reached
        // the end on flush(), but by that time we have already received all bytes for the segment.
        // Progressive decryption does not work with WebCrypto
        if (remainderData) {
            data = (0, mp4_tools_1.appendUint8Array)(remainderData, data);
            this.remainderData = null;
        }
        // Byte length must be a multiple of 16 (AES-128 = 128 bit blocks = 16 bytes)
        var currentChunk = this.getValidChunk(data);
        if (!currentChunk.length) {
            return null;
        }
        if (currentIV) {
            iv = currentIV;
        }
        var softwareDecrypter = this.softwareDecrypter;
        if (!softwareDecrypter) {
            softwareDecrypter = this.softwareDecrypter = new aes_decryptor_1.default();
        }
        softwareDecrypter.expandKey(key);
        var result = currentResult;
        this.currentResult = softwareDecrypter.decrypt(currentChunk.buffer, 0, iv);
        this.currentIV = (0, typed_array_1.sliceUint8)(currentChunk, -16).buffer;
        if (!result) {
            return null;
        }
        return result;
    };
    Decrypter.prototype.webCryptoDecrypt = function (data, key, iv) {
        var _this = this;
        if (this.key !== key || !this.fastAesKey) {
            if (!this.subtle) {
                return Promise.resolve(this.onWebCryptoError(data, key, iv));
            }
            this.key = key;
            this.fastAesKey = new fast_aes_key_1.default(this.subtle, key);
        }
        return this.fastAesKey
            .expandKey()
            .then(function (aesKey) {
            // decrypt using web crypto
            if (!_this.subtle) {
                return Promise.reject(new Error('web crypto not initialized'));
            }
            _this.logOnce('WebCrypto AES decrypt');
            var crypto = new aes_crypto_1.default(_this.subtle, new Uint8Array(iv));
            return crypto.decrypt(data.buffer, aesKey);
        })
            .catch(function (err) {
            logger_1.logger.warn("[decrypter]: WebCrypto Error, disable WebCrypto API, ".concat(err.name, ": ").concat(err.message));
            return _this.onWebCryptoError(data, key, iv);
        });
    };
    Decrypter.prototype.onWebCryptoError = function (data, key, iv) {
        this.useSoftware = true;
        this.logEnabled = true;
        this.softwareDecrypt(data, key, iv);
        var decryptResult = this.flush();
        if (decryptResult) {
            return decryptResult.buffer;
        }
        throw new Error('WebCrypto and softwareDecrypt: failed to decrypt data');
    };
    Decrypter.prototype.getValidChunk = function (data) {
        var currentChunk = data;
        var splitPoint = data.length - (data.length % CHUNK_SIZE);
        if (splitPoint !== data.length) {
            currentChunk = (0, typed_array_1.sliceUint8)(data, 0, splitPoint);
            this.remainderData = (0, typed_array_1.sliceUint8)(data, splitPoint);
        }
        return currentChunk;
    };
    Decrypter.prototype.logOnce = function (msg) {
        if (!this.logEnabled) {
            return;
        }
        logger_1.logger.log("[decrypter]: ".concat(msg));
        this.logEnabled = false;
    };
    return Decrypter;
}());
exports.default = Decrypter;
