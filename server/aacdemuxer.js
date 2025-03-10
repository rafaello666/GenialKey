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
/**
 * AAC demuxer
 */
var base_audio_demuxer_1 = require("./base-audio-demuxer");
var ADTS = require("./adts");
var MpegAudio = require("./mpegaudio");
var logger_1 = require("../../utils/logger");
var ID3 = require("../id3");
var AACDemuxer = /** @class */ (function (_super) {
    __extends(AACDemuxer, _super);
    function AACDemuxer(observer, config) {
        var _this = _super.call(this) || this;
        _this.observer = observer;
        _this.config = config;
        return _this;
    }
    AACDemuxer.prototype.resetInitSegment = function (initSegment, audioCodec, videoCodec, trackDuration) {
        _super.prototype.resetInitSegment.call(this, initSegment, audioCodec, videoCodec, trackDuration);
        this._audioTrack = {
            container: 'audio/adts',
            type: 'audio',
            id: 2,
            pid: -1,
            sequenceNumber: 0,
            segmentCodec: 'aac',
            samples: [],
            manifestCodec: audioCodec,
            duration: trackDuration,
            inputTimeScale: 90000,
            dropped: 0,
        };
    };
    // Source for probe info - https://wiki.multimedia.cx/index.php?title=ADTS
    AACDemuxer.probe = function (data) {
        if (!data) {
            return false;
        }
        // Check for the ADTS sync word
        // Look for ADTS header | 1111 1111 | 1111 X00X | where X can be either 0 or 1
        // Layer bits (position 14 and 15) in header should be always 0 for ADTS
        // More info https://wiki.multimedia.cx/index.php?title=ADTS
        var id3Data = ID3.getID3Data(data, 0);
        var offset = (id3Data === null || id3Data === void 0 ? void 0 : id3Data.length) || 0;
        if (MpegAudio.probe(data, offset)) {
            return false;
        }
        for (var length_1 = data.length; offset < length_1; offset++) {
            if (ADTS.probe(data, offset)) {
                logger_1.logger.log('ADTS sync word found !');
                return true;
            }
        }
        return false;
    };
    AACDemuxer.prototype.canParse = function (data, offset) {
        return ADTS.canParse(data, offset);
    };
    AACDemuxer.prototype.appendFrame = function (track, data, offset) {
        ADTS.initTrackConfig(track, this.observer, data, offset, track.manifestCodec);
        var frame = ADTS.appendFrame(track, data, offset, this.basePTS, this.frameIndex);
        if (frame && frame.missing === 0) {
            return frame;
        }
    };
    return AACDemuxer;
}(base_audio_demuxer_1.default));
exports.default = AACDemuxer;
