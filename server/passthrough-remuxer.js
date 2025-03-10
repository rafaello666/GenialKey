"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mp4_remuxer_1 = require("./mp4-remuxer");
var mp4_tools_1 = require("../utils/mp4-tools");
var mp4_tools_2 = require("../utils/mp4-tools");
var fragment_1 = require("../loader/fragment");
var logger_1 = require("../utils/logger");
var codecs_1 = require("../utils/codecs");
var PassThroughRemuxer = /** @class */ (function () {
    function PassThroughRemuxer() {
        this.emitInitSegment = false;
        this.initPTS = null;
        this.lastEndTime = null;
    }
    PassThroughRemuxer.prototype.destroy = function () { };
    PassThroughRemuxer.prototype.resetTimeStamp = function (defaultInitPTS) {
        this.initPTS = defaultInitPTS;
        this.lastEndTime = null;
    };
    PassThroughRemuxer.prototype.resetNextTimestamp = function () {
        this.lastEndTime = null;
    };
    PassThroughRemuxer.prototype.resetInitSegment = function (initSegment, audioCodec, videoCodec, decryptdata) {
        this.audioCodec = audioCodec;
        this.videoCodec = videoCodec;
        this.generateInitSegment((0, mp4_tools_1.patchEncyptionData)(initSegment, decryptdata));
        this.emitInitSegment = true;
    };
    PassThroughRemuxer.prototype.generateInitSegment = function (initSegment) {
        var _a = this, audioCodec = _a.audioCodec, videoCodec = _a.videoCodec;
        if (!(initSegment === null || initSegment === void 0 ? void 0 : initSegment.byteLength)) {
            this.initTracks = undefined;
            this.initData = undefined;
            return;
        }
        var initData = (this.initData = (0, mp4_tools_2.parseInitSegment)(initSegment));
        // Get codec from initSegment or fallback to default
        if (initData.audio) {
            audioCodec = getParsedTrackCodec(initData.audio, fragment_1.ElementaryStreamTypes.AUDIO);
        }
        if (initData.video) {
            videoCodec = getParsedTrackCodec(initData.video, fragment_1.ElementaryStreamTypes.VIDEO);
        }
        var tracks = {};
        if (initData.audio && initData.video) {
            tracks.audiovideo = {
                container: 'video/mp4',
                codec: audioCodec + ',' + videoCodec,
                initSegment: initSegment,
                id: 'main',
            };
        }
        else if (initData.audio) {
            tracks.audio = {
                container: 'audio/mp4',
                codec: audioCodec,
                initSegment: initSegment,
                id: 'audio',
            };
        }
        else if (initData.video) {
            tracks.video = {
                container: 'video/mp4',
                codec: videoCodec,
                initSegment: initSegment,
                id: 'main',
            };
        }
        else {
            logger_1.logger.warn('[passthrough-remuxer.ts]: initSegment does not contain moov or trak boxes.');
        }
        this.initTracks = tracks;
    };
    PassThroughRemuxer.prototype.remux = function (audioTrack, videoTrack, id3Track, textTrack, timeOffset, accurateTimeOffset) {
        var _a = this, initPTS = _a.initPTS, lastEndTime = _a.lastEndTime;
        var result = {
            audio: undefined,
            video: undefined,
            text: textTrack,
            id3: id3Track,
            initSegment: undefined,
        };
        // If we haven't yet set a lastEndDTS, or it was reset, set it to the provided timeOffset. We want to use the
        // lastEndDTS over timeOffset whenever possible; during progressive playback, the media source will not update
        // the media duration (which is what timeOffset is provided as) before we need to process the next chunk.
        if (!Number.isFinite(lastEndTime)) {
            lastEndTime = this.lastEndTime = timeOffset || 0;
        }
        // The binary segment data is added to the videoTrack in the mp4demuxer. We don't check to see if the data is only
        // audio or video (or both); adding it to video was an arbitrary choice.
        var data = videoTrack.samples;
        if (!(data === null || data === void 0 ? void 0 : data.length)) {
            return result;
        }
        var initSegment = {
            initPTS: undefined,
            timescale: 1,
        };
        var initData = this.initData;
        if (!(initData === null || initData === void 0 ? void 0 : initData.length)) {
            this.generateInitSegment(data);
            initData = this.initData;
        }
        if (!(initData === null || initData === void 0 ? void 0 : initData.length)) {
            // We can't remux if the initSegment could not be generated
            logger_1.logger.warn('[passthrough-remuxer.ts]: Failed to generate initSegment.');
            return result;
        }
        if (this.emitInitSegment) {
            initSegment.tracks = this.initTracks;
            this.emitInitSegment = false;
        }
        var duration = (0, mp4_tools_2.getDuration)(data, initData);
        var startDTS = (0, mp4_tools_2.getStartDTS)(initData, data);
        var decodeTime = startDTS === null ? timeOffset : startDTS;
        if (isInvalidInitPts(initPTS, decodeTime, timeOffset, duration) ||
            (initSegment.timescale !== initPTS.timescale && accurateTimeOffset)) {
            initSegment.initPTS = decodeTime - timeOffset;
            if (initPTS && initPTS.timescale === 1) {
                logger_1.logger.warn("Adjusting initPTS by ".concat(initSegment.initPTS - initPTS.baseTime));
            }
            this.initPTS = initPTS = {
                baseTime: initSegment.initPTS,
                timescale: 1,
            };
        }
        var startTime = audioTrack
            ? decodeTime - initPTS.baseTime / initPTS.timescale
            : lastEndTime;
        var endTime = startTime + duration;
        (0, mp4_tools_2.offsetStartDTS)(initData, data, initPTS.baseTime / initPTS.timescale);
        if (duration > 0) {
            this.lastEndTime = endTime;
        }
        else {
            logger_1.logger.warn('Duration parsed from mp4 should be greater than zero');
            this.resetNextTimestamp();
        }
        var hasAudio = !!initData.audio;
        var hasVideo = !!initData.video;
        var type = '';
        if (hasAudio) {
            type += 'audio';
        }
        if (hasVideo) {
            type += 'video';
        }
        var track = {
            data1: data,
            startPTS: startTime,
            startDTS: startTime,
            endPTS: endTime,
            endDTS: endTime,
            type: type,
            hasAudio: hasAudio,
            hasVideo: hasVideo,
            nb: 1,
            dropped: 0,
        };
        result.audio = track.type === 'audio' ? track : undefined;
        result.video = track.type !== 'audio' ? track : undefined;
        result.initSegment = initSegment;
        result.id3 = (0, mp4_remuxer_1.flushTextTrackMetadataCueSamples)(id3Track, timeOffset, initPTS, initPTS);
        if (textTrack.samples.length) {
            result.text = (0, mp4_remuxer_1.flushTextTrackUserdataCueSamples)(textTrack, timeOffset, initPTS);
        }
        return result;
    };
    return PassThroughRemuxer;
}());
function isInvalidInitPts(initPTS, startDTS, timeOffset, duration) {
    if (initPTS === null) {
        return true;
    }
    // InitPTS is invalid when distance from program would be more than segment duration or a minimum of one second
    var minDuration = Math.max(duration, 1);
    var startTime = startDTS - initPTS.baseTime / initPTS.timescale;
    return Math.abs(startTime - timeOffset) > minDuration;
}
function getParsedTrackCodec(track, type) {
    var parsedCodec = track === null || track === void 0 ? void 0 : track.codec;
    if (parsedCodec && parsedCodec.length > 4) {
        return parsedCodec;
    }
    if (type === fragment_1.ElementaryStreamTypes.AUDIO) {
        if (parsedCodec === 'ec-3' ||
            parsedCodec === 'ac-3' ||
            parsedCodec === 'alac') {
            return parsedCodec;
        }
        if (parsedCodec === 'fLaC' || parsedCodec === 'Opus') {
            // Opting not to get `preferManagedMediaSource` from player config for isSupported() check for simplicity
            var preferManagedMediaSource = false;
            return (0, codecs_1.getCodecCompatibleName)(parsedCodec, preferManagedMediaSource);
        }
        var result = 'mp4a.40.5';
        logger_1.logger.info("Parsed audio codec \"".concat(parsedCodec, "\" or audio object type not handled. Using \"").concat(result, "\""));
        return result;
    }
    // Provide defaults based on codec type
    // This allows for some playback of some fmp4 playlists without CODECS defined in manifest
    logger_1.logger.warn("Unhandled video codec \"".concat(parsedCodec, "\""));
    if (parsedCodec === 'hvc1' || parsedCodec === 'hev1') {
        return 'hvc1.1.6.L120.90';
    }
    if (parsedCodec === 'av01') {
        return 'av01.0.04M.08';
    }
    return 'avc1.42e01e';
}
exports.default = PassThroughRemuxer;
