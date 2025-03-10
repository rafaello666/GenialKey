"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * MP4 demuxer
 */
var demuxer_1 = require("../types/demuxer");
var mp4_tools_1 = require("../utils/mp4-tools");
var dummy_demuxed_track_1 = require("./dummy-demuxed-track");
var emsgSchemePattern = /\/emsg[-/]ID3/i;
var MP4Demuxer = /** @class */ (function () {
    function MP4Demuxer(observer, config) {
        this.remainderData = null;
        this.timeOffset = 0;
        this.config = config;
    }
    MP4Demuxer.prototype.resetTimeStamp = function () { };
    MP4Demuxer.prototype.resetInitSegment = function (initSegment, audioCodec, videoCodec, trackDuration) {
        var videoTrack = (this.videoTrack = (0, dummy_demuxed_track_1.dummyTrack)('video', 1));
        var audioTrack = (this.audioTrack = (0, dummy_demuxed_track_1.dummyTrack)('audio', 1));
        var captionTrack = (this.txtTrack = (0, dummy_demuxed_track_1.dummyTrack)('text', 1));
        this.id3Track = (0, dummy_demuxed_track_1.dummyTrack)('id3', 1);
        this.timeOffset = 0;
        if (!(initSegment === null || initSegment === void 0 ? void 0 : initSegment.byteLength)) {
            return;
        }
        var initData = (0, mp4_tools_1.parseInitSegment)(initSegment);
        if (initData.video) {
            var _a = initData.video, id = _a.id, timescale = _a.timescale, codec = _a.codec;
            videoTrack.id = id;
            videoTrack.timescale = captionTrack.timescale = timescale;
            videoTrack.codec = codec;
        }
        if (initData.audio) {
            var _b = initData.audio, id = _b.id, timescale = _b.timescale, codec = _b.codec;
            audioTrack.id = id;
            audioTrack.timescale = timescale;
            audioTrack.codec = codec;
        }
        captionTrack.id = mp4_tools_1.RemuxerTrackIdConfig.text;
        videoTrack.sampleDuration = 0;
        videoTrack.duration = audioTrack.duration = trackDuration;
    };
    MP4Demuxer.prototype.resetContiguity = function () {
        this.remainderData = null;
    };
    MP4Demuxer.probe = function (data) {
        return (0, mp4_tools_1.hasMoofData)(data);
    };
    MP4Demuxer.prototype.demux = function (data, timeOffset) {
        this.timeOffset = timeOffset;
        // Load all data into the avc track. The CMAF remuxer will look for the data in the samples object; the rest of the fields do not matter
        var videoSamples = data;
        var videoTrack = this.videoTrack;
        var textTrack = this.txtTrack;
        if (this.config.progressive) {
            // Split the bytestream into two ranges: one encompassing all data up until the start of the last moof, and everything else.
            // This is done to guarantee that we're sending valid data to MSE - when demuxing progressively, we have no guarantee
            // that the fetch loader gives us flush moof+mdat pairs. If we push jagged data to MSE, it will throw an exception.
            if (this.remainderData) {
                videoSamples = (0, mp4_tools_1.appendUint8Array)(this.remainderData, data);
            }
            var segmentedData = (0, mp4_tools_1.segmentValidRange)(videoSamples);
            this.remainderData = segmentedData.remainder;
            videoTrack.samples = segmentedData.valid || new Uint8Array();
        }
        else {
            videoTrack.samples = videoSamples;
        }
        var id3Track = this.extractID3Track(videoTrack, timeOffset);
        textTrack.samples = (0, mp4_tools_1.parseSamples)(timeOffset, videoTrack);
        return {
            videoTrack: videoTrack,
            audioTrack: this.audioTrack,
            id3Track: id3Track,
            textTrack: this.txtTrack,
        };
    };
    MP4Demuxer.prototype.flush = function () {
        var timeOffset = this.timeOffset;
        var videoTrack = this.videoTrack;
        var textTrack = this.txtTrack;
        videoTrack.samples = this.remainderData || new Uint8Array();
        this.remainderData = null;
        var id3Track = this.extractID3Track(videoTrack, this.timeOffset);
        textTrack.samples = (0, mp4_tools_1.parseSamples)(timeOffset, videoTrack);
        return {
            videoTrack: videoTrack,
            audioTrack: (0, dummy_demuxed_track_1.dummyTrack)(),
            id3Track: id3Track,
            textTrack: (0, dummy_demuxed_track_1.dummyTrack)(),
        };
    };
    MP4Demuxer.prototype.extractID3Track = function (videoTrack, timeOffset) {
        var id3Track = this.id3Track;
        if (videoTrack.samples.length) {
            var emsgs = (0, mp4_tools_1.findBox)(videoTrack.samples, ['emsg']);
            if (emsgs) {
                emsgs.forEach(function (data) {
                    var emsgInfo = (0, mp4_tools_1.parseEmsg)(data);
                    if (emsgSchemePattern.test(emsgInfo.schemeIdUri)) {
                        var pts = Number.isFinite(emsgInfo.presentationTime)
                            ? emsgInfo.presentationTime / emsgInfo.timeScale
                            : timeOffset +
                                emsgInfo.presentationTimeDelta / emsgInfo.timeScale;
                        var duration = emsgInfo.eventDuration === 0xffffffff
                            ? Number.POSITIVE_INFINITY
                            : emsgInfo.eventDuration / emsgInfo.timeScale;
                        // Safari takes anything <= 0.001 seconds and maps it to Infinity
                        if (duration <= 0.001) {
                            duration = Number.POSITIVE_INFINITY;
                        }
                        var payload = emsgInfo.payload;
                        id3Track.samples.push({
                            data: payload,
                            len: payload.byteLength,
                            dts: pts,
                            pts: pts,
                            type: demuxer_1.MetadataSchema.emsg,
                            duration: duration,
                        });
                    }
                });
            }
        }
        return id3Track;
    };
    MP4Demuxer.prototype.demuxSampleAes = function (data, keyData, timeOffset) {
        return Promise.reject(new Error('The MP4 demuxer does not support SAMPLE-AES decryption'));
    };
    MP4Demuxer.prototype.destroy = function () { };
    return MP4Demuxer;
}());
exports.default = MP4Demuxer;
