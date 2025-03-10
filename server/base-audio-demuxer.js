"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPTSFn = void 0;
var ID3 = require("../id3");
var demuxer_1 = require("../../types/demuxer");
var dummy_demuxed_track_1 = require("../dummy-demuxed-track");
var mp4_tools_1 = require("../../utils/mp4-tools");
var typed_array_1 = require("../../utils/typed-array");
var BaseAudioDemuxer = /** @class */ (function () {
    function BaseAudioDemuxer() {
        this.frameIndex = 0;
        this.cachedData = null;
        this.basePTS = null;
        this.initPTS = null;
        this.lastPTS = null;
    }
    BaseAudioDemuxer.prototype.resetInitSegment = function (initSegment, audioCodec, videoCodec, trackDuration) {
        this._id3Track = {
            type: 'id3',
            id: 3,
            pid: -1,
            inputTimeScale: 90000,
            sequenceNumber: 0,
            samples: [],
            dropped: 0,
        };
    };
    BaseAudioDemuxer.prototype.resetTimeStamp = function (deaultTimestamp) {
        this.initPTS = deaultTimestamp;
        this.resetContiguity();
    };
    BaseAudioDemuxer.prototype.resetContiguity = function () {
        this.basePTS = null;
        this.lastPTS = null;
        this.frameIndex = 0;
    };
    BaseAudioDemuxer.prototype.canParse = function (data, offset) {
        return false;
    };
    BaseAudioDemuxer.prototype.appendFrame = function (track, data, offset) { };
    // feed incoming data to the front of the parsing pipeline
    BaseAudioDemuxer.prototype.demux = function (data, timeOffset) {
        if (this.cachedData) {
            data = (0, mp4_tools_1.appendUint8Array)(this.cachedData, data);
            this.cachedData = null;
        }
        var id3Data = ID3.getID3Data(data, 0);
        var offset = id3Data ? id3Data.length : 0;
        var lastDataIndex;
        var track = this._audioTrack;
        var id3Track = this._id3Track;
        var timestamp = id3Data ? ID3.getTimeStamp(id3Data) : undefined;
        var length = data.length;
        if (this.basePTS === null ||
            (this.frameIndex === 0 && Number.isFinite(timestamp))) {
            this.basePTS = (0, exports.initPTSFn)(timestamp, timeOffset, this.initPTS);
            this.lastPTS = this.basePTS;
        }
        if (this.lastPTS === null) {
            this.lastPTS = this.basePTS;
        }
        // more expressive than alternative: id3Data?.length
        if (id3Data && id3Data.length > 0) {
            id3Track.samples.push({
                pts: this.lastPTS,
                dts: this.lastPTS,
                data: id3Data,
                type: demuxer_1.MetadataSchema.audioId3,
                duration: Number.POSITIVE_INFINITY,
            });
        }
        while (offset < length) {
            if (this.canParse(data, offset)) {
                var frame = this.appendFrame(track, data, offset);
                if (frame) {
                    this.frameIndex++;
                    this.lastPTS = frame.sample.pts;
                    offset += frame.length;
                    lastDataIndex = offset;
                }
                else {
                    offset = length;
                }
            }
            else if (ID3.canParse(data, offset)) {
                // after a ID3.canParse, a call to ID3.getID3Data *should* always returns some data
                id3Data = ID3.getID3Data(data, offset);
                id3Track.samples.push({
                    pts: this.lastPTS,
                    dts: this.lastPTS,
                    data: id3Data,
                    type: demuxer_1.MetadataSchema.audioId3,
                    duration: Number.POSITIVE_INFINITY,
                });
                offset += id3Data.length;
                lastDataIndex = offset;
            }
            else {
                offset++;
            }
            if (offset === length && lastDataIndex !== length) {
                var partialData = (0, typed_array_1.sliceUint8)(data, lastDataIndex);
                if (this.cachedData) {
                    this.cachedData = (0, mp4_tools_1.appendUint8Array)(this.cachedData, partialData);
                }
                else {
                    this.cachedData = partialData;
                }
            }
        }
        return {
            audioTrack: track,
            videoTrack: (0, dummy_demuxed_track_1.dummyTrack)(),
            id3Track: id3Track,
            textTrack: (0, dummy_demuxed_track_1.dummyTrack)(),
        };
    };
    BaseAudioDemuxer.prototype.demuxSampleAes = function (data, keyData, timeOffset) {
        return Promise.reject(new Error("[".concat(this, "] This demuxer does not support Sample-AES decryption")));
    };
    BaseAudioDemuxer.prototype.flush = function (timeOffset) {
        // Parse cache in case of remaining frames.
        var cachedData = this.cachedData;
        if (cachedData) {
            this.cachedData = null;
            this.demux(cachedData, 0);
        }
        return {
            audioTrack: this._audioTrack,
            videoTrack: (0, dummy_demuxed_track_1.dummyTrack)(),
            id3Track: this._id3Track,
            textTrack: (0, dummy_demuxed_track_1.dummyTrack)(),
        };
    };
    BaseAudioDemuxer.prototype.destroy = function () { };
    return BaseAudioDemuxer;
}());
/**
 * Initialize PTS
 * <p>
 *    use timestamp unless it is undefined, NaN or Infinity
 * </p>
 */
var initPTSFn = function (timestamp, timeOffset, initPTS) {
    if (Number.isFinite(timestamp)) {
        return timestamp * 90;
    }
    var init90kHz = initPTS
        ? (initPTS.baseTime * 90000) / initPTS.timescale
        : 0;
    return timeOffset * 90000 + init90kHz;
};
exports.initPTSFn = initPTSFn;
exports.default = BaseAudioDemuxer;
