"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AESCrypto = /** @class */ (function () {
    function AESCrypto(subtle, iv) {
        this.subtle = subtle;
        this.aesIV = iv;
    }
    AESCrypto.prototype.decrypt = function (data, key) {
        return this.subtle.decrypt({ name: 'AES-CBC', iv: this.aesIV }, key, data);
    };
    return AESCrypto;
}());
exports.default = AESCrypto;
