"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadStats = void 0;
var LoadStats = /** @class */ (function () {
    function LoadStats() {
        this.aborted = false;
        this.loaded = 0;
        this.retry = 0;
        this.total = 0;
        this.chunkCount = 0;
        this.bwEstimate = 0;
        this.loading = { start: 0, first: 0, end: 0 };
        this.parsing = { start: 0, end: 0 };
        this.buffering = { start: 0, first: 0, end: 0 };
    }
    return LoadStats;
}());
exports.LoadStats = LoadStats;
