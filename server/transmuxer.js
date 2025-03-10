"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChunkMetadata = void 0;
var ChunkMetadata = /** @class */ (function () {
    function ChunkMetadata(level, sn, id, size, part, partial) {
        if (size === void 0) { size = 0; }
        if (part === void 0) { part = -1; }
        if (partial === void 0) { partial = false; }
        this.transmuxing = getNewPerformanceTiming();
        this.buffering = {
            audio: getNewPerformanceTiming(),
            video: getNewPerformanceTiming(),
            audiovideo: getNewPerformanceTiming(),
        };
        this.level = level;
        this.sn = sn;
        this.id = id;
        this.size = size;
        this.part = part;
        this.partial = partial;
    }
    return ChunkMetadata;
}());
exports.ChunkMetadata = ChunkMetadata;
function getNewPerformanceTiming() {
    return { start: 0, executeStart: 0, executeEnd: 0, end: 0 };
}
