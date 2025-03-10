"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dummyTrack = dummyTrack;
function dummyTrack(type, inputTimeScale) {
    if (type === void 0) { type = ''; }
    if (inputTimeScale === void 0) { inputTimeScale = 90000; }
    return {
        type: type,
        id: -1,
        pid: -1,
        inputTimeScale: inputTimeScale,
        sequenceNumber: -1,
        samples: [],
        dropped: 0,
    };
}
