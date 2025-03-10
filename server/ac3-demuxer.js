"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AC3Demuxer = void 0;
exports.appendFrame = appendFrame;
var base_audio_demuxer_1 = require("./base-audio-demuxer");
var id3_1 = require("../id3");
var dolby_1 = require("./dolby");
var AC3Demuxer = /** @class */ (function (_super) {
    __extends(AC3Demuxer, _super);
    function AC3Demuxer(observer) {
        var _this = _super.call(this) || this;
        _this.observer = observer;
        return _this;
    }
    AC3Demuxer.prototype.resetInitSegment = function (initSegment, audioCodec, videoCodec, trackDuration) {
        _super.prototype.resetInitSegment.call(this, initSegment, audioCodec, videoCodec, trackDuration);
        this._audioTrack = {
            container: 'audio/ac-3',
            type: 'audio',
            id: 2,
            pid: -1,
            sequenceNumber: 0,
            segmentCodec: 'ac3',
            samples: [],
            manifestCodec: audioCodec,
            duration: trackDuration,
            inputTimeScale: 90000,
            dropped: 0,
        };
    };
    AC3Demuxer.prototype.canParse = function (data, offset) {
        return offset + 64 < data.length;
    };
    AC3Demuxer.prototype.appendFrame = function (track, data, offset) {
        var frameLength = appendFrame(track, data, offset, this.basePTS, this.frameIndex);
        if (frameLength !== -1) {
            var sample = track.samples[track.samples.length - 1];
            return { sample: sample, length: frameLength, missing: 0 };
        }
    };
    AC3Demuxer.probe = function (data) {
        if (!data) {
            return false;
        }
        var id3Data = (0, id3_1.getID3Data)(data, 0);
        if (!id3Data) {
            return false;
        }
        // look for the ac-3 sync bytes
        var offset = id3Data.length;
        if (data[offset] === 0x0b &&
            data[offset + 1] === 0x77 &&
            (0, id3_1.getTimeStamp)(id3Data) !== undefined &&
            // check the bsid to confirm ac-3
            (0, dolby_1.getAudioBSID)(data, offset) < 16) {
            return true;
        }
        return false;
    };
    return AC3Demuxer;
}(base_audio_demuxer_1.default));
exports.AC3Demuxer = AC3Demuxer;
function appendFrame(track, data, start, pts, frameIndex) {
    if (start + 8 > data.length) {
        return -1; // not enough bytes left
    }
    if (data[start] !== 0x0b || data[start + 1] !== 0x77) {
        return -1; // invalid magic
    }
    // get sample rate
    var samplingRateCode = data[start + 4] >> 6;
    if (samplingRateCode >= 3) {
        return -1; // invalid sampling rate
    }
    var samplingRateMap = [48000, 44100, 32000];
    var sampleRate = samplingRateMap[samplingRateCode];
    // get frame size
    var frameSizeCode = data[start + 4] & 0x3f;
    var frameSizeMap = [
        64, 69, 96, 64, 70, 96, 80, 87, 120, 80, 88, 120, 96, 104, 144, 96, 105,
        144, 112, 121, 168, 112, 122, 168, 128, 139, 192, 128, 140, 192, 160, 174,
        240, 160, 175, 240, 192, 208, 288, 192, 209, 288, 224, 243, 336, 224, 244,
        336, 256, 278, 384, 256, 279, 384, 320, 348, 480, 320, 349, 480, 384, 417,
        576, 384, 418, 576, 448, 487, 672, 448, 488, 672, 512, 557, 768, 512, 558,
        768, 640, 696, 960, 640, 697, 960, 768, 835, 1152, 768, 836, 1152, 896, 975,
        1344, 896, 976, 1344, 1024, 1114, 1536, 1024, 1115, 1536, 1152, 1253, 1728,
        1152, 1254, 1728, 1280, 1393, 1920, 1280, 1394, 1920,
    ];
    var frameLength = frameSizeMap[frameSizeCode * 3 + samplingRateCode] * 2;
    if (start + frameLength > data.length) {
        return -1;
    }
    // get channel count
    var channelMode = data[start + 6] >> 5;
    var skipCount = 0;
    if (channelMode === 2) {
        skipCount += 2;
    }
    else {
        if (channelMode & 1 && channelMode !== 1) {
            skipCount += 2;
        }
        if (channelMode & 4) {
            skipCount += 2;
        }
    }
    var lfeon = (((data[start + 6] << 8) | data[start + 7]) >> (12 - skipCount)) & 1;
    var channelsMap = [2, 1, 2, 3, 3, 4, 4, 5];
    var channelCount = channelsMap[channelMode] + lfeon;
    // build dac3 box
    var bsid = data[start + 5] >> 3;
    var bsmod = data[start + 5] & 7;
    var config = new Uint8Array([
        (samplingRateCode << 6) | (bsid << 1) | (bsmod >> 2),
        ((bsmod & 3) << 6) |
            (channelMode << 3) |
            (lfeon << 2) |
            (frameSizeCode >> 4),
        (frameSizeCode << 4) & 0xe0,
    ]);
    var frameDuration = (1536 / sampleRate) * 90000;
    var stamp = pts + frameIndex * frameDuration;
    var unit = data.subarray(start, start + frameLength);
    track.config = config;
    track.channelCount = channelCount;
    track.samplerate = sampleRate;
    track.samples.push({ unit: unit, pts: stamp });
    return frameLength;
}
