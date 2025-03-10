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
 * MP3 demuxer
 */
var base_audio_demuxer_1 = require("./base-audio-demuxer");
var id3_1 = require("../id3");
var dolby_1 = require("./dolby");
var logger_1 = require("../../utils/logger");
var MpegAudio = require("./mpegaudio");
var MP3Demuxer = /** @class */ (function (_super) {
    __extends(MP3Demuxer, _super);
    function MP3Demuxer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MP3Demuxer.prototype.resetInitSegment = function (initSegment, audioCodec, videoCodec, trackDuration) {
        _super.prototype.resetInitSegment.call(this, initSegment, audioCodec, videoCodec, trackDuration);
        this._audioTrack = {
            container: 'audio/mpeg',
            type: 'audio',
            id: 2,
            pid: -1,
            sequenceNumber: 0,
            segmentCodec: 'mp3',
            samples: [],
            manifestCodec: audioCodec,
            duration: trackDuration,
            inputTimeScale: 90000,
            dropped: 0,
        };
    };
    MP3Demuxer.probe = function (data) {
        if (!data) {
            return false;
        }
        // check if data contains ID3 timestamp and MPEG sync word
        // Look for MPEG header | 1111 1111 | 111X XYZX | where X can be either 0 or 1 and Y or Z should be 1
        // Layer bits (position 14 and 15) in header should be always different from 0 (Layer I or Layer II or Layer III)
        // More info http://www.mp3-tech.org/programmer/frame_header.html
        var id3Data = (0, id3_1.getID3Data)(data, 0);
        var offset = (id3Data === null || id3Data === void 0 ? void 0 : id3Data.length) || 0;
        // Check for ac-3|ec-3 sync bytes and return false if present
        if (id3Data &&
            data[offset] === 0x0b &&
            data[offset + 1] === 0x77 &&
            (0, id3_1.getTimeStamp)(id3Data) !== undefined &&
            // check the bsid to confirm ac-3 or ec-3 (not mp3)
            (0, dolby_1.getAudioBSID)(data, offset) <= 16) {
            return false;
        }
        for (var length_1 = data.length; offset < length_1; offset++) {
            if (MpegAudio.probe(data, offset)) {
                logger_1.logger.log('MPEG Audio sync word found !');
                return true;
            }
        }
        return false;
    };
    MP3Demuxer.prototype.canParse = function (data, offset) {
        return MpegAudio.canParse(data, offset);
    };
    MP3Demuxer.prototype.appendFrame = function (track, data, offset) {
        if (this.basePTS === null) {
            return;
        }
        return MpegAudio.appendFrame(track, data, offset, this.basePTS, this.frameIndex);
    };
    return MP3Demuxer;
}(base_audio_demuxer_1.default));
exports.default = MP3Demuxer;
