"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mp4_tools_1 = require("./mp4-tools");
var typed_array_1 = require("./typed-array");
var Chunker = /** @class */ (function () {
    function Chunker(chunkSize) {
        if (chunkSize === void 0) { chunkSize = Math.pow(2, 19); }
        this.cache = null;
        this.chunkSize = chunkSize;
    }
    Chunker.prototype.push = function (data) {
        var _a = this, cache = _a.cache, chunkSize = _a.chunkSize;
        var result = [];
        var temp = null;
        if (cache === null || cache === void 0 ? void 0 : cache.length) {
            temp = (0, mp4_tools_1.appendUint8Array)(cache, data);
            this.cache = null;
        }
        else {
            temp = data;
        }
        if (temp.length < chunkSize) {
            this.cache = temp;
            return result;
        }
        if (temp.length > chunkSize) {
            var offset = 0;
            var len = temp.length;
            while (offset < len - chunkSize) {
                result.push((0, typed_array_1.sliceUint8)(temp, offset, offset + chunkSize));
                offset += chunkSize;
            }
            this.cache = (0, typed_array_1.sliceUint8)(temp, offset);
        }
        else {
            result.push(temp);
        }
        return result;
    };
    return Chunker;
}());
exports.default = Chunker;
