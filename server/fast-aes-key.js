"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FastAESKey = /** @class */ (function () {
    function FastAESKey(subtle, key) {
        this.subtle = subtle;
        this.key = key;
    }
    FastAESKey.prototype.expandKey = function () {
        return this.subtle.importKey('raw', this.key, { name: 'AES-CBC' }, false, [
            'encrypt',
            'decrypt',
        ]);
    };
    return FastAESKey;
}());
exports.default = FastAESKey;
