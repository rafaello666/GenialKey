"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ChunkCache = /** @class */ (function () {
    function ChunkCache() {
        this.chunks = [];
        this.dataLength = 0;
    }
    ChunkCache.prototype.push = function (chunk) {
        this.chunks.push(chunk);
        this.dataLength += chunk.length;
    };
    ChunkCache.prototype.flush = function () {
        var _a = this, chunks = _a.chunks, dataLength = _a.dataLength;
        var result;
        if (!chunks.length) {
            return new Uint8Array(0);
        }
        else if (chunks.length === 1) {
            result = chunks[0];
        }
        else {
            result = concatUint8Arrays(chunks, dataLength);
        }
        this.reset();
        return result;
    };
    ChunkCache.prototype.reset = function () {
        this.chunks.length = 0;
        this.dataLength = 0;
    };
    return ChunkCache;
}());
exports.default = ChunkCache;
function concatUint8Arrays(chunks, dataLength) {
    var result = new Uint8Array(dataLength);
    var offset = 0;
    for (var i = 0; i < chunks.length; i++) {
        var chunk = chunks[i];
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
}
