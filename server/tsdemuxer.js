"use strict";
/**
 * highly optimized TS demuxer:
 * parse PAT, PMT
 * extract PES packet from audio and video PIDs
 * extract AVC/H264 NAL units and AAC/ADTS samples from PES packet
 * trigger the remuxer upon parsing completion
 * it also tries to workaround as best as it can audio codec switch (HE-AAC to AAC and vice versa), without having to restart the MediaSource.
 * it also controls the remuxing process :
 * upon discontinuity or level switch detection, it will also notifies the remuxer so that it can reset its state.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var ADTS = require("./audio/adts");
var MpegAudio = require("./audio/mpegaudio");
var AC3 = require("./audio/ac3-demuxer");
var avc_video_parser_1 = require("./video/avc-video-parser");
var sample_aes_1 = require("./sample-aes");
var events_1 = require("../events");
var mp4_tools_1 = require("../utils/mp4-tools");
var logger_1 = require("../utils/logger");
var errors_1 = require("../errors");
var demuxer_1 = require("../types/demuxer");
var PACKET_LENGTH = 188;
var TSDemuxer = /** @class */ (function () {
    function TSDemuxer(observer, config, typeSupported) {
        this.sampleAes = null;
        this.pmtParsed = false;
        this._duration = 0;
        this._pmtId = -1;
        this.aacOverFlow = null;
        this.remainderData = null;
        this.observer = observer;
        this.config = config;
        this.typeSupported = typeSupported;
        this.videoParser = new avc_video_parser_1.default();
    }
    TSDemuxer.probe = function (data) {
        var syncOffset = TSDemuxer.syncOffset(data);
        if (syncOffset > 0) {
            logger_1.logger.warn("MPEG2-TS detected but first sync word found @ offset ".concat(syncOffset));
        }
        return syncOffset !== -1;
    };
    TSDemuxer.syncOffset = function (data) {
        var length = data.length;
        var scanwindow = Math.min(PACKET_LENGTH * 5, length - PACKET_LENGTH) + 1;
        var i = 0;
        while (i < scanwindow) {
            // a TS init segment should contain at least 2 TS packets: PAT and PMT, each starting with 0x47
            var foundPat = false;
            var packetStart = -1;
            var tsPackets = 0;
            for (var j = i; j < length; j += PACKET_LENGTH) {
                if (data[j] === 0x47 &&
                    (length - j === PACKET_LENGTH || data[j + PACKET_LENGTH] === 0x47)) {
                    tsPackets++;
                    if (packetStart === -1) {
                        packetStart = j;
                        // First sync word found at offset, increase scan length (#5251)
                        if (packetStart !== 0) {
                            scanwindow =
                                Math.min(packetStart + PACKET_LENGTH * 99, data.length - PACKET_LENGTH) + 1;
                        }
                    }
                    if (!foundPat) {
                        foundPat = parsePID(data, j) === 0;
                    }
                    // Sync word found at 0 with 3 packets, or found at offset least 2 packets up to scanwindow (#5501)
                    if (foundPat &&
                        tsPackets > 1 &&
                        ((packetStart === 0 && tsPackets > 2) ||
                            j + PACKET_LENGTH > scanwindow)) {
                        return packetStart;
                    }
                }
                else if (tsPackets) {
                    // Exit if sync word found, but does not contain contiguous packets
                    return -1;
                }
                else {
                    break;
                }
            }
            i++;
        }
        return -1;
    };
    /**
     * Creates a track model internal to demuxer used to drive remuxing input
     */
    TSDemuxer.createTrack = function (type, duration) {
        return {
            container: type === 'video' || type === 'audio' ? 'video/mp2t' : undefined,
            type: type,
            id: mp4_tools_1.RemuxerTrackIdConfig[type],
            pid: -1,
            inputTimeScale: 90000,
            sequenceNumber: 0,
            samples: [],
            dropped: 0,
            duration: type === 'audio' ? duration : undefined,
        };
    };
    /**
     * Initializes a new init segment on the demuxer/remuxer interface. Needed for discontinuities/track-switches (or at stream start)
     * Resets all internal track instances of the demuxer.
     */
    TSDemuxer.prototype.resetInitSegment = function (initSegment, audioCodec, videoCodec, trackDuration) {
        this.pmtParsed = false;
        this._pmtId = -1;
        this._videoTrack = TSDemuxer.createTrack('video');
        this._audioTrack = TSDemuxer.createTrack('audio', trackDuration);
        this._id3Track = TSDemuxer.createTrack('id3');
        this._txtTrack = TSDemuxer.createTrack('text');
        this._audioTrack.segmentCodec = 'aac';
        // flush any partial content
        this.aacOverFlow = null;
        this.remainderData = null;
        this.audioCodec = audioCodec;
        this.videoCodec = videoCodec;
        this._duration = trackDuration;
    };
    TSDemuxer.prototype.resetTimeStamp = function () { };
    TSDemuxer.prototype.resetContiguity = function () {
        var _a = this, _audioTrack = _a._audioTrack, _videoTrack = _a._videoTrack, _id3Track = _a._id3Track;
        if (_audioTrack) {
            _audioTrack.pesData = null;
        }
        if (_videoTrack) {
            _videoTrack.pesData = null;
        }
        if (_id3Track) {
            _id3Track.pesData = null;
        }
        this.aacOverFlow = null;
        this.remainderData = null;
    };
    TSDemuxer.prototype.demux = function (data, timeOffset, isSampleAes, flush) {
        if (isSampleAes === void 0) { isSampleAes = false; }
        if (flush === void 0) { flush = false; }
        if (!isSampleAes) {
            this.sampleAes = null;
        }
        var pes;
        var videoTrack = this._videoTrack;
        var audioTrack = this._audioTrack;
        var id3Track = this._id3Track;
        var textTrack = this._txtTrack;
        var videoPid = videoTrack.pid;
        var videoData = videoTrack.pesData;
        var audioPid = audioTrack.pid;
        var id3Pid = id3Track.pid;
        var audioData = audioTrack.pesData;
        var id3Data = id3Track.pesData;
        var unknownPID = null;
        var pmtParsed = this.pmtParsed;
        var pmtId = this._pmtId;
        var len = data.length;
        if (this.remainderData) {
            data = (0, mp4_tools_1.appendUint8Array)(this.remainderData, data);
            len = data.length;
            this.remainderData = null;
        }
        if (len < PACKET_LENGTH && !flush) {
            this.remainderData = data;
            return {
                audioTrack: audioTrack,
                videoTrack: videoTrack,
                id3Track: id3Track,
                textTrack: textTrack,
            };
        }
        var syncOffset = Math.max(0, TSDemuxer.syncOffset(data));
        len -= (len - syncOffset) % PACKET_LENGTH;
        if (len < data.byteLength && !flush) {
            this.remainderData = new Uint8Array(data.buffer, len, data.buffer.byteLength - len);
        }
        // loop through TS packets
        var tsPacketErrors = 0;
        for (var start = syncOffset; start < len; start += PACKET_LENGTH) {
            if (data[start] === 0x47) {
                var stt = !!(data[start + 1] & 0x40);
                var pid = parsePID(data, start);
                var atf = (data[start + 3] & 0x30) >> 4;
                // if an adaption field is present, its length is specified by the fifth byte of the TS packet header.
                var offset = void 0;
                if (atf > 1) {
                    offset = start + 5 + data[start + 4];
                    // continue if there is only adaptation field
                    if (offset === start + PACKET_LENGTH) {
                        continue;
                    }
                }
                else {
                    offset = start + 4;
                }
                switch (pid) {
                    case videoPid:
                        if (stt) {
                            if (videoData && (pes = parsePES(videoData))) {
                                this.videoParser.parseAVCPES(videoTrack, textTrack, pes, false, this._duration);
                            }
                            videoData = { data: [], size: 0 };
                        }
                        if (videoData) {
                            videoData.data.push(data.subarray(offset, start + PACKET_LENGTH));
                            videoData.size += start + PACKET_LENGTH - offset;
                        }
                        break;
                    case audioPid:
                        if (stt) {
                            if (audioData && (pes = parsePES(audioData))) {
                                switch (audioTrack.segmentCodec) {
                                    case 'aac':
                                        this.parseAACPES(audioTrack, pes);
                                        break;
                                    case 'mp3':
                                        this.parseMPEGPES(audioTrack, pes);
                                        break;
                                    case 'ac3':
                                        if (__USE_M2TS_ADVANCED_CODECS__) {
                                            this.parseAC3PES(audioTrack, pes);
                                        }
                                        break;
                                }
                            }
                            audioData = { data: [], size: 0 };
                        }
                        if (audioData) {
                            audioData.data.push(data.subarray(offset, start + PACKET_LENGTH));
                            audioData.size += start + PACKET_LENGTH - offset;
                        }
                        break;
                    case id3Pid:
                        if (stt) {
                            if (id3Data && (pes = parsePES(id3Data))) {
                                this.parseID3PES(id3Track, pes);
                            }
                            id3Data = { data: [], size: 0 };
                        }
                        if (id3Data) {
                            id3Data.data.push(data.subarray(offset, start + PACKET_LENGTH));
                            id3Data.size += start + PACKET_LENGTH - offset;
                        }
                        break;
                    case 0:
                        if (stt) {
                            offset += data[offset] + 1;
                        }
                        pmtId = this._pmtId = parsePAT(data, offset);
                        // logger.log('PMT PID:'  + this._pmtId);
                        break;
                    case pmtId: {
                        if (stt) {
                            offset += data[offset] + 1;
                        }
                        var parsedPIDs = parsePMT(data, offset, this.typeSupported, isSampleAes, this.observer);
                        // only update track id if track PID found while parsing PMT
                        // this is to avoid resetting the PID to -1 in case
                        // track PID transiently disappears from the stream
                        // this could happen in case of transient missing audio samples for example
                        // NOTE this is only the PID of the track as found in TS,
                        // but we are not using this for MP4 track IDs.
                        videoPid = parsedPIDs.videoPid;
                        if (videoPid > 0) {
                            videoTrack.pid = videoPid;
                            videoTrack.segmentCodec = parsedPIDs.segmentVideoCodec;
                        }
                        audioPid = parsedPIDs.audioPid;
                        if (audioPid > 0) {
                            audioTrack.pid = audioPid;
                            audioTrack.segmentCodec = parsedPIDs.segmentAudioCodec;
                        }
                        id3Pid = parsedPIDs.id3Pid;
                        if (id3Pid > 0) {
                            id3Track.pid = id3Pid;
                        }
                        if (unknownPID !== null && !pmtParsed) {
                            logger_1.logger.warn("MPEG-TS PMT found at ".concat(start, " after unknown PID '").concat(unknownPID, "'. Backtracking to sync byte @").concat(syncOffset, " to parse all TS packets."));
                            unknownPID = null;
                            // we set it to -188, the += 188 in the for loop will reset start to 0
                            start = syncOffset - 188;
                        }
                        pmtParsed = this.pmtParsed = true;
                        break;
                    }
                    case 0x11:
                    case 0x1fff:
                        break;
                    default:
                        unknownPID = pid;
                        break;
                }
            }
            else {
                tsPacketErrors++;
            }
        }
        if (tsPacketErrors > 0) {
            emitParsingError(this.observer, new Error("Found ".concat(tsPacketErrors, " TS packet/s that do not start with 0x47")));
        }
        videoTrack.pesData = videoData;
        audioTrack.pesData = audioData;
        id3Track.pesData = id3Data;
        var demuxResult = {
            audioTrack: audioTrack,
            videoTrack: videoTrack,
            id3Track: id3Track,
            textTrack: textTrack,
        };
        if (flush) {
            this.extractRemainingSamples(demuxResult);
        }
        return demuxResult;
    };
    TSDemuxer.prototype.flush = function () {
        var remainderData = this.remainderData;
        this.remainderData = null;
        var result;
        if (remainderData) {
            result = this.demux(remainderData, -1, false, true);
        }
        else {
            result = {
                videoTrack: this._videoTrack,
                audioTrack: this._audioTrack,
                id3Track: this._id3Track,
                textTrack: this._txtTrack,
            };
        }
        this.extractRemainingSamples(result);
        if (this.sampleAes) {
            return this.decrypt(result, this.sampleAes);
        }
        return result;
    };
    TSDemuxer.prototype.extractRemainingSamples = function (demuxResult) {
        var audioTrack = demuxResult.audioTrack, videoTrack = demuxResult.videoTrack, id3Track = demuxResult.id3Track, textTrack = demuxResult.textTrack;
        var videoData = videoTrack.pesData;
        var audioData = audioTrack.pesData;
        var id3Data = id3Track.pesData;
        // try to parse last PES packets
        var pes;
        if (videoData && (pes = parsePES(videoData))) {
            this.videoParser.parseAVCPES(videoTrack, textTrack, pes, true, this._duration);
            videoTrack.pesData = null;
        }
        else {
            // either avcData null or PES truncated, keep it for next frag parsing
            videoTrack.pesData = videoData;
        }
        if (audioData && (pes = parsePES(audioData))) {
            switch (audioTrack.segmentCodec) {
                case 'aac':
                    this.parseAACPES(audioTrack, pes);
                    break;
                case 'mp3':
                    this.parseMPEGPES(audioTrack, pes);
                    break;
                case 'ac3':
                    if (__USE_M2TS_ADVANCED_CODECS__) {
                        this.parseAC3PES(audioTrack, pes);
                    }
                    break;
            }
            audioTrack.pesData = null;
        }
        else {
            if (audioData === null || audioData === void 0 ? void 0 : audioData.size) {
                logger_1.logger.log('last AAC PES packet truncated,might overlap between fragments');
            }
            // either audioData null or PES truncated, keep it for next frag parsing
            audioTrack.pesData = audioData;
        }
        if (id3Data && (pes = parsePES(id3Data))) {
            this.parseID3PES(id3Track, pes);
            id3Track.pesData = null;
        }
        else {
            // either id3Data null or PES truncated, keep it for next frag parsing
            id3Track.pesData = id3Data;
        }
    };
    TSDemuxer.prototype.demuxSampleAes = function (data, keyData, timeOffset) {
        var demuxResult = this.demux(data, timeOffset, true, !this.config.progressive);
        var sampleAes = (this.sampleAes = new sample_aes_1.default(this.observer, this.config, keyData));
        return this.decrypt(demuxResult, sampleAes);
    };
    TSDemuxer.prototype.decrypt = function (demuxResult, sampleAes) {
        return new Promise(function (resolve) {
            var audioTrack = demuxResult.audioTrack, videoTrack = demuxResult.videoTrack;
            if (audioTrack.samples && audioTrack.segmentCodec === 'aac') {
                sampleAes.decryptAacSamples(audioTrack.samples, 0, function () {
                    if (videoTrack.samples) {
                        sampleAes.decryptAvcSamples(videoTrack.samples, 0, 0, function () {
                            resolve(demuxResult);
                        });
                    }
                    else {
                        resolve(demuxResult);
                    }
                });
            }
            else if (videoTrack.samples) {
                sampleAes.decryptAvcSamples(videoTrack.samples, 0, 0, function () {
                    resolve(demuxResult);
                });
            }
        });
    };
    TSDemuxer.prototype.destroy = function () {
        this._duration = 0;
    };
    TSDemuxer.prototype.parseAACPES = function (track, pes) {
        var startOffset = 0;
        var aacOverFlow = this.aacOverFlow;
        var data = pes.data;
        if (aacOverFlow) {
            this.aacOverFlow = null;
            var frameMissingBytes = aacOverFlow.missing;
            var sampleLength = aacOverFlow.sample.unit.byteLength;
            // logger.log(`AAC: append overflowing ${sampleLength} bytes to beginning of new PES`);
            if (frameMissingBytes === -1) {
                data = (0, mp4_tools_1.appendUint8Array)(aacOverFlow.sample.unit, data);
            }
            else {
                var frameOverflowBytes = sampleLength - frameMissingBytes;
                aacOverFlow.sample.unit.set(data.subarray(0, frameMissingBytes), frameOverflowBytes);
                track.samples.push(aacOverFlow.sample);
                startOffset = aacOverFlow.missing;
            }
        }
        // look for ADTS header (0xFFFx)
        var offset;
        var len;
        for (offset = startOffset, len = data.length; offset < len - 1; offset++) {
            if (ADTS.isHeader(data, offset)) {
                break;
            }
        }
        // if ADTS header does not start straight from the beginning of the PES payload, raise an error
        if (offset !== startOffset) {
            var reason = void 0;
            var recoverable = offset < len - 1;
            if (recoverable) {
                reason = "AAC PES did not start with ADTS header,offset:".concat(offset);
            }
            else {
                reason = 'No ADTS header found in AAC PES';
            }
            emitParsingError(this.observer, new Error(reason), recoverable);
            if (!recoverable) {
                return;
            }
        }
        ADTS.initTrackConfig(track, this.observer, data, offset, this.audioCodec);
        var pts;
        if (pes.pts !== undefined) {
            pts = pes.pts;
        }
        else if (aacOverFlow) {
            // if last AAC frame is overflowing, we should ensure timestamps are contiguous:
            // first sample PTS should be equal to last sample PTS + frameDuration
            var frameDuration = ADTS.getFrameDuration(track.samplerate);
            pts = aacOverFlow.sample.pts + frameDuration;
        }
        else {
            logger_1.logger.warn('[tsdemuxer]: AAC PES unknown PTS');
            return;
        }
        // scan for aac samples
        var frameIndex = 0;
        var frame;
        while (offset < len) {
            frame = ADTS.appendFrame(track, data, offset, pts, frameIndex);
            offset += frame.length;
            if (!frame.missing) {
                frameIndex++;
                for (; offset < len - 1; offset++) {
                    if (ADTS.isHeader(data, offset)) {
                        break;
                    }
                }
            }
            else {
                this.aacOverFlow = frame;
                break;
            }
        }
    };
    TSDemuxer.prototype.parseMPEGPES = function (track, pes) {
        var data = pes.data;
        var length = data.length;
        var frameIndex = 0;
        var offset = 0;
        var pts = pes.pts;
        if (pts === undefined) {
            logger_1.logger.warn('[tsdemuxer]: MPEG PES unknown PTS');
            return;
        }
        while (offset < length) {
            if (MpegAudio.isHeader(data, offset)) {
                var frame = MpegAudio.appendFrame(track, data, offset, pts, frameIndex);
                if (frame) {
                    offset += frame.length;
                    frameIndex++;
                }
                else {
                    // logger.log('Unable to parse Mpeg audio frame');
                    break;
                }
            }
            else {
                // nothing found, keep looking
                offset++;
            }
        }
    };
    TSDemuxer.prototype.parseAC3PES = function (track, pes) {
        if (__USE_M2TS_ADVANCED_CODECS__) {
            var data = pes.data;
            var pts = pes.pts;
            if (pts === undefined) {
                logger_1.logger.warn('[tsdemuxer]: AC3 PES unknown PTS');
                return;
            }
            var length_1 = data.length;
            var frameIndex = 0;
            var offset = 0;
            var parsed = void 0;
            while (offset < length_1 &&
                (parsed = AC3.appendFrame(track, data, offset, pts, frameIndex++)) > 0) {
                offset += parsed;
            }
        }
    };
    TSDemuxer.prototype.parseID3PES = function (id3Track, pes) {
        if (pes.pts === undefined) {
            logger_1.logger.warn('[tsdemuxer]: ID3 PES unknown PTS');
            return;
        }
        var id3Sample = Object.assign({}, pes, {
            type: this._videoTrack ? demuxer_1.MetadataSchema.emsg : demuxer_1.MetadataSchema.audioId3,
            duration: Number.POSITIVE_INFINITY,
        });
        id3Track.samples.push(id3Sample);
    };
    return TSDemuxer;
}());
function parsePID(data, offset) {
    // pid is a 13-bit field starting at the last bit of TS[1]
    return ((data[offset + 1] & 0x1f) << 8) + data[offset + 2];
}
function parsePAT(data, offset) {
    // skip the PSI header and parse the first PMT entry
    return ((data[offset + 10] & 0x1f) << 8) | data[offset + 11];
}
function parsePMT(data, offset, typeSupported, isSampleAes, observer) {
    var result = {
        audioPid: -1,
        videoPid: -1,
        id3Pid: -1,
        segmentVideoCodec: 'avc',
        segmentAudioCodec: 'aac',
    };
    var sectionLength = ((data[offset + 1] & 0x0f) << 8) | data[offset + 2];
    var tableEnd = offset + 3 + sectionLength - 4;
    // to determine where the table is, we have to figure out how
    // long the program info descriptors are
    var programInfoLength = ((data[offset + 10] & 0x0f) << 8) | data[offset + 11];
    // advance the offset to the first entry in the mapping table
    offset += 12 + programInfoLength;
    while (offset < tableEnd) {
        var pid = parsePID(data, offset);
        var esInfoLength = ((data[offset + 3] & 0x0f) << 8) | data[offset + 4];
        switch (data[offset]) {
            case 0xcf: // SAMPLE-AES AAC
                if (!isSampleAes) {
                    logEncryptedSamplesFoundInUnencryptedStream('ADTS AAC');
                    break;
                }
            /* falls through */
            case 0x0f: // ISO/IEC 13818-7 ADTS AAC (MPEG-2 lower bit-rate audio)
                // logger.log('AAC PID:'  + pid);
                if (result.audioPid === -1) {
                    result.audioPid = pid;
                }
                break;
            // Packetized metadata (ID3)
            case 0x15:
                // logger.log('ID3 PID:'  + pid);
                if (result.id3Pid === -1) {
                    result.id3Pid = pid;
                }
                break;
            case 0xdb: // SAMPLE-AES AVC
                if (!isSampleAes) {
                    logEncryptedSamplesFoundInUnencryptedStream('H.264');
                    break;
                }
            /* falls through */
            case 0x1b: // ITU-T Rec. H.264 and ISO/IEC 14496-10 (lower bit-rate video)
                // logger.log('AVC PID:'  + pid);
                if (result.videoPid === -1) {
                    result.videoPid = pid;
                    result.segmentVideoCodec = 'avc';
                }
                break;
            // ISO/IEC 11172-3 (MPEG-1 audio)
            // or ISO/IEC 13818-3 (MPEG-2 halved sample rate audio)
            case 0x03:
            case 0x04:
                // logger.log('MPEG PID:'  + pid);
                if (!typeSupported.mpeg && !typeSupported.mp3) {
                    logger_1.logger.log('MPEG audio found, not supported in this browser');
                }
                else if (result.audioPid === -1) {
                    result.audioPid = pid;
                    result.segmentAudioCodec = 'mp3';
                }
                break;
            case 0xc1: // SAMPLE-AES AC3
                if (!isSampleAes) {
                    logEncryptedSamplesFoundInUnencryptedStream('AC-3');
                    break;
                }
            /* falls through */
            case 0x81:
                if (__USE_M2TS_ADVANCED_CODECS__) {
                    if (!typeSupported.ac3) {
                        logger_1.logger.log('AC-3 audio found, not supported in this browser');
                    }
                    else if (result.audioPid === -1) {
                        result.audioPid = pid;
                        result.segmentAudioCodec = 'ac3';
                    }
                }
                else {
                    logger_1.logger.warn('AC-3 in M2TS support not included in build');
                }
                break;
            case 0x06:
                // stream_type 6 can mean a lot of different things in case of DVB.
                // We need to look at the descriptors. Right now, we're only interested
                // in AC-3 audio, so we do the descriptor parsing only when we don't have
                // an audio PID yet.
                if (result.audioPid === -1 && esInfoLength > 0) {
                    var parsePos = offset + 5;
                    var remaining = esInfoLength;
                    while (remaining > 2) {
                        var descriptorId = data[parsePos];
                        switch (descriptorId) {
                            case 0x6a: // DVB Descriptor for AC-3
                                if (__USE_M2TS_ADVANCED_CODECS__) {
                                    if (typeSupported.ac3 !== true) {
                                        logger_1.logger.log('AC-3 audio found, not supported in this browser for now');
                                    }
                                    else {
                                        result.audioPid = pid;
                                        result.segmentAudioCodec = 'ac3';
                                    }
                                }
                                else {
                                    logger_1.logger.warn('AC-3 in M2TS support not included in build');
                                }
                                break;
                        }
                        var descriptorLen = data[parsePos + 1] + 2;
                        parsePos += descriptorLen;
                        remaining -= descriptorLen;
                    }
                }
                break;
            case 0xc2: // SAMPLE-AES EC3
            /* falls through */
            case 0x87:
                emitParsingError(observer, new Error('Unsupported EC-3 in M2TS found'));
                return result;
            case 0x24:
                emitParsingError(observer, new Error('Unsupported HEVC in M2TS found'));
                return result;
            default:
                // logger.log('unknown stream type:' + data[offset]);
                break;
        }
        // move to the next table entry
        // skip past the elementary stream descriptors, if present
        offset += esInfoLength + 5;
    }
    return result;
}
function emitParsingError(observer, error, levelRetry) {
    logger_1.logger.warn("parsing error: ".concat(error.message));
    observer.emit(events_1.Events.ERROR, events_1.Events.ERROR, {
        type: errors_1.ErrorTypes.MEDIA_ERROR,
        details: errors_1.ErrorDetails.FRAG_PARSING_ERROR,
        fatal: false,
        levelRetry: levelRetry,
        error: error,
        reason: error.message,
    });
}
function logEncryptedSamplesFoundInUnencryptedStream(type) {
    logger_1.logger.log("".concat(type, " with AES-128-CBC encryption found in unencrypted stream"));
}
function parsePES(stream) {
    var i = 0;
    var frag;
    var pesLen;
    var pesHdrLen;
    var pesPts;
    var pesDts;
    var data = stream.data;
    // safety check
    if (!stream || stream.size === 0) {
        return null;
    }
    // we might need up to 19 bytes to read PES header
    // if first chunk of data is less than 19 bytes, let's merge it with following ones until we get 19 bytes
    // usually only one merge is needed (and this is rare ...)
    while (data[0].length < 19 && data.length > 1) {
        data[0] = (0, mp4_tools_1.appendUint8Array)(data[0], data[1]);
        data.splice(1, 1);
    }
    // retrieve PTS/DTS from first fragment
    frag = data[0];
    var pesPrefix = (frag[0] << 16) + (frag[1] << 8) + frag[2];
    if (pesPrefix === 1) {
        pesLen = (frag[4] << 8) + frag[5];
        // if PES parsed length is not zero and greater than total received length, stop parsing. PES might be truncated
        // minus 6 : PES header size
        if (pesLen && pesLen > stream.size - 6) {
            return null;
        }
        var pesFlags = frag[7];
        if (pesFlags & 0xc0) {
            /* PES header described here : http://dvd.sourceforge.net/dvdinfo/pes-hdr.html
                as PTS / DTS is 33 bit we cannot use bitwise operator in JS,
                as Bitwise operators treat their operands as a sequence of 32 bits */
            pesPts =
                (frag[9] & 0x0e) * 536870912 + // 1 << 29
                    (frag[10] & 0xff) * 4194304 + // 1 << 22
                    (frag[11] & 0xfe) * 16384 + // 1 << 14
                    (frag[12] & 0xff) * 128 + // 1 << 7
                    (frag[13] & 0xfe) / 2;
            if (pesFlags & 0x40) {
                pesDts =
                    (frag[14] & 0x0e) * 536870912 + // 1 << 29
                        (frag[15] & 0xff) * 4194304 + // 1 << 22
                        (frag[16] & 0xfe) * 16384 + // 1 << 14
                        (frag[17] & 0xff) * 128 + // 1 << 7
                        (frag[18] & 0xfe) / 2;
                if (pesPts - pesDts > 60 * 90000) {
                    logger_1.logger.warn("".concat(Math.round((pesPts - pesDts) / 90000), "s delta between PTS and DTS, align them"));
                    pesPts = pesDts;
                }
            }
            else {
                pesDts = pesPts;
            }
        }
        pesHdrLen = frag[8];
        // 9 bytes : 6 bytes for PES header + 3 bytes for PES extension
        var payloadStartOffset = pesHdrLen + 9;
        if (stream.size <= payloadStartOffset) {
            return null;
        }
        stream.size -= payloadStartOffset;
        // reassemble PES packet
        var pesData = new Uint8Array(stream.size);
        for (var j = 0, dataLen = data.length; j < dataLen; j++) {
            frag = data[j];
            var len = frag.byteLength;
            if (payloadStartOffset) {
                if (payloadStartOffset > len) {
                    // trim full frag if PES header bigger than frag
                    payloadStartOffset -= len;
                    continue;
                }
                else {
                    // trim partial frag if PES header smaller than frag
                    frag = frag.subarray(payloadStartOffset);
                    len -= payloadStartOffset;
                    payloadStartOffset = 0;
                }
            }
            pesData.set(frag, i);
            i += len;
        }
        if (pesLen) {
            // payload size : remove PES header + PES extension
            pesLen -= pesHdrLen + 3;
        }
        return { data: pesData, pts: pesPts, dts: pesDts, len: pesLen };
    }
    return null;
}
exports.default = TSDemuxer;
