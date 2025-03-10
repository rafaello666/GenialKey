"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePts = normalizePts;
exports.flushTextTrackMetadataCueSamples = flushTextTrackMetadataCueSamples;
exports.flushTextTrackUserdataCueSamples = flushTextTrackUserdataCueSamples;
var aac_helper_1 = require("./aac-helper");
var mp4_generator_1 = require("./mp4-generator");
var events_1 = require("../events");
var errors_1 = require("../errors");
var logger_1 = require("../utils/logger");
var loader_1 = require("../types/loader");
var timescale_conversion_1 = require("../utils/timescale-conversion");
var MAX_SILENT_FRAME_DURATION = 10 * 1000; // 10 seconds
var AAC_SAMPLES_PER_FRAME = 1024;
var MPEG_AUDIO_SAMPLE_PER_FRAME = 1152;
var AC3_SAMPLES_PER_FRAME = 1536;
var chromeVersion = null;
var safariWebkitVersion = null;
var MP4Remuxer = /** @class */ (function () {
    function MP4Remuxer(observer, config, typeSupported, vendor) {
        if (vendor === void 0) { vendor = ''; }
        this.ISGenerated = false;
        this._initPTS = null;
        this._initDTS = null;
        this.nextAvcDts = null;
        this.nextAudioPts = null;
        this.videoSampleDuration = null;
        this.isAudioContiguous = false;
        this.isVideoContiguous = false;
        this.observer = observer;
        this.config = config;
        this.typeSupported = typeSupported;
        this.ISGenerated = false;
        if (chromeVersion === null) {
            var userAgent = navigator.userAgent || '';
            var result = userAgent.match(/Chrome\/(\d+)/i);
            chromeVersion = result ? parseInt(result[1]) : 0;
        }
        if (safariWebkitVersion === null) {
            var result = navigator.userAgent.match(/Safari\/(\d+)/i);
            safariWebkitVersion = result ? parseInt(result[1]) : 0;
        }
    }
    MP4Remuxer.prototype.destroy = function () {
        // @ts-ignore
        this.config = this.videoTrackConfig = this._initPTS = this._initDTS = null;
    };
    MP4Remuxer.prototype.resetTimeStamp = function (defaultTimeStamp) {
        logger_1.logger.log('[mp4-remuxer]: initPTS & initDTS reset');
        this._initPTS = this._initDTS = defaultTimeStamp;
    };
    MP4Remuxer.prototype.resetNextTimestamp = function () {
        logger_1.logger.log('[mp4-remuxer]: reset next timestamp');
        this.isVideoContiguous = false;
        this.isAudioContiguous = false;
    };
    MP4Remuxer.prototype.resetInitSegment = function () {
        logger_1.logger.log('[mp4-remuxer]: ISGenerated flag reset');
        this.ISGenerated = false;
        this.videoTrackConfig = undefined;
    };
    MP4Remuxer.prototype.getVideoStartPts = function (videoSamples) {
        // Get the minimum PTS value relative to the first sample's PTS, normalized for 33-bit wrapping
        var rolloverDetected = false;
        var firstPts = videoSamples[0].pts;
        var startPTS = videoSamples.reduce(function (minPTS, sample) {
            var pts = sample.pts;
            var delta = pts - minPTS;
            if (delta < -4294967296) {
                // 2^32, see PTSNormalize for reasoning, but we're hitting a rollover here, and we don't want that to impact the timeOffset calculation
                rolloverDetected = true;
                pts = normalizePts(pts, firstPts);
                delta = pts - minPTS;
            }
            if (delta > 0) {
                return minPTS;
            }
            return pts;
        }, firstPts);
        if (rolloverDetected) {
            logger_1.logger.debug('PTS rollover detected');
        }
        return startPTS;
    };
    MP4Remuxer.prototype.remux = function (audioTrack, videoTrack, id3Track, textTrack, timeOffset, accurateTimeOffset, flush, playlistType) {
        var _a, _b, _c, _d;
        var video;
        var audio;
        var initSegment;
        var text;
        var id3;
        var independent;
        var audioTimeOffset = timeOffset;
        var videoTimeOffset = timeOffset;
        // If we're remuxing audio and video progressively, wait until we've received enough samples for each track before proceeding.
        // This is done to synchronize the audio and video streams. We know if the current segment will have samples if the "pid"
        // parameter is greater than -1. The pid is set when the PMT is parsed, which contains the tracks list.
        // However, if the initSegment has already been generated, or we've reached the end of a segment (flush),
        // then we can remux one track without waiting for the other.
        var hasAudio = audioTrack.pid > -1;
        var hasVideo = videoTrack.pid > -1;
        var length = videoTrack.samples.length;
        var enoughAudioSamples = audioTrack.samples.length > 0;
        var enoughVideoSamples = (flush && length > 0) || length > 1;
        var canRemuxAvc = ((!hasAudio || enoughAudioSamples) &&
            (!hasVideo || enoughVideoSamples)) ||
            this.ISGenerated ||
            flush;
        if (canRemuxAvc) {
            if (this.ISGenerated) {
                var config = this.videoTrackConfig;
                if (config &&
                    (videoTrack.width !== config.width ||
                        videoTrack.height !== config.height ||
                        ((_a = videoTrack.pixelRatio) === null || _a === void 0 ? void 0 : _a[0]) !== ((_b = config.pixelRatio) === null || _b === void 0 ? void 0 : _b[0]) ||
                        ((_c = videoTrack.pixelRatio) === null || _c === void 0 ? void 0 : _c[1]) !== ((_d = config.pixelRatio) === null || _d === void 0 ? void 0 : _d[1]))) {
                    this.resetInitSegment();
                }
            }
            else {
                initSegment = this.generateIS(audioTrack, videoTrack, timeOffset, accurateTimeOffset);
            }
            var isVideoContiguous = this.isVideoContiguous;
            var firstKeyFrameIndex = -1;
            var firstKeyFramePTS = void 0;
            if (enoughVideoSamples) {
                firstKeyFrameIndex = findKeyframeIndex(videoTrack.samples);
                if (!isVideoContiguous && this.config.forceKeyFrameOnDiscontinuity) {
                    independent = true;
                    if (firstKeyFrameIndex > 0) {
                        logger_1.logger.warn("[mp4-remuxer]: Dropped ".concat(firstKeyFrameIndex, " out of ").concat(length, " video samples due to a missing keyframe"));
                        var startPTS = this.getVideoStartPts(videoTrack.samples);
                        videoTrack.samples = videoTrack.samples.slice(firstKeyFrameIndex);
                        videoTrack.dropped += firstKeyFrameIndex;
                        videoTimeOffset +=
                            (videoTrack.samples[0].pts - startPTS) /
                                videoTrack.inputTimeScale;
                        firstKeyFramePTS = videoTimeOffset;
                    }
                    else if (firstKeyFrameIndex === -1) {
                        logger_1.logger.warn("[mp4-remuxer]: No keyframe found out of ".concat(length, " video samples"));
                        independent = false;
                    }
                }
            }
            if (this.ISGenerated) {
                if (enoughAudioSamples && enoughVideoSamples) {
                    // timeOffset is expected to be the offset of the first timestamp of this fragment (first DTS)
                    // if first audio DTS is not aligned with first video DTS then we need to take that into account
                    // when providing timeOffset to remuxAudio / remuxVideo. if we don't do that, there might be a permanent / small
                    // drift between audio and video streams
                    var startPTS = this.getVideoStartPts(videoTrack.samples);
                    var tsDelta = normalizePts(audioTrack.samples[0].pts, startPTS) - startPTS;
                    var audiovideoTimestampDelta = tsDelta / videoTrack.inputTimeScale;
                    audioTimeOffset += Math.max(0, audiovideoTimestampDelta);
                    videoTimeOffset += Math.max(0, -audiovideoTimestampDelta);
                }
                // Purposefully remuxing audio before video, so that remuxVideo can use nextAudioPts, which is calculated in remuxAudio.
                if (enoughAudioSamples) {
                    // if initSegment was generated without audio samples, regenerate it again
                    if (!audioTrack.samplerate) {
                        logger_1.logger.warn('[mp4-remuxer]: regenerate InitSegment as audio detected');
                        initSegment = this.generateIS(audioTrack, videoTrack, timeOffset, accurateTimeOffset);
                    }
                    audio = this.remuxAudio(audioTrack, audioTimeOffset, this.isAudioContiguous, accurateTimeOffset, hasVideo ||
                        enoughVideoSamples ||
                        playlistType === loader_1.PlaylistLevelType.AUDIO
                        ? videoTimeOffset
                        : undefined);
                    if (enoughVideoSamples) {
                        var audioTrackLength = audio ? audio.endPTS - audio.startPTS : 0;
                        // if initSegment was generated without video samples, regenerate it again
                        if (!videoTrack.inputTimeScale) {
                            logger_1.logger.warn('[mp4-remuxer]: regenerate InitSegment as video detected');
                            initSegment = this.generateIS(audioTrack, videoTrack, timeOffset, accurateTimeOffset);
                        }
                        video = this.remuxVideo(videoTrack, videoTimeOffset, isVideoContiguous, audioTrackLength);
                    }
                }
                else if (enoughVideoSamples) {
                    video = this.remuxVideo(videoTrack, videoTimeOffset, isVideoContiguous, 0);
                }
                if (video) {
                    video.firstKeyFrame = firstKeyFrameIndex;
                    video.independent = firstKeyFrameIndex !== -1;
                    video.firstKeyFramePTS = firstKeyFramePTS;
                }
            }
        }
        // Allow ID3 and text to remux, even if more audio/video samples are required
        if (this.ISGenerated && this._initPTS && this._initDTS) {
            if (id3Track.samples.length) {
                id3 = flushTextTrackMetadataCueSamples(id3Track, timeOffset, this._initPTS, this._initDTS);
            }
            if (textTrack.samples.length) {
                text = flushTextTrackUserdataCueSamples(textTrack, timeOffset, this._initPTS);
            }
        }
        return {
            audio: audio,
            video: video,
            initSegment: initSegment,
            independent: independent,
            text: text,
            id3: id3,
        };
    };
    MP4Remuxer.prototype.generateIS = function (audioTrack, videoTrack, timeOffset, accurateTimeOffset) {
        var audioSamples = audioTrack.samples;
        var videoSamples = videoTrack.samples;
        var typeSupported = this.typeSupported;
        var tracks = {};
        var _initPTS = this._initPTS;
        var computePTSDTS = !_initPTS || accurateTimeOffset;
        var container = 'audio/mp4';
        var initPTS;
        var initDTS;
        var timescale;
        if (computePTSDTS) {
            initPTS = initDTS = Infinity;
        }
        if (audioTrack.config && audioSamples.length) {
            // let's use audio sampling rate as MP4 time scale.
            // rationale is that there is a integer nb of audio frames per audio sample (1024 for AAC)
            // using audio sampling rate here helps having an integer MP4 frame duration
            // this avoids potential rounding issue and AV sync issue
            audioTrack.timescale = audioTrack.samplerate;
            switch (audioTrack.segmentCodec) {
                case 'mp3':
                    if (typeSupported.mpeg) {
                        // Chrome and Safari
                        container = 'audio/mpeg';
                        audioTrack.codec = '';
                    }
                    else if (typeSupported.mp3) {
                        // Firefox
                        audioTrack.codec = 'mp3';
                    }
                    break;
                case 'ac3':
                    audioTrack.codec = 'ac-3';
                    break;
            }
            tracks.audio = {
                id: 'audio',
                container: container,
                codec: audioTrack.codec,
                initSegment: audioTrack.segmentCodec === 'mp3' && typeSupported.mpeg
                    ? new Uint8Array(0)
                    : mp4_generator_1.default.initSegment([audioTrack]),
                metadata: {
                    channelCount: audioTrack.channelCount,
                },
            };
            if (computePTSDTS) {
                timescale = audioTrack.inputTimeScale;
                if (!_initPTS || timescale !== _initPTS.timescale) {
                    // remember first PTS of this demuxing context. for audio, PTS = DTS
                    initPTS = initDTS =
                        audioSamples[0].pts - Math.round(timescale * timeOffset);
                }
                else {
                    computePTSDTS = false;
                }
            }
        }
        if (videoTrack.sps && videoTrack.pps && videoSamples.length) {
            // let's use input time scale as MP4 video timescale
            // we use input time scale straight away to avoid rounding issues on frame duration / cts computation
            videoTrack.timescale = videoTrack.inputTimeScale;
            tracks.video = {
                id: 'main',
                container: 'video/mp4',
                codec: videoTrack.codec,
                initSegment: mp4_generator_1.default.initSegment([videoTrack]),
                metadata: {
                    width: videoTrack.width,
                    height: videoTrack.height,
                },
            };
            if (computePTSDTS) {
                timescale = videoTrack.inputTimeScale;
                if (!_initPTS || timescale !== _initPTS.timescale) {
                    var startPTS = this.getVideoStartPts(videoSamples);
                    var startOffset = Math.round(timescale * timeOffset);
                    initDTS = Math.min(initDTS, normalizePts(videoSamples[0].dts, startPTS) - startOffset);
                    initPTS = Math.min(initPTS, startPTS - startOffset);
                }
                else {
                    computePTSDTS = false;
                }
            }
            this.videoTrackConfig = {
                width: videoTrack.width,
                height: videoTrack.height,
                pixelRatio: videoTrack.pixelRatio,
            };
        }
        if (Object.keys(tracks).length) {
            this.ISGenerated = true;
            if (computePTSDTS) {
                this._initPTS = {
                    baseTime: initPTS,
                    timescale: timescale,
                };
                this._initDTS = {
                    baseTime: initDTS,
                    timescale: timescale,
                };
            }
            else {
                initPTS = timescale = undefined;
            }
            return {
                tracks: tracks,
                initPTS: initPTS,
                timescale: timescale,
            };
        }
    };
    MP4Remuxer.prototype.remuxVideo = function (track, timeOffset, contiguous, audioTrackLength) {
        var timeScale = track.inputTimeScale;
        var inputSamples = track.samples;
        var outputSamples = [];
        var nbSamples = inputSamples.length;
        var initPTS = this._initPTS;
        var nextAvcDts = this.nextAvcDts;
        var offset = 8;
        var mp4SampleDuration = this.videoSampleDuration;
        var firstDTS;
        var lastDTS;
        var minPTS = Number.POSITIVE_INFINITY;
        var maxPTS = Number.NEGATIVE_INFINITY;
        var sortSamples = false;
        // if parsed fragment is contiguous with last one, let's use last DTS value as reference
        if (!contiguous || nextAvcDts === null) {
            var pts = timeOffset * timeScale;
            var cts = inputSamples[0].pts -
                normalizePts(inputSamples[0].dts, inputSamples[0].pts);
            if (chromeVersion &&
                nextAvcDts !== null &&
                Math.abs(pts - cts - nextAvcDts) < 15000) {
                // treat as contigous to adjust samples that would otherwise produce video buffer gaps in Chrome
                contiguous = true;
            }
            else {
                // if not contiguous, let's use target timeOffset
                nextAvcDts = pts - cts;
            }
        }
        // PTS is coded on 33bits, and can loop from -2^32 to 2^32
        // PTSNormalize will make PTS/DTS value monotonic, we use last known DTS value as reference value
        var initTime = (initPTS.baseTime * timeScale) / initPTS.timescale;
        for (var i = 0; i < nbSamples; i++) {
            var sample = inputSamples[i];
            sample.pts = normalizePts(sample.pts - initTime, nextAvcDts);
            sample.dts = normalizePts(sample.dts - initTime, nextAvcDts);
            if (sample.dts < inputSamples[i > 0 ? i - 1 : i].dts) {
                sortSamples = true;
            }
        }
        // sort video samples by DTS then PTS then demux id order
        if (sortSamples) {
            inputSamples.sort(function (a, b) {
                var deltadts = a.dts - b.dts;
                var deltapts = a.pts - b.pts;
                return deltadts || deltapts;
            });
        }
        // Get first/last DTS
        firstDTS = inputSamples[0].dts;
        lastDTS = inputSamples[inputSamples.length - 1].dts;
        // Sample duration (as expected by trun MP4 boxes), should be the delta between sample DTS
        // set this constant duration as being the avg delta between consecutive DTS.
        var inputDuration = lastDTS - firstDTS;
        var averageSampleDuration = inputDuration
            ? Math.round(inputDuration / (nbSamples - 1))
            : mp4SampleDuration || track.inputTimeScale / 30;
        // if fragment are contiguous, detect hole/overlapping between fragments
        if (contiguous) {
            // check timestamp continuity across consecutive fragments (this is to remove inter-fragment gap/hole)
            var delta = firstDTS - nextAvcDts;
            var foundHole = delta > averageSampleDuration;
            var foundOverlap = delta < -1;
            if (foundHole || foundOverlap) {
                if (foundHole) {
                    logger_1.logger.warn("AVC: ".concat((0, timescale_conversion_1.toMsFromMpegTsClock)(delta, true), " ms (").concat(delta, "dts) hole between fragments detected at ").concat(timeOffset.toFixed(3)));
                }
                else {
                    logger_1.logger.warn("AVC: ".concat((0, timescale_conversion_1.toMsFromMpegTsClock)(-delta, true), " ms (").concat(delta, "dts) overlapping between fragments detected at ").concat(timeOffset.toFixed(3)));
                }
                if (!foundOverlap ||
                    nextAvcDts >= inputSamples[0].pts ||
                    chromeVersion) {
                    firstDTS = nextAvcDts;
                    var firstPTS = inputSamples[0].pts - delta;
                    if (foundHole) {
                        inputSamples[0].dts = firstDTS;
                        inputSamples[0].pts = firstPTS;
                    }
                    else {
                        for (var i = 0; i < inputSamples.length; i++) {
                            if (inputSamples[i].dts > firstPTS) {
                                break;
                            }
                            inputSamples[i].dts -= delta;
                            inputSamples[i].pts -= delta;
                        }
                    }
                    logger_1.logger.log("Video: Initial PTS/DTS adjusted: ".concat((0, timescale_conversion_1.toMsFromMpegTsClock)(firstPTS, true), "/").concat((0, timescale_conversion_1.toMsFromMpegTsClock)(firstDTS, true), ", delta: ").concat((0, timescale_conversion_1.toMsFromMpegTsClock)(delta, true), " ms"));
                }
            }
        }
        firstDTS = Math.max(0, firstDTS);
        var nbNalu = 0;
        var naluLen = 0;
        var dtsStep = firstDTS;
        for (var i = 0; i < nbSamples; i++) {
            // compute total/avc sample length and nb of NAL units
            var sample = inputSamples[i];
            var units = sample.units;
            var nbUnits = units.length;
            var sampleLen = 0;
            for (var j = 0; j < nbUnits; j++) {
                sampleLen += units[j].data.length;
            }
            naluLen += sampleLen;
            nbNalu += nbUnits;
            sample.length = sampleLen;
            // ensure sample monotonic DTS
            if (sample.dts < dtsStep) {
                sample.dts = dtsStep;
                dtsStep += (averageSampleDuration / 4) | 0 || 1;
            }
            else {
                dtsStep = sample.dts;
            }
            minPTS = Math.min(sample.pts, minPTS);
            maxPTS = Math.max(sample.pts, maxPTS);
        }
        lastDTS = inputSamples[nbSamples - 1].dts;
        /* concatenate the video data and construct the mdat in place
          (need 8 more bytes to fill length and mpdat type) */
        var mdatSize = naluLen + 4 * nbNalu + 8;
        var mdat;
        try {
            mdat = new Uint8Array(mdatSize);
        }
        catch (err) {
            this.observer.emit(events_1.Events.ERROR, events_1.Events.ERROR, {
                type: errors_1.ErrorTypes.MUX_ERROR,
                details: errors_1.ErrorDetails.REMUX_ALLOC_ERROR,
                fatal: false,
                error: err,
                bytes: mdatSize,
                reason: "fail allocating video mdat ".concat(mdatSize),
            });
            return;
        }
        var view = new DataView(mdat.buffer);
        view.setUint32(0, mdatSize);
        mdat.set(mp4_generator_1.default.types.mdat, 4);
        var stretchedLastFrame = false;
        var minDtsDelta = Number.POSITIVE_INFINITY;
        var minPtsDelta = Number.POSITIVE_INFINITY;
        var maxDtsDelta = Number.NEGATIVE_INFINITY;
        var maxPtsDelta = Number.NEGATIVE_INFINITY;
        for (var i = 0; i < nbSamples; i++) {
            var VideoSample_1 = inputSamples[i];
            var VideoSampleUnits = VideoSample_1.units;
            var mp4SampleLength = 0;
            // convert NALU bitstream to MP4 format (prepend NALU with size field)
            for (var j = 0, nbUnits = VideoSampleUnits.length; j < nbUnits; j++) {
                var unit = VideoSampleUnits[j];
                var unitData = unit.data;
                var unitDataLen = unit.data.byteLength;
                view.setUint32(offset, unitDataLen);
                offset += 4;
                mdat.set(unitData, offset);
                offset += unitDataLen;
                mp4SampleLength += 4 + unitDataLen;
            }
            // expected sample duration is the Decoding Timestamp diff of consecutive samples
            var ptsDelta = void 0;
            if (i < nbSamples - 1) {
                mp4SampleDuration = inputSamples[i + 1].dts - VideoSample_1.dts;
                ptsDelta = inputSamples[i + 1].pts - VideoSample_1.pts;
            }
            else {
                var config = this.config;
                var lastFrameDuration = i > 0
                    ? VideoSample_1.dts - inputSamples[i - 1].dts
                    : averageSampleDuration;
                ptsDelta =
                    i > 0
                        ? VideoSample_1.pts - inputSamples[i - 1].pts
                        : averageSampleDuration;
                if (config.stretchShortVideoTrack && this.nextAudioPts !== null) {
                    // In some cases, a segment's audio track duration may exceed the video track duration.
                    // Since we've already remuxed audio, and we know how long the audio track is, we look to
                    // see if the delta to the next segment is longer than maxBufferHole.
                    // If so, playback would potentially get stuck, so we artificially inflate
                    // the duration of the last frame to minimize any potential gap between segments.
                    var gapTolerance = Math.floor(config.maxBufferHole * timeScale);
                    var deltaToFrameEnd = (audioTrackLength
                        ? minPTS + audioTrackLength * timeScale
                        : this.nextAudioPts) - VideoSample_1.pts;
                    if (deltaToFrameEnd > gapTolerance) {
                        // We subtract lastFrameDuration from deltaToFrameEnd to try to prevent any video
                        // frame overlap. maxBufferHole should be >> lastFrameDuration anyway.
                        mp4SampleDuration = deltaToFrameEnd - lastFrameDuration;
                        if (mp4SampleDuration < 0) {
                            mp4SampleDuration = lastFrameDuration;
                        }
                        else {
                            stretchedLastFrame = true;
                        }
                        logger_1.logger.log("[mp4-remuxer]: It is approximately ".concat(deltaToFrameEnd / 90, " ms to the next segment; using duration ").concat(mp4SampleDuration / 90, " ms for the last video frame."));
                    }
                    else {
                        mp4SampleDuration = lastFrameDuration;
                    }
                }
                else {
                    mp4SampleDuration = lastFrameDuration;
                }
            }
            var compositionTimeOffset = Math.round(VideoSample_1.pts - VideoSample_1.dts);
            minDtsDelta = Math.min(minDtsDelta, mp4SampleDuration);
            maxDtsDelta = Math.max(maxDtsDelta, mp4SampleDuration);
            minPtsDelta = Math.min(minPtsDelta, ptsDelta);
            maxPtsDelta = Math.max(maxPtsDelta, ptsDelta);
            outputSamples.push(new Mp4Sample(VideoSample_1.key, mp4SampleDuration, mp4SampleLength, compositionTimeOffset));
        }
        if (outputSamples.length) {
            if (chromeVersion) {
                if (chromeVersion < 70) {
                    // Chrome workaround, mark first sample as being a Random Access Point (keyframe) to avoid sourcebuffer append issue
                    // https://code.google.com/p/chromium/issues/detail?id=229412
                    var flags = outputSamples[0].flags;
                    flags.dependsOn = 2;
                    flags.isNonSync = 0;
                }
            }
            else if (safariWebkitVersion) {
                // Fix for "CNN special report, with CC" in test-streams (Safari browser only)
                // Ignore DTS when frame durations are irregular. Safari MSE does not handle this leading to gaps.
                if (maxPtsDelta - minPtsDelta < maxDtsDelta - minDtsDelta &&
                    averageSampleDuration / maxDtsDelta < 0.025 &&
                    outputSamples[0].cts === 0) {
                    logger_1.logger.warn('Found irregular gaps in sample duration. Using PTS instead of DTS to determine MP4 sample duration.');
                    var dts = firstDTS;
                    for (var i = 0, len = outputSamples.length; i < len; i++) {
                        var nextDts = dts + outputSamples[i].duration;
                        var pts = dts + outputSamples[i].cts;
                        if (i < len - 1) {
                            var nextPts = nextDts + outputSamples[i + 1].cts;
                            outputSamples[i].duration = nextPts - pts;
                        }
                        else {
                            outputSamples[i].duration = i
                                ? outputSamples[i - 1].duration
                                : averageSampleDuration;
                        }
                        outputSamples[i].cts = 0;
                        dts = nextDts;
                    }
                }
            }
        }
        // next AVC sample DTS should be equal to last sample DTS + last sample duration (in PES timescale)
        mp4SampleDuration =
            stretchedLastFrame || !mp4SampleDuration
                ? averageSampleDuration
                : mp4SampleDuration;
        this.nextAvcDts = nextAvcDts = lastDTS + mp4SampleDuration;
        this.videoSampleDuration = mp4SampleDuration;
        this.isVideoContiguous = true;
        var moof = mp4_generator_1.default.moof(track.sequenceNumber++, firstDTS, Object.assign({}, track, {
            samples: outputSamples,
        }));
        var type = 'video';
        var data = {
            data1: moof,
            data2: mdat,
            startPTS: minPTS / timeScale,
            endPTS: (maxPTS + mp4SampleDuration) / timeScale,
            startDTS: firstDTS / timeScale,
            endDTS: nextAvcDts / timeScale,
            type: type,
            hasAudio: false,
            hasVideo: true,
            nb: outputSamples.length,
            dropped: track.dropped,
        };
        track.samples = [];
        track.dropped = 0;
        return data;
    };
    MP4Remuxer.prototype.getSamplesPerFrame = function (track) {
        switch (track.segmentCodec) {
            case 'mp3':
                return MPEG_AUDIO_SAMPLE_PER_FRAME;
            case 'ac3':
                return AC3_SAMPLES_PER_FRAME;
            default:
                return AAC_SAMPLES_PER_FRAME;
        }
    };
    MP4Remuxer.prototype.remuxAudio = function (track, timeOffset, contiguous, accurateTimeOffset, videoTimeOffset) {
        var inputTimeScale = track.inputTimeScale;
        var mp4timeScale = track.samplerate
            ? track.samplerate
            : inputTimeScale;
        var scaleFactor = inputTimeScale / mp4timeScale;
        var mp4SampleDuration = this.getSamplesPerFrame(track);
        var inputSampleDuration = mp4SampleDuration * scaleFactor;
        var initPTS = this._initPTS;
        var rawMPEG = track.segmentCodec === 'mp3' && this.typeSupported.mpeg;
        var outputSamples = [];
        var alignedWithVideo = videoTimeOffset !== undefined;
        var inputSamples = track.samples;
        var offset = rawMPEG ? 0 : 8;
        var nextAudioPts = this.nextAudioPts || -1;
        // window.audioSamples ? window.audioSamples.push(inputSamples.map(s => s.pts)) : (window.audioSamples = [inputSamples.map(s => s.pts)]);
        // for audio samples, also consider consecutive fragments as being contiguous (even if a level switch occurs),
        // for sake of clarity:
        // consecutive fragments are frags with
        //  - less than 100ms gaps between new time offset (if accurate) and next expected PTS OR
        //  - less than 20 audio frames distance
        // contiguous fragments are consecutive fragments from same quality level (same level, new SN = old SN + 1)
        // this helps ensuring audio continuity
        // and this also avoids audio glitches/cut when switching quality, or reporting wrong duration on first audio frame
        var timeOffsetMpegTS = timeOffset * inputTimeScale;
        var initTime = (initPTS.baseTime * inputTimeScale) / initPTS.timescale;
        this.isAudioContiguous = contiguous =
            contiguous ||
                (inputSamples.length &&
                    nextAudioPts > 0 &&
                    ((accurateTimeOffset &&
                        Math.abs(timeOffsetMpegTS - nextAudioPts) < 9000) ||
                        Math.abs(normalizePts(inputSamples[0].pts - initTime, timeOffsetMpegTS) -
                            nextAudioPts) <
                            20 * inputSampleDuration));
        // compute normalized PTS
        inputSamples.forEach(function (sample) {
            sample.pts = normalizePts(sample.pts - initTime, timeOffsetMpegTS);
        });
        if (!contiguous || nextAudioPts < 0) {
            // filter out sample with negative PTS that are not playable anyway
            // if we don't remove these negative samples, they will shift all audio samples forward.
            // leading to audio overlap between current / next fragment
            inputSamples = inputSamples.filter(function (sample) { return sample.pts >= 0; });
            // in case all samples have negative PTS, and have been filtered out, return now
            if (!inputSamples.length) {
                return;
            }
            if (videoTimeOffset === 0) {
                // Set the start to 0 to match video so that start gaps larger than inputSampleDuration are filled with silence
                nextAudioPts = 0;
            }
            else if (accurateTimeOffset && !alignedWithVideo) {
                // When not seeking, not live, and LevelDetails.PTSKnown, use fragment start as predicted next audio PTS
                nextAudioPts = Math.max(0, timeOffsetMpegTS);
            }
            else {
                // if frags are not contiguous and if we cant trust time offset, let's use first sample PTS as next audio PTS
                nextAudioPts = inputSamples[0].pts;
            }
        }
        // If the audio track is missing samples, the frames seem to get "left-shifted" within the
        // resulting mp4 segment, causing sync issues and leaving gaps at the end of the audio segment.
        // In an effort to prevent this from happening, we inject frames here where there are gaps.
        // When possible, we inject a silent frame; when that's not possible, we duplicate the last
        // frame.
        if (track.segmentCodec === 'aac') {
            var maxAudioFramesDrift = this.config.maxAudioFramesDrift;
            for (var i = 0, nextPts = nextAudioPts; i < inputSamples.length; i++) {
                // First, let's see how far off this frame is from where we expect it to be
                var sample = inputSamples[i];
                var pts = sample.pts;
                var delta = pts - nextPts;
                var duration = Math.abs((1000 * delta) / inputTimeScale);
                // When remuxing with video, if we're overlapping by more than a duration, drop this sample to stay in sync
                if (delta <= -maxAudioFramesDrift * inputSampleDuration &&
                    alignedWithVideo) {
                    if (i === 0) {
                        logger_1.logger.warn("Audio frame @ ".concat((pts / inputTimeScale).toFixed(3), "s overlaps nextAudioPts by ").concat(Math.round((1000 * delta) / inputTimeScale), " ms."));
                        this.nextAudioPts = nextAudioPts = nextPts = pts;
                    }
                } // eslint-disable-line brace-style
                // Insert missing frames if:
                // 1: We're more than maxAudioFramesDrift frame away
                // 2: Not more than MAX_SILENT_FRAME_DURATION away
                // 3: currentTime (aka nextPtsNorm) is not 0
                // 4: remuxing with video (videoTimeOffset !== undefined)
                else if (delta >= maxAudioFramesDrift * inputSampleDuration &&
                    duration < MAX_SILENT_FRAME_DURATION &&
                    alignedWithVideo) {
                    var missing = Math.round(delta / inputSampleDuration);
                    // Adjust nextPts so that silent samples are aligned with media pts. This will prevent media samples from
                    // later being shifted if nextPts is based on timeOffset and delta is not a multiple of inputSampleDuration.
                    nextPts = pts - missing * inputSampleDuration;
                    if (nextPts < 0) {
                        missing--;
                        nextPts += inputSampleDuration;
                    }
                    if (i === 0) {
                        this.nextAudioPts = nextAudioPts = nextPts;
                    }
                    logger_1.logger.warn("[mp4-remuxer]: Injecting ".concat(missing, " audio frame @ ").concat((nextPts / inputTimeScale).toFixed(3), "s due to ").concat(Math.round((1000 * delta) / inputTimeScale), " ms gap."));
                    for (var j = 0; j < missing; j++) {
                        var newStamp = Math.max(nextPts, 0);
                        var fillFrame = aac_helper_1.default.getSilentFrame(track.manifestCodec || track.codec, track.channelCount);
                        if (!fillFrame) {
                            logger_1.logger.log('[mp4-remuxer]: Unable to get silent frame for given audio codec; duplicating last frame instead.');
                            fillFrame = sample.unit.subarray();
                        }
                        inputSamples.splice(i, 0, {
                            unit: fillFrame,
                            pts: newStamp,
                        });
                        nextPts += inputSampleDuration;
                        i++;
                    }
                }
                sample.pts = nextPts;
                nextPts += inputSampleDuration;
            }
        }
        var firstPTS = null;
        var lastPTS = null;
        var mdat;
        var mdatSize = 0;
        var sampleLength = inputSamples.length;
        while (sampleLength--) {
            mdatSize += inputSamples[sampleLength].unit.byteLength;
        }
        for (var j = 0, nbSamples_1 = inputSamples.length; j < nbSamples_1; j++) {
            var audioSample = inputSamples[j];
            var unit = audioSample.unit;
            var pts = audioSample.pts;
            if (lastPTS !== null) {
                // If we have more than one sample, set the duration of the sample to the "real" duration; the PTS diff with
                // the previous sample
                var prevSample = outputSamples[j - 1];
                prevSample.duration = Math.round((pts - lastPTS) / scaleFactor);
            }
            else {
                if (contiguous && track.segmentCodec === 'aac') {
                    // set PTS/DTS to expected PTS/DTS
                    pts = nextAudioPts;
                }
                // remember first PTS of our audioSamples
                firstPTS = pts;
                if (mdatSize > 0) {
                    /* concatenate the audio data and construct the mdat in place
                      (need 8 more bytes to fill length and mdat type) */
                    mdatSize += offset;
                    try {
                        mdat = new Uint8Array(mdatSize);
                    }
                    catch (err) {
                        this.observer.emit(events_1.Events.ERROR, events_1.Events.ERROR, {
                            type: errors_1.ErrorTypes.MUX_ERROR,
                            details: errors_1.ErrorDetails.REMUX_ALLOC_ERROR,
                            fatal: false,
                            error: err,
                            bytes: mdatSize,
                            reason: "fail allocating audio mdat ".concat(mdatSize),
                        });
                        return;
                    }
                    if (!rawMPEG) {
                        var view = new DataView(mdat.buffer);
                        view.setUint32(0, mdatSize);
                        mdat.set(mp4_generator_1.default.types.mdat, 4);
                    }
                }
                else {
                    // no audio samples
                    return;
                }
            }
            mdat.set(unit, offset);
            var unitLen = unit.byteLength;
            offset += unitLen;
            // Default the sample's duration to the computed mp4SampleDuration, which will either be 1024 for AAC or 1152 for MPEG
            // In the case that we have 1 sample, this will be the duration. If we have more than one sample, the duration
            // becomes the PTS diff with the previous sample
            outputSamples.push(new Mp4Sample(true, mp4SampleDuration, unitLen, 0));
            lastPTS = pts;
        }
        // We could end up with no audio samples if all input samples were overlapping with the previously remuxed ones
        var nbSamples = outputSamples.length;
        if (!nbSamples) {
            return;
        }
        // The next audio sample PTS should be equal to last sample PTS + duration
        var lastSample = outputSamples[outputSamples.length - 1];
        this.nextAudioPts = nextAudioPts =
            lastPTS + scaleFactor * lastSample.duration;
        // Set the track samples from inputSamples to outputSamples before remuxing
        var moof = rawMPEG
            ? new Uint8Array(0)
            : mp4_generator_1.default.moof(track.sequenceNumber++, firstPTS / scaleFactor, Object.assign({}, track, { samples: outputSamples }));
        // Clear the track samples. This also clears the samples array in the demuxer, since the reference is shared
        track.samples = [];
        var start = firstPTS / inputTimeScale;
        var end = nextAudioPts / inputTimeScale;
        var type = 'audio';
        var audioData = {
            data1: moof,
            data2: mdat,
            startPTS: start,
            endPTS: end,
            startDTS: start,
            endDTS: end,
            type: type,
            hasAudio: true,
            hasVideo: false,
            nb: nbSamples,
        };
        this.isAudioContiguous = true;
        return audioData;
    };
    MP4Remuxer.prototype.remuxEmptyAudio = function (track, timeOffset, contiguous, videoData) {
        var inputTimeScale = track.inputTimeScale;
        var mp4timeScale = track.samplerate
            ? track.samplerate
            : inputTimeScale;
        var scaleFactor = inputTimeScale / mp4timeScale;
        var nextAudioPts = this.nextAudioPts;
        // sync with video's timestamp
        var initDTS = this._initDTS;
        var init90kHz = (initDTS.baseTime * 90000) / initDTS.timescale;
        var startDTS = (nextAudioPts !== null
            ? nextAudioPts
            : videoData.startDTS * inputTimeScale) + init90kHz;
        var endDTS = videoData.endDTS * inputTimeScale + init90kHz;
        // one sample's duration value
        var frameDuration = scaleFactor * AAC_SAMPLES_PER_FRAME;
        // samples count of this segment's duration
        var nbSamples = Math.ceil((endDTS - startDTS) / frameDuration);
        // silent frame
        var silentFrame = aac_helper_1.default.getSilentFrame(track.manifestCodec || track.codec, track.channelCount);
        logger_1.logger.warn('[mp4-remuxer]: remux empty Audio');
        // Can't remux if we can't generate a silent frame...
        if (!silentFrame) {
            logger_1.logger.trace('[mp4-remuxer]: Unable to remuxEmptyAudio since we were unable to get a silent frame for given audio codec');
            return;
        }
        var samples = [];
        for (var i = 0; i < nbSamples; i++) {
            var stamp = startDTS + i * frameDuration;
            samples.push({ unit: silentFrame, pts: stamp, dts: stamp });
        }
        track.samples = samples;
        return this.remuxAudio(track, timeOffset, contiguous, false);
    };
    return MP4Remuxer;
}());
exports.default = MP4Remuxer;
function normalizePts(value, reference) {
    var offset;
    if (reference === null) {
        return value;
    }
    if (reference < value) {
        // - 2^33
        offset = -8589934592;
    }
    else {
        // + 2^33
        offset = 8589934592;
    }
    /* PTS is 33bit (from 0 to 2^33 -1)
      if diff between value and reference is bigger than half of the amplitude (2^32) then it means that
      PTS looping occured. fill the gap */
    while (Math.abs(value - reference) > 4294967296) {
        value += offset;
    }
    return value;
}
function findKeyframeIndex(samples) {
    for (var i = 0; i < samples.length; i++) {
        if (samples[i].key) {
            return i;
        }
    }
    return -1;
}
function flushTextTrackMetadataCueSamples(track, timeOffset, initPTS, initDTS) {
    var length = track.samples.length;
    if (!length) {
        return;
    }
    var inputTimeScale = track.inputTimeScale;
    for (var index = 0; index < length; index++) {
        var sample = track.samples[index];
        // setting id3 pts, dts to relative time
        // using this._initPTS and this._initDTS to calculate relative time
        sample.pts =
            normalizePts(sample.pts - (initPTS.baseTime * inputTimeScale) / initPTS.timescale, timeOffset * inputTimeScale) / inputTimeScale;
        sample.dts =
            normalizePts(sample.dts - (initDTS.baseTime * inputTimeScale) / initDTS.timescale, timeOffset * inputTimeScale) / inputTimeScale;
    }
    var samples = track.samples;
    track.samples = [];
    return {
        samples: samples,
    };
}
function flushTextTrackUserdataCueSamples(track, timeOffset, initPTS) {
    var length = track.samples.length;
    if (!length) {
        return;
    }
    var inputTimeScale = track.inputTimeScale;
    for (var index = 0; index < length; index++) {
        var sample = track.samples[index];
        // setting text pts, dts to relative time
        // using this._initPTS and this._initDTS to calculate relative time
        sample.pts =
            normalizePts(sample.pts - (initPTS.baseTime * inputTimeScale) / initPTS.timescale, timeOffset * inputTimeScale) / inputTimeScale;
    }
    track.samples.sort(function (a, b) { return a.pts - b.pts; });
    var samples = track.samples;
    track.samples = [];
    return {
        samples: samples,
    };
}
var Mp4Sample = /** @class */ (function () {
    function Mp4Sample(isKeyframe, duration, size, cts) {
        this.duration = duration;
        this.size = size;
        this.cts = cts;
        this.flags = {
            isLeading: 0,
            isDependedOn: 0,
            hasRedundancy: 0,
            degradPrio: 0,
            dependsOn: isKeyframe ? 2 : 1,
            isNonSync: isKeyframe ? 0 : 1,
        };
    }
    return Mp4Sample;
}());
