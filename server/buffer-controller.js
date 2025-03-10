"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("../events");
var logger_1 = require("../utils/logger");
var errors_1 = require("../errors");
var buffer_helper_1 = require("../utils/buffer-helper");
var codecs_1 = require("../utils/codecs");
var mediasource_helper_1 = require("../utils/mediasource-helper");
var fragment_1 = require("../loader/fragment");
var buffer_operation_queue_1 = require("./buffer-operation-queue");
var VIDEO_CODEC_PROFILE_REPLACE = /(avc[1234]|hvc1|hev1|dvh[1e]|vp09|av01)(?:\.[^.,]+)+/;
var BufferController = /** @class */ (function () {
    function BufferController(hls) {
        var _this = this;
        // The level details used to determine duration, target-duration and live
        this.details = null;
        // cache the self generated object url to detect hijack of video tag
        this._objectUrl = null;
        // The number of BUFFER_CODEC events received before any sourceBuffers are created
        this.bufferCodecEventsExpected = 0;
        // The total number of BUFFER_CODEC events received
        this._bufferCodecEventsTotal = 0;
        // A reference to the attached media element
        this.media = null;
        // A reference to the active media source
        this.mediaSource = null;
        // Last MP3 audio chunk appended
        this.lastMpegAudioChunk = null;
        // counters
        this.appendErrors = {
            audio: 0,
            video: 0,
            audiovideo: 0,
        };
        this.tracks = {};
        this.pendingTracks = {};
        this._onEndStreaming = function (event) {
            if (!_this.hls) {
                return;
            }
            _this.hls.pauseBuffering();
        };
        this._onStartStreaming = function (event) {
            if (!_this.hls) {
                return;
            }
            _this.hls.resumeBuffering();
        };
        // Keep as arrow functions so that we can directly reference these functions directly as event listeners
        this._onMediaSourceOpen = function () {
            var _a = _this, media = _a.media, mediaSource = _a.mediaSource;
            _this.log('Media source opened');
            if (media) {
                media.removeEventListener('emptied', _this._onMediaEmptied);
                _this.updateMediaElementDuration();
                _this.hls.trigger(events_1.Events.MEDIA_ATTACHED, {
                    media: media,
                    mediaSource: mediaSource,
                });
            }
            if (mediaSource) {
                // once received, don't listen anymore to sourceopen event
                mediaSource.removeEventListener('sourceopen', _this._onMediaSourceOpen);
            }
            _this.checkPendingTracks();
        };
        this._onMediaSourceClose = function () {
            _this.log('Media source closed');
        };
        this._onMediaSourceEnded = function () {
            _this.log('Media source ended');
        };
        this._onMediaEmptied = function () {
            var _a = _this, mediaSrc = _a.mediaSrc, _objectUrl = _a._objectUrl;
            if (mediaSrc !== _objectUrl) {
                logger_1.logger.error("Media element src was set while attaching MediaSource (".concat(_objectUrl, " > ").concat(mediaSrc, ")"));
            }
        };
        this.hls = hls;
        var logPrefix = '[buffer-controller]';
        this.appendSource = (0, mediasource_helper_1.isManagedMediaSource)((0, mediasource_helper_1.getMediaSource)(hls.config.preferManagedMediaSource));
        this.log = logger_1.logger.log.bind(logger_1.logger, logPrefix);
        this.warn = logger_1.logger.warn.bind(logger_1.logger, logPrefix);
        this.error = logger_1.logger.error.bind(logger_1.logger, logPrefix);
        this._initSourceBuffer();
        this.registerListeners();
    }
    BufferController.prototype.hasSourceTypes = function () {
        return (this.getSourceBufferTypes().length > 0 ||
            Object.keys(this.pendingTracks).length > 0);
    };
    BufferController.prototype.destroy = function () {
        this.unregisterListeners();
        this.details = null;
        this.lastMpegAudioChunk = null;
        // @ts-ignore
        this.hls = null;
    };
    BufferController.prototype.registerListeners = function () {
        var hls = this.hls;
        hls.on(events_1.Events.MEDIA_ATTACHING, this.onMediaAttaching, this);
        hls.on(events_1.Events.MEDIA_DETACHING, this.onMediaDetaching, this);
        hls.on(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.on(events_1.Events.MANIFEST_PARSED, this.onManifestParsed, this);
        hls.on(events_1.Events.BUFFER_RESET, this.onBufferReset, this);
        hls.on(events_1.Events.BUFFER_APPENDING, this.onBufferAppending, this);
        hls.on(events_1.Events.BUFFER_CODECS, this.onBufferCodecs, this);
        hls.on(events_1.Events.BUFFER_EOS, this.onBufferEos, this);
        hls.on(events_1.Events.BUFFER_FLUSHING, this.onBufferFlushing, this);
        hls.on(events_1.Events.LEVEL_UPDATED, this.onLevelUpdated, this);
        hls.on(events_1.Events.FRAG_PARSED, this.onFragParsed, this);
        hls.on(events_1.Events.FRAG_CHANGED, this.onFragChanged, this);
    };
    BufferController.prototype.unregisterListeners = function () {
        var hls = this.hls;
        hls.off(events_1.Events.MEDIA_ATTACHING, this.onMediaAttaching, this);
        hls.off(events_1.Events.MEDIA_DETACHING, this.onMediaDetaching, this);
        hls.off(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.off(events_1.Events.MANIFEST_PARSED, this.onManifestParsed, this);
        hls.off(events_1.Events.BUFFER_RESET, this.onBufferReset, this);
        hls.off(events_1.Events.BUFFER_APPENDING, this.onBufferAppending, this);
        hls.off(events_1.Events.BUFFER_CODECS, this.onBufferCodecs, this);
        hls.off(events_1.Events.BUFFER_EOS, this.onBufferEos, this);
        hls.off(events_1.Events.BUFFER_FLUSHING, this.onBufferFlushing, this);
        hls.off(events_1.Events.LEVEL_UPDATED, this.onLevelUpdated, this);
        hls.off(events_1.Events.FRAG_PARSED, this.onFragParsed, this);
        hls.off(events_1.Events.FRAG_CHANGED, this.onFragChanged, this);
    };
    BufferController.prototype._initSourceBuffer = function () {
        this.sourceBuffer = {};
        this.operationQueue = new buffer_operation_queue_1.default(this.sourceBuffer);
        this.listeners = {
            audio: [],
            video: [],
            audiovideo: [],
        };
        this.appendErrors = {
            audio: 0,
            video: 0,
            audiovideo: 0,
        };
        this.lastMpegAudioChunk = null;
    };
    BufferController.prototype.onManifestLoading = function () {
        this.bufferCodecEventsExpected = this._bufferCodecEventsTotal = 0;
        this.details = null;
    };
    BufferController.prototype.onManifestParsed = function (event, data) {
        // in case of alt audio 2 BUFFER_CODECS events will be triggered, one per stream controller
        // sourcebuffers will be created all at once when the expected nb of tracks will be reached
        // in case alt audio is not used, only one BUFFER_CODEC event will be fired from main stream controller
        // it will contain the expected nb of source buffers, no need to compute it
        var codecEvents = 2;
        if ((data.audio && !data.video) || !data.altAudio || !__USE_ALT_AUDIO__) {
            codecEvents = 1;
        }
        this.bufferCodecEventsExpected = this._bufferCodecEventsTotal = codecEvents;
        this.log("".concat(this.bufferCodecEventsExpected, " bufferCodec event(s) expected"));
    };
    BufferController.prototype.onMediaAttaching = function (event, data) {
        var _a;
        var media = (this.media = data.media);
        var MediaSource = (0, mediasource_helper_1.getMediaSource)(this.appendSource);
        if (media && MediaSource) {
            var ms = (this.mediaSource = new MediaSource());
            this.log("created media source: ".concat((_a = ms.constructor) === null || _a === void 0 ? void 0 : _a.name));
            // MediaSource listeners are arrow functions with a lexical scope, and do not need to be bound
            ms.addEventListener('sourceopen', this._onMediaSourceOpen);
            ms.addEventListener('sourceended', this._onMediaSourceEnded);
            ms.addEventListener('sourceclose', this._onMediaSourceClose);
            if (this.appendSource) {
                ms.addEventListener('startstreaming', this._onStartStreaming);
                ms.addEventListener('endstreaming', this._onEndStreaming);
            }
            // cache the locally generated object url
            var objectUrl = (this._objectUrl = self.URL.createObjectURL(ms));
            // link video and media Source
            if (this.appendSource) {
                try {
                    media.removeAttribute('src');
                    // ManagedMediaSource will not open without disableRemotePlayback set to false or source alternatives
                    var MMS = self.ManagedMediaSource;
                    media.disableRemotePlayback =
                        media.disableRemotePlayback || (MMS && ms instanceof MMS);
                    removeSourceChildren(media);
                    addSource(media, objectUrl);
                    media.load();
                }
                catch (error) {
                    media.src = objectUrl;
                }
            }
            else {
                media.src = objectUrl;
            }
            media.addEventListener('emptied', this._onMediaEmptied);
        }
    };
    BufferController.prototype.onMediaDetaching = function () {
        var _a = this, media = _a.media, mediaSource = _a.mediaSource, _objectUrl = _a._objectUrl;
        if (mediaSource) {
            this.log('media source detaching');
            if (mediaSource.readyState === 'open') {
                try {
                    // endOfStream could trigger exception if any sourcebuffer is in updating state
                    // we don't really care about checking sourcebuffer state here,
                    // as we are anyway detaching the MediaSource
                    // let's just avoid this exception to propagate
                    mediaSource.endOfStream();
                }
                catch (err) {
                    this.warn("onMediaDetaching: ".concat(err.message, " while calling endOfStream"));
                }
            }
            // Clean up the SourceBuffers by invoking onBufferReset
            this.onBufferReset();
            mediaSource.removeEventListener('sourceopen', this._onMediaSourceOpen);
            mediaSource.removeEventListener('sourceended', this._onMediaSourceEnded);
            mediaSource.removeEventListener('sourceclose', this._onMediaSourceClose);
            if (this.appendSource) {
                mediaSource.removeEventListener('startstreaming', this._onStartStreaming);
                mediaSource.removeEventListener('endstreaming', this._onEndStreaming);
            }
            // Detach properly the MediaSource from the HTMLMediaElement as
            // suggested in https://github.com/w3c/media-source/issues/53.
            if (media) {
                media.removeEventListener('emptied', this._onMediaEmptied);
                if (_objectUrl) {
                    self.URL.revokeObjectURL(_objectUrl);
                }
                // clean up video tag src only if it's our own url. some external libraries might
                // hijack the video tag and change its 'src' without destroying the Hls instance first
                if (this.mediaSrc === _objectUrl) {
                    media.removeAttribute('src');
                    if (this.appendSource) {
                        removeSourceChildren(media);
                    }
                    media.load();
                }
                else {
                    this.warn('media|source.src was changed by a third party - skip cleanup');
                }
            }
            this.mediaSource = null;
            this.media = null;
            this._objectUrl = null;
            this.bufferCodecEventsExpected = this._bufferCodecEventsTotal;
            this.pendingTracks = {};
            this.tracks = {};
        }
        this.hls.trigger(events_1.Events.MEDIA_DETACHED, undefined);
    };
    BufferController.prototype.onBufferReset = function () {
        var _this = this;
        this.getSourceBufferTypes().forEach(function (type) {
            _this.resetBuffer(type);
        });
        this._initSourceBuffer();
        this.hls.resumeBuffering();
    };
    BufferController.prototype.resetBuffer = function (type) {
        var _a;
        var sb = this.sourceBuffer[type];
        try {
            if (sb) {
                this.removeBufferListeners(type);
                // Synchronously remove the SB from the map before the next call in order to prevent an async function from
                // accessing it
                this.sourceBuffer[type] = undefined;
                if ((_a = this.mediaSource) === null || _a === void 0 ? void 0 : _a.sourceBuffers.length) {
                    this.mediaSource.removeSourceBuffer(sb);
                }
            }
        }
        catch (err) {
            this.warn("onBufferReset ".concat(type), err);
        }
    };
    BufferController.prototype.onBufferCodecs = function (event, data) {
        var _this = this;
        var sourceBufferCount = this.getSourceBufferTypes().length;
        var trackNames = Object.keys(data);
        trackNames.forEach(function (trackName) {
            if (sourceBufferCount) {
                // check if SourceBuffer codec needs to change
                var track = _this.tracks[trackName];
                if (track && typeof track.buffer.changeType === 'function') {
                    var _a = data[trackName], id = _a.id, codec = _a.codec, levelCodec = _a.levelCodec, container = _a.container, metadata = _a.metadata;
                    var currentCodecFull = (0, codecs_1.pickMostCompleteCodecName)(track.codec, track.levelCodec);
                    var currentCodec = currentCodecFull === null || currentCodecFull === void 0 ? void 0 : currentCodecFull.replace(VIDEO_CODEC_PROFILE_REPLACE, '$1');
                    var trackCodec = (0, codecs_1.pickMostCompleteCodecName)(codec, levelCodec);
                    var nextCodec = trackCodec === null || trackCodec === void 0 ? void 0 : trackCodec.replace(VIDEO_CODEC_PROFILE_REPLACE, '$1');
                    if (trackCodec && currentCodec !== nextCodec) {
                        if (trackName.slice(0, 5) === 'audio') {
                            trackCodec = (0, codecs_1.getCodecCompatibleName)(trackCodec, _this.appendSource);
                        }
                        var mimeType = "".concat(container, ";codecs=").concat(trackCodec);
                        _this.appendChangeType(trackName, mimeType);
                        _this.log("switching codec ".concat(currentCodecFull, " to ").concat(trackCodec));
                        _this.tracks[trackName] = {
                            buffer: track.buffer,
                            codec: codec,
                            container: container,
                            levelCodec: levelCodec,
                            metadata: metadata,
                            id: id,
                        };
                    }
                }
            }
            else {
                // if source buffer(s) not created yet, appended buffer tracks in this.pendingTracks
                _this.pendingTracks[trackName] = data[trackName];
            }
        });
        // if sourcebuffers already created, do nothing ...
        if (sourceBufferCount) {
            return;
        }
        var bufferCodecEventsExpected = Math.max(this.bufferCodecEventsExpected - 1, 0);
        if (this.bufferCodecEventsExpected !== bufferCodecEventsExpected) {
            this.log("".concat(bufferCodecEventsExpected, " bufferCodec event(s) expected ").concat(trackNames.join(',')));
            this.bufferCodecEventsExpected = bufferCodecEventsExpected;
        }
        if (this.mediaSource && this.mediaSource.readyState === 'open') {
            this.checkPendingTracks();
        }
    };
    BufferController.prototype.appendChangeType = function (type, mimeType) {
        var _this = this;
        var operationQueue = this.operationQueue;
        var operation = {
            execute: function () {
                var sb = _this.sourceBuffer[type];
                if (sb) {
                    _this.log("changing ".concat(type, " sourceBuffer type to ").concat(mimeType));
                    sb.changeType(mimeType);
                }
                operationQueue.shiftAndExecuteNext(type);
            },
            onStart: function () { },
            onComplete: function () { },
            onError: function (error) {
                _this.warn("Failed to change ".concat(type, " SourceBuffer type"), error);
            },
        };
        operationQueue.append(operation, type, !!this.pendingTracks[type]);
    };
    BufferController.prototype.onBufferAppending = function (event, eventData) {
        var _this = this;
        var _a = this, hls = _a.hls, operationQueue = _a.operationQueue, tracks = _a.tracks;
        var data = eventData.data, type = eventData.type, frag = eventData.frag, part = eventData.part, chunkMeta = eventData.chunkMeta;
        var chunkStats = chunkMeta.buffering[type];
        var bufferAppendingStart = self.performance.now();
        chunkStats.start = bufferAppendingStart;
        var fragBuffering = frag.stats.buffering;
        var partBuffering = part ? part.stats.buffering : null;
        if (fragBuffering.start === 0) {
            fragBuffering.start = bufferAppendingStart;
        }
        if (partBuffering && partBuffering.start === 0) {
            partBuffering.start = bufferAppendingStart;
        }
        // TODO: Only update timestampOffset when audio/mpeg fragment or part is not contiguous with previously appended
        // Adjusting `SourceBuffer.timestampOffset` (desired point in the timeline where the next frames should be appended)
        // in Chrome browser when we detect MPEG audio container and time delta between level PTS and `SourceBuffer.timestampOffset`
        // is greater than 100ms (this is enough to handle seek for VOD or level change for LIVE videos).
        // More info here: https://github.com/video-dev/hls.js/issues/332#issuecomment-257986486
        var audioTrack = tracks.audio;
        var checkTimestampOffset = false;
        if (type === 'audio' && (audioTrack === null || audioTrack === void 0 ? void 0 : audioTrack.container) === 'audio/mpeg') {
            checkTimestampOffset =
                !this.lastMpegAudioChunk ||
                    chunkMeta.id === 1 ||
                    this.lastMpegAudioChunk.sn !== chunkMeta.sn;
            this.lastMpegAudioChunk = chunkMeta;
        }
        var fragStart = frag.start;
        var operation = {
            execute: function () {
                chunkStats.executeStart = self.performance.now();
                if (checkTimestampOffset) {
                    var sb = _this.sourceBuffer[type];
                    if (sb) {
                        var delta = fragStart - sb.timestampOffset;
                        if (Math.abs(delta) >= 0.1) {
                            _this.log("Updating audio SourceBuffer timestampOffset to ".concat(fragStart, " (delta: ").concat(delta, ") sn: ").concat(frag.sn, ")"));
                            sb.timestampOffset = fragStart;
                        }
                    }
                }
                _this.appendExecutor(data, type);
            },
            onStart: function () {
                // logger.debug(`[buffer-controller]: ${type} SourceBuffer updatestart`);
            },
            onComplete: function () {
                // logger.debug(`[buffer-controller]: ${type} SourceBuffer updateend`);
                var end = self.performance.now();
                chunkStats.executeEnd = chunkStats.end = end;
                if (fragBuffering.first === 0) {
                    fragBuffering.first = end;
                }
                if (partBuffering && partBuffering.first === 0) {
                    partBuffering.first = end;
                }
                var sourceBuffer = _this.sourceBuffer;
                var timeRanges = {};
                for (var type_1 in sourceBuffer) {
                    timeRanges[type_1] = buffer_helper_1.BufferHelper.getBuffered(sourceBuffer[type_1]);
                }
                _this.appendErrors[type] = 0;
                if (type === 'audio' || type === 'video') {
                    _this.appendErrors.audiovideo = 0;
                }
                else {
                    _this.appendErrors.audio = 0;
                    _this.appendErrors.video = 0;
                }
                _this.hls.trigger(events_1.Events.BUFFER_APPENDED, {
                    type: type,
                    frag: frag,
                    part: part,
                    chunkMeta: chunkMeta,
                    parent: frag.type,
                    timeRanges: timeRanges,
                });
            },
            onError: function (error) {
                // in case any error occured while appending, put back segment in segments table
                var event = {
                    type: errors_1.ErrorTypes.MEDIA_ERROR,
                    parent: frag.type,
                    details: errors_1.ErrorDetails.BUFFER_APPEND_ERROR,
                    sourceBufferName: type,
                    frag: frag,
                    part: part,
                    chunkMeta: chunkMeta,
                    error: error,
                    err: error,
                    fatal: false,
                };
                if (error.code === DOMException.QUOTA_EXCEEDED_ERR) {
                    // QuotaExceededError: http://www.w3.org/TR/html5/infrastructure.html#quotaexceedederror
                    // let's stop appending any segments, and report BUFFER_FULL_ERROR error
                    event.details = errors_1.ErrorDetails.BUFFER_FULL_ERROR;
                }
                else {
                    var appendErrorCount = ++_this.appendErrors[type];
                    event.details = errors_1.ErrorDetails.BUFFER_APPEND_ERROR;
                    /* with UHD content, we could get loop of quota exceeded error until
                      browser is able to evict some data from sourcebuffer. Retrying can help recover.
                    */
                    _this.warn("Failed ".concat(appendErrorCount, "/").concat(hls.config.appendErrorMaxRetry, " times to append segment in \"").concat(type, "\" sourceBuffer"));
                    if (appendErrorCount >= hls.config.appendErrorMaxRetry) {
                        event.fatal = true;
                    }
                }
                hls.trigger(events_1.Events.ERROR, event);
            },
        };
        operationQueue.append(operation, type, !!this.pendingTracks[type]);
    };
    BufferController.prototype.onBufferFlushing = function (event, data) {
        var _this = this;
        var operationQueue = this.operationQueue;
        var flushOperation = function (type) { return ({
            execute: _this.removeExecutor.bind(_this, type, data.startOffset, data.endOffset),
            onStart: function () {
                // logger.debug(`[buffer-controller]: Started flushing ${data.startOffset} -> ${data.endOffset} for ${type} Source Buffer`);
            },
            onComplete: function () {
                // logger.debug(`[buffer-controller]: Finished flushing ${data.startOffset} -> ${data.endOffset} for ${type} Source Buffer`);
                _this.hls.trigger(events_1.Events.BUFFER_FLUSHED, { type: type });
            },
            onError: function (error) {
                _this.warn("Failed to remove from ".concat(type, " SourceBuffer"), error);
            },
        }); };
        if (data.type) {
            operationQueue.append(flushOperation(data.type), data.type);
        }
        else {
            this.getSourceBufferTypes().forEach(function (type) {
                operationQueue.append(flushOperation(type), type);
            });
        }
    };
    BufferController.prototype.onFragParsed = function (event, data) {
        var _this = this;
        var frag = data.frag, part = data.part;
        var buffersAppendedTo = [];
        var elementaryStreams = part
            ? part.elementaryStreams
            : frag.elementaryStreams;
        if (elementaryStreams[fragment_1.ElementaryStreamTypes.AUDIOVIDEO]) {
            buffersAppendedTo.push('audiovideo');
        }
        else {
            if (elementaryStreams[fragment_1.ElementaryStreamTypes.AUDIO]) {
                buffersAppendedTo.push('audio');
            }
            if (elementaryStreams[fragment_1.ElementaryStreamTypes.VIDEO]) {
                buffersAppendedTo.push('video');
            }
        }
        var onUnblocked = function () {
            var now = self.performance.now();
            frag.stats.buffering.end = now;
            if (part) {
                part.stats.buffering.end = now;
            }
            var stats = part ? part.stats : frag.stats;
            _this.hls.trigger(events_1.Events.FRAG_BUFFERED, {
                frag: frag,
                part: part,
                stats: stats,
                id: frag.type,
            });
        };
        if (buffersAppendedTo.length === 0) {
            this.warn("Fragments must have at least one ElementaryStreamType set. type: ".concat(frag.type, " level: ").concat(frag.level, " sn: ").concat(frag.sn));
        }
        this.blockBuffers(onUnblocked, buffersAppendedTo);
    };
    BufferController.prototype.onFragChanged = function (event, data) {
        this.trimBuffers();
    };
    // on BUFFER_EOS mark matching sourcebuffer(s) as ended and trigger checkEos()
    // an undefined data.type will mark all buffers as EOS.
    BufferController.prototype.onBufferEos = function (event, data) {
        var _this = this;
        var ended = this.getSourceBufferTypes().reduce(function (acc, type) {
            var sb = _this.sourceBuffer[type];
            if (sb && (!data.type || data.type === type)) {
                sb.ending = true;
                if (!sb.ended) {
                    sb.ended = true;
                    _this.log("".concat(type, " sourceBuffer now EOS"));
                }
            }
            return acc && !!(!sb || sb.ended);
        }, true);
        if (ended) {
            this.log("Queueing mediaSource.endOfStream()");
            this.blockBuffers(function () {
                _this.getSourceBufferTypes().forEach(function (type) {
                    var sb = _this.sourceBuffer[type];
                    if (sb) {
                        sb.ending = false;
                    }
                });
                var mediaSource = _this.mediaSource;
                if (!mediaSource || mediaSource.readyState !== 'open') {
                    if (mediaSource) {
                        _this.log("Could not call mediaSource.endOfStream(). mediaSource.readyState: ".concat(mediaSource.readyState));
                    }
                    return;
                }
                _this.log("Calling mediaSource.endOfStream()");
                // Allow this to throw and be caught by the enqueueing function
                mediaSource.endOfStream();
            });
        }
    };
    BufferController.prototype.onLevelUpdated = function (event, _a) {
        var details = _a.details;
        if (!details.fragments.length) {
            return;
        }
        this.details = details;
        if (this.getSourceBufferTypes().length) {
            this.blockBuffers(this.updateMediaElementDuration.bind(this));
        }
        else {
            this.updateMediaElementDuration();
        }
    };
    BufferController.prototype.trimBuffers = function () {
        var _a = this, hls = _a.hls, details = _a.details, media = _a.media;
        if (!media || details === null) {
            return;
        }
        var sourceBufferTypes = this.getSourceBufferTypes();
        if (!sourceBufferTypes.length) {
            return;
        }
        var config = hls.config;
        var currentTime = media.currentTime;
        var targetDuration = details.levelTargetDuration;
        // Support for deprecated liveBackBufferLength
        var backBufferLength = details.live && config.liveBackBufferLength !== null
            ? config.liveBackBufferLength
            : config.backBufferLength;
        if (Number.isFinite(backBufferLength) && backBufferLength > 0) {
            var maxBackBufferLength = Math.max(backBufferLength, targetDuration);
            var targetBackBufferPosition = Math.floor(currentTime / targetDuration) * targetDuration -
                maxBackBufferLength;
            this.flushBackBuffer(currentTime, targetDuration, targetBackBufferPosition);
        }
        if (Number.isFinite(config.frontBufferFlushThreshold) &&
            config.frontBufferFlushThreshold > 0) {
            var frontBufferLength = Math.max(config.maxBufferLength, config.frontBufferFlushThreshold);
            var maxFrontBufferLength = Math.max(frontBufferLength, targetDuration);
            var targetFrontBufferPosition = Math.floor(currentTime / targetDuration) * targetDuration +
                maxFrontBufferLength;
            this.flushFrontBuffer(currentTime, targetDuration, targetFrontBufferPosition);
        }
    };
    BufferController.prototype.flushBackBuffer = function (currentTime, targetDuration, targetBackBufferPosition) {
        var _this = this;
        var _a = this, details = _a.details, sourceBuffer = _a.sourceBuffer;
        var sourceBufferTypes = this.getSourceBufferTypes();
        sourceBufferTypes.forEach(function (type) {
            var sb = sourceBuffer[type];
            if (sb) {
                var buffered = buffer_helper_1.BufferHelper.getBuffered(sb);
                // when target buffer start exceeds actual buffer start
                if (buffered.length > 0 &&
                    targetBackBufferPosition > buffered.start(0)) {
                    _this.hls.trigger(events_1.Events.BACK_BUFFER_REACHED, {
                        bufferEnd: targetBackBufferPosition,
                    });
                    // Support for deprecated event:
                    if (details === null || details === void 0 ? void 0 : details.live) {
                        _this.hls.trigger(events_1.Events.LIVE_BACK_BUFFER_REACHED, {
                            bufferEnd: targetBackBufferPosition,
                        });
                    }
                    else if (sb.ended &&
                        buffered.end(buffered.length - 1) - currentTime < targetDuration * 2) {
                        _this.log("Cannot flush ".concat(type, " back buffer while SourceBuffer is in ended state"));
                        return;
                    }
                    _this.hls.trigger(events_1.Events.BUFFER_FLUSHING, {
                        startOffset: 0,
                        endOffset: targetBackBufferPosition,
                        type: type,
                    });
                }
            }
        });
    };
    BufferController.prototype.flushFrontBuffer = function (currentTime, targetDuration, targetFrontBufferPosition) {
        var _this = this;
        var sourceBuffer = this.sourceBuffer;
        var sourceBufferTypes = this.getSourceBufferTypes();
        sourceBufferTypes.forEach(function (type) {
            var sb = sourceBuffer[type];
            if (sb) {
                var buffered = buffer_helper_1.BufferHelper.getBuffered(sb);
                var numBufferedRanges = buffered.length;
                // The buffer is either empty or contiguous
                if (numBufferedRanges < 2) {
                    return;
                }
                var bufferStart = buffered.start(numBufferedRanges - 1);
                var bufferEnd = buffered.end(numBufferedRanges - 1);
                // No flush if we can tolerate the current buffer length or the current buffer range we would flush is contiguous with current position
                if (targetFrontBufferPosition > bufferStart ||
                    (currentTime >= bufferStart && currentTime <= bufferEnd)) {
                    return;
                }
                else if (sb.ended && currentTime - bufferEnd < 2 * targetDuration) {
                    _this.log("Cannot flush ".concat(type, " front buffer while SourceBuffer is in ended state"));
                    return;
                }
                _this.hls.trigger(events_1.Events.BUFFER_FLUSHING, {
                    startOffset: bufferStart,
                    endOffset: Infinity,
                    type: type,
                });
            }
        });
    };
    /**
     * Update Media Source duration to current level duration or override to Infinity if configuration parameter
     * 'liveDurationInfinity` is set to `true`
     * More details: https://github.com/video-dev/hls.js/issues/355
     */
    BufferController.prototype.updateMediaElementDuration = function () {
        if (!this.details ||
            !this.media ||
            !this.mediaSource ||
            this.mediaSource.readyState !== 'open') {
            return;
        }
        var _a = this, details = _a.details, hls = _a.hls, media = _a.media, mediaSource = _a.mediaSource;
        var levelDuration = details.fragments[0].start + details.totalduration;
        var mediaDuration = media.duration;
        var msDuration = Number.isFinite(mediaSource.duration)
            ? mediaSource.duration
            : 0;
        if (details.live && hls.config.liveDurationInfinity) {
            // Override duration to Infinity
            mediaSource.duration = Infinity;
            this.updateSeekableRange(details);
        }
        else if ((levelDuration > msDuration && levelDuration > mediaDuration) ||
            !Number.isFinite(mediaDuration)) {
            // levelDuration was the last value we set.
            // not using mediaSource.duration as the browser may tweak this value
            // only update Media Source duration if its value increase, this is to avoid
            // flushing already buffered portion when switching between quality level
            this.log("Updating Media Source duration to ".concat(levelDuration.toFixed(3)));
            mediaSource.duration = levelDuration;
        }
    };
    BufferController.prototype.updateSeekableRange = function (levelDetails) {
        var mediaSource = this.mediaSource;
        var fragments = levelDetails.fragments;
        var len = fragments.length;
        if (len && levelDetails.live && (mediaSource === null || mediaSource === void 0 ? void 0 : mediaSource.setLiveSeekableRange)) {
            var start = Math.max(0, fragments[0].start);
            var end = Math.max(start, start + levelDetails.totalduration);
            this.log("Media Source duration is set to ".concat(mediaSource.duration, ". Setting seekable range to ").concat(start, "-").concat(end, "."));
            mediaSource.setLiveSeekableRange(start, end);
        }
    };
    BufferController.prototype.checkPendingTracks = function () {
        var _a = this, bufferCodecEventsExpected = _a.bufferCodecEventsExpected, operationQueue = _a.operationQueue, pendingTracks = _a.pendingTracks;
        // Check if we've received all of the expected bufferCodec events. When none remain, create all the sourceBuffers at once.
        // This is important because the MSE spec allows implementations to throw QuotaExceededErrors if creating new sourceBuffers after
        // data has been appended to existing ones.
        // 2 tracks is the max (one for audio, one for video). If we've reach this max go ahead and create the buffers.
        var pendingTracksCount = Object.keys(pendingTracks).length;
        if (pendingTracksCount &&
            (!bufferCodecEventsExpected ||
                pendingTracksCount === 2 ||
                'audiovideo' in pendingTracks)) {
            // ok, let's create them now !
            this.createSourceBuffers(pendingTracks);
            this.pendingTracks = {};
            // append any pending segments now !
            var buffers = this.getSourceBufferTypes();
            if (buffers.length) {
                this.hls.trigger(events_1.Events.BUFFER_CREATED, { tracks: this.tracks });
                buffers.forEach(function (type) {
                    operationQueue.executeNext(type);
                });
            }
            else {
                var error = new Error('could not create source buffer for media codec(s)');
                this.hls.trigger(events_1.Events.ERROR, {
                    type: errors_1.ErrorTypes.MEDIA_ERROR,
                    details: errors_1.ErrorDetails.BUFFER_INCOMPATIBLE_CODECS_ERROR,
                    fatal: true,
                    error: error,
                    reason: error.message,
                });
            }
        }
    };
    BufferController.prototype.createSourceBuffers = function (tracks) {
        var _this = this;
        var _a;
        var _b = this, sourceBuffer = _b.sourceBuffer, mediaSource = _b.mediaSource;
        if (!mediaSource) {
            throw Error('createSourceBuffers called when mediaSource was null');
        }
        var _loop_1 = function (trackName) {
            if (!sourceBuffer[trackName]) {
                var track = tracks[trackName];
                if (!track) {
                    throw Error("source buffer exists for track ".concat(trackName, ", however track does not"));
                }
                // use levelCodec as first priority unless it contains multiple comma-separated codec values
                var codec = ((_a = track.levelCodec) === null || _a === void 0 ? void 0 : _a.indexOf(',')) === -1
                    ? track.levelCodec
                    : track.codec;
                if (codec) {
                    if (trackName.slice(0, 5) === 'audio') {
                        codec = (0, codecs_1.getCodecCompatibleName)(codec, this_1.appendSource);
                    }
                }
                var mimeType = "".concat(track.container, ";codecs=").concat(codec);
                this_1.log("creating sourceBuffer(".concat(mimeType, ")"));
                try {
                    var sb = (sourceBuffer[trackName] =
                        mediaSource.addSourceBuffer(mimeType));
                    var sbName = trackName;
                    this_1.addBufferListener(sbName, 'updatestart', this_1._onSBUpdateStart);
                    this_1.addBufferListener(sbName, 'updateend', this_1._onSBUpdateEnd);
                    this_1.addBufferListener(sbName, 'error', this_1._onSBUpdateError);
                    // ManagedSourceBuffer bufferedchange event
                    if (this_1.appendSource) {
                        this_1.addBufferListener(sbName, 'bufferedchange', function (type, event) {
                            // If media was ejected check for a change. Added ranges are redundant with changes on 'updateend' event.
                            var removedRanges = event.removedRanges;
                            if (removedRanges === null || removedRanges === void 0 ? void 0 : removedRanges.length) {
                                _this.hls.trigger(events_1.Events.BUFFER_FLUSHED, {
                                    type: trackName,
                                });
                            }
                        });
                    }
                    this_1.tracks[trackName] = {
                        buffer: sb,
                        codec: codec,
                        container: track.container,
                        levelCodec: track.levelCodec,
                        metadata: track.metadata,
                        id: track.id,
                    };
                }
                catch (err) {
                    this_1.error("error while trying to add sourceBuffer: ".concat(err.message));
                    this_1.hls.trigger(events_1.Events.ERROR, {
                        type: errors_1.ErrorTypes.MEDIA_ERROR,
                        details: errors_1.ErrorDetails.BUFFER_ADD_CODEC_ERROR,
                        fatal: false,
                        error: err,
                        sourceBufferName: trackName,
                        mimeType: mimeType,
                    });
                }
            }
        };
        var this_1 = this;
        for (var trackName in tracks) {
            _loop_1(trackName);
        }
    };
    Object.defineProperty(BufferController.prototype, "mediaSrc", {
        get: function () {
            var _a, _b;
            var media = ((_b = (_a = this.media) === null || _a === void 0 ? void 0 : _a.querySelector) === null || _b === void 0 ? void 0 : _b.call(_a, 'source')) || this.media;
            return media === null || media === void 0 ? void 0 : media.src;
        },
        enumerable: false,
        configurable: true
    });
    BufferController.prototype._onSBUpdateStart = function (type) {
        var operationQueue = this.operationQueue;
        var operation = operationQueue.current(type);
        operation.onStart();
    };
    BufferController.prototype._onSBUpdateEnd = function (type) {
        var _a;
        if (((_a = this.mediaSource) === null || _a === void 0 ? void 0 : _a.readyState) === 'closed') {
            this.resetBuffer(type);
            return;
        }
        var operationQueue = this.operationQueue;
        var operation = operationQueue.current(type);
        operation.onComplete();
        operationQueue.shiftAndExecuteNext(type);
    };
    BufferController.prototype._onSBUpdateError = function (type, event) {
        var _a;
        var error = new Error("".concat(type, " SourceBuffer error. MediaSource readyState: ").concat((_a = this.mediaSource) === null || _a === void 0 ? void 0 : _a.readyState));
        this.error("".concat(error), event);
        // according to http://www.w3.org/TR/media-source/#sourcebuffer-append-error
        // SourceBuffer errors are not necessarily fatal; if so, the HTMLMediaElement will fire an error event
        this.hls.trigger(events_1.Events.ERROR, {
            type: errors_1.ErrorTypes.MEDIA_ERROR,
            details: errors_1.ErrorDetails.BUFFER_APPENDING_ERROR,
            sourceBufferName: type,
            error: error,
            fatal: false,
        });
        // updateend is always fired after error, so we'll allow that to shift the current operation off of the queue
        var operation = this.operationQueue.current(type);
        if (operation) {
            operation.onError(error);
        }
    };
    // This method must result in an updateend event; if remove is not called, _onSBUpdateEnd must be called manually
    BufferController.prototype.removeExecutor = function (type, startOffset, endOffset) {
        var _a = this, media = _a.media, mediaSource = _a.mediaSource, operationQueue = _a.operationQueue, sourceBuffer = _a.sourceBuffer;
        var sb = sourceBuffer[type];
        if (!media || !mediaSource || !sb) {
            this.warn("Attempting to remove from the ".concat(type, " SourceBuffer, but it does not exist"));
            operationQueue.shiftAndExecuteNext(type);
            return;
        }
        var mediaDuration = Number.isFinite(media.duration)
            ? media.duration
            : Infinity;
        var msDuration = Number.isFinite(mediaSource.duration)
            ? mediaSource.duration
            : Infinity;
        var removeStart = Math.max(0, startOffset);
        var removeEnd = Math.min(endOffset, mediaDuration, msDuration);
        if (removeEnd > removeStart && (!sb.ending || sb.ended)) {
            sb.ended = false;
            this.log("Removing [".concat(removeStart, ",").concat(removeEnd, "] from the ").concat(type, " SourceBuffer"));
            sb.remove(removeStart, removeEnd);
        }
        else {
            // Cycle the queue
            operationQueue.shiftAndExecuteNext(type);
        }
    };
    // This method must result in an updateend event; if append is not called, _onSBUpdateEnd must be called manually
    BufferController.prototype.appendExecutor = function (data, type) {
        var sb = this.sourceBuffer[type];
        if (!sb) {
            if (!this.pendingTracks[type]) {
                throw new Error("Attempting to append to the ".concat(type, " SourceBuffer, but it does not exist"));
            }
            return;
        }
        sb.ended = false;
        sb.appendBuffer(data);
    };
    // Enqueues an operation to each SourceBuffer queue which, upon execution, resolves a promise. When all promises
    // resolve, the onUnblocked function is executed. Functions calling this method do not need to unblock the queue
    // upon completion, since we already do it here
    BufferController.prototype.blockBuffers = function (onUnblocked, buffers) {
        var _this = this;
        if (buffers === void 0) { buffers = this.getSourceBufferTypes(); }
        if (!buffers.length) {
            this.log('Blocking operation requested, but no SourceBuffers exist');
            Promise.resolve().then(onUnblocked);
            return;
        }
        var operationQueue = this.operationQueue;
        // logger.debug(`[buffer-controller]: Blocking ${buffers} SourceBuffer`);
        var blockingOperations = buffers.map(function (type) {
            return operationQueue.appendBlocker(type);
        });
        Promise.all(blockingOperations).then(function () {
            // logger.debug(`[buffer-controller]: Blocking operation resolved; unblocking ${buffers} SourceBuffer`);
            onUnblocked();
            buffers.forEach(function (type) {
                var sb = _this.sourceBuffer[type];
                // Only cycle the queue if the SB is not updating. There's a bug in Chrome which sets the SB updating flag to
                // true when changing the MediaSource duration (https://bugs.chromium.org/p/chromium/issues/detail?id=959359&can=2&q=mediasource%20duration)
                // While this is a workaround, it's probably useful to have around
                if (!(sb === null || sb === void 0 ? void 0 : sb.updating)) {
                    operationQueue.shiftAndExecuteNext(type);
                }
            });
        });
    };
    BufferController.prototype.getSourceBufferTypes = function () {
        return Object.keys(this.sourceBuffer);
    };
    BufferController.prototype.addBufferListener = function (type, event, fn) {
        var buffer = this.sourceBuffer[type];
        if (!buffer) {
            return;
        }
        var listener = fn.bind(this, type);
        this.listeners[type].push({ event: event, listener: listener });
        buffer.addEventListener(event, listener);
    };
    BufferController.prototype.removeBufferListeners = function (type) {
        var buffer = this.sourceBuffer[type];
        if (!buffer) {
            return;
        }
        this.listeners[type].forEach(function (l) {
            buffer.removeEventListener(l.event, l.listener);
        });
    };
    return BufferController;
}());
exports.default = BufferController;
function removeSourceChildren(node) {
    var sourceChildren = node.querySelectorAll('source');
    [].slice.call(sourceChildren).forEach(function (source) {
        node.removeChild(source);
    });
}
function addSource(media, url) {
    var source = self.document.createElement('source');
    source.type = 'video/mp4';
    source.src = url;
    media.appendChild(source);
}
