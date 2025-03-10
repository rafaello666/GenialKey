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
exports.State = void 0;
var task_loop_1 = require("../task-loop");
var fragment_tracker_1 = require("./fragment-tracker");
var buffer_helper_1 = require("../utils/buffer-helper");
var logger_1 = require("../utils/logger");
var events_1 = require("../events");
var errors_1 = require("../errors");
var transmuxer_1 = require("../types/transmuxer");
var mp4_tools_1 = require("../utils/mp4-tools");
var discontinuities_1 = require("../utils/discontinuities");
var fragment_finders_1 = require("./fragment-finders");
var level_helper_1 = require("../utils/level-helper");
var fragment_loader_1 = require("../loader/fragment-loader");
var decrypter_1 = require("../crypt/decrypter");
var time_ranges_1 = require("../utils/time-ranges");
var loader_1 = require("../types/loader");
var error_helper_1 = require("../utils/error-helper");
exports.State = {
    STOPPED: 'STOPPED',
    IDLE: 'IDLE',
    KEY_LOADING: 'KEY_LOADING',
    FRAG_LOADING: 'FRAG_LOADING',
    FRAG_LOADING_WAITING_RETRY: 'FRAG_LOADING_WAITING_RETRY',
    WAITING_TRACK: 'WAITING_TRACK',
    PARSING: 'PARSING',
    PARSED: 'PARSED',
    ENDED: 'ENDED',
    ERROR: 'ERROR',
    WAITING_INIT_PTS: 'WAITING_INIT_PTS',
    WAITING_LEVEL: 'WAITING_LEVEL',
};
var BaseStreamController = /** @class */ (function (_super) {
    __extends(BaseStreamController, _super);
    function BaseStreamController(hls, fragmentTracker, keyLoader, logPrefix, playlistType) {
        var _this = _super.call(this) || this;
        _this.fragPrevious = null;
        _this.fragCurrent = null;
        _this.transmuxer = null;
        _this._state = exports.State.STOPPED;
        _this.media = null;
        _this.mediaBuffer = null;
        _this.bitrateTest = false;
        _this.lastCurrentTime = 0;
        _this.nextLoadPosition = 0;
        _this.startPosition = 0;
        _this.startTimeOffset = null;
        _this.loadedmetadata = false;
        _this.retryDate = 0;
        _this.levels = null;
        _this.levelLastLoaded = null;
        _this.startFragRequested = false;
        _this.initPTS = [];
        _this.buffering = true;
        _this.onvseeking = null;
        _this.onvended = null;
        _this.logPrefix = '';
        _this.playlistType = playlistType;
        _this.logPrefix = logPrefix;
        _this.log = logger_1.logger.log.bind(logger_1.logger, "".concat(logPrefix, ":"));
        _this.warn = logger_1.logger.warn.bind(logger_1.logger, "".concat(logPrefix, ":"));
        _this.hls = hls;
        _this.fragmentLoader = new fragment_loader_1.default(hls.config);
        _this.keyLoader = keyLoader;
        _this.fragmentTracker = fragmentTracker;
        _this.config = hls.config;
        _this.decrypter = new decrypter_1.default(hls.config);
        hls.on(events_1.Events.MANIFEST_LOADED, _this.onManifestLoaded, _this);
        return _this;
    }
    BaseStreamController.prototype.doTick = function () {
        this.onTickEnd();
    };
    BaseStreamController.prototype.onTickEnd = function () { };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    BaseStreamController.prototype.startLoad = function (startPosition) { };
    BaseStreamController.prototype.stopLoad = function () {
        this.fragmentLoader.abort();
        this.keyLoader.abort(this.playlistType);
        var frag = this.fragCurrent;
        if (frag === null || frag === void 0 ? void 0 : frag.loader) {
            frag.abortRequests();
            this.fragmentTracker.removeFragment(frag);
        }
        this.resetTransmuxer();
        this.fragCurrent = null;
        this.fragPrevious = null;
        this.clearInterval();
        this.clearNextTick();
        this.state = exports.State.STOPPED;
    };
    BaseStreamController.prototype.pauseBuffering = function () {
        this.buffering = false;
    };
    BaseStreamController.prototype.resumeBuffering = function () {
        this.buffering = true;
    };
    BaseStreamController.prototype._streamEnded = function (bufferInfo, levelDetails) {
        // If playlist is live, there is another buffered range after the current range, nothing buffered, media is detached,
        // of nothing loading/loaded return false
        if (levelDetails.live ||
            bufferInfo.nextStart ||
            !bufferInfo.end ||
            !this.media) {
            return false;
        }
        var partList = levelDetails.partList;
        // Since the last part isn't guaranteed to correspond to the last playlist segment for Low-Latency HLS,
        // check instead if the last part is buffered.
        if (partList === null || partList === void 0 ? void 0 : partList.length) {
            var lastPart = partList[partList.length - 1];
            // Checking the midpoint of the part for potential margin of error and related issues.
            // NOTE: Technically I believe parts could yield content that is < the computed duration (including potential a duration of 0)
            // and still be spec-compliant, so there may still be edge cases here. Likewise, there could be issues in end of stream
            // part mismatches for independent audio and video playlists/segments.
            var lastPartBuffered = buffer_helper_1.BufferHelper.isBuffered(this.media, lastPart.start + lastPart.duration / 2);
            return lastPartBuffered;
        }
        var playlistType = levelDetails.fragments[levelDetails.fragments.length - 1].type;
        return this.fragmentTracker.isEndListAppended(playlistType);
    };
    BaseStreamController.prototype.getLevelDetails = function () {
        var _a;
        if (this.levels && this.levelLastLoaded !== null) {
            return (_a = this.levelLastLoaded) === null || _a === void 0 ? void 0 : _a.details;
        }
    };
    BaseStreamController.prototype.onMediaAttached = function (event, data) {
        var media = (this.media = this.mediaBuffer = data.media);
        this.onvseeking = this.onMediaSeeking.bind(this);
        this.onvended = this.onMediaEnded.bind(this);
        media.addEventListener('seeking', this.onvseeking);
        media.addEventListener('ended', this.onvended);
        var config = this.config;
        if (this.levels && config.autoStartLoad && this.state === exports.State.STOPPED) {
            this.startLoad(config.startPosition);
        }
    };
    BaseStreamController.prototype.onMediaDetaching = function () {
        var media = this.media;
        if (media === null || media === void 0 ? void 0 : media.ended) {
            this.log('MSE detaching and video ended, reset startPosition');
            this.startPosition = this.lastCurrentTime = 0;
        }
        // remove video listeners
        if (media && this.onvseeking && this.onvended) {
            media.removeEventListener('seeking', this.onvseeking);
            media.removeEventListener('ended', this.onvended);
            this.onvseeking = this.onvended = null;
        }
        if (this.keyLoader) {
            this.keyLoader.detach();
        }
        this.media = this.mediaBuffer = null;
        this.loadedmetadata = false;
        this.fragmentTracker.removeAllFragments();
        this.stopLoad();
    };
    BaseStreamController.prototype.onMediaSeeking = function () {
        var _a = this, config = _a.config, fragCurrent = _a.fragCurrent, media = _a.media, mediaBuffer = _a.mediaBuffer, state = _a.state;
        var currentTime = media ? media.currentTime : 0;
        var bufferInfo = buffer_helper_1.BufferHelper.bufferInfo(mediaBuffer ? mediaBuffer : media, currentTime, config.maxBufferHole);
        this.log("media seeking to ".concat(Number.isFinite(currentTime) ? currentTime.toFixed(3) : currentTime, ", state: ").concat(state));
        if (this.state === exports.State.ENDED) {
            this.resetLoadingState();
        }
        else if (fragCurrent) {
            // Seeking while frag load is in progress
            var tolerance = config.maxFragLookUpTolerance;
            var fragStartOffset = fragCurrent.start - tolerance;
            var fragEndOffset = fragCurrent.start + fragCurrent.duration + tolerance;
            // if seeking out of buffered range or into new one
            if (!bufferInfo.len ||
                fragEndOffset < bufferInfo.start ||
                fragStartOffset > bufferInfo.end) {
                var pastFragment = currentTime > fragEndOffset;
                // if the seek position is outside the current fragment range
                if (currentTime < fragStartOffset || pastFragment) {
                    if (pastFragment && fragCurrent.loader) {
                        this.log('seeking outside of buffer while fragment load in progress, cancel fragment load');
                        fragCurrent.abortRequests();
                        this.resetLoadingState();
                    }
                    this.fragPrevious = null;
                }
            }
        }
        if (media) {
            // Remove gap fragments
            this.fragmentTracker.removeFragmentsInRange(currentTime, Infinity, this.playlistType, true);
            this.lastCurrentTime = currentTime;
        }
        // in case seeking occurs although no media buffered, adjust startPosition and nextLoadPosition to seek target
        if (!this.loadedmetadata && !bufferInfo.len) {
            this.nextLoadPosition = this.startPosition = currentTime;
        }
        // Async tick to speed up processing
        this.tickImmediate();
    };
    BaseStreamController.prototype.onMediaEnded = function () {
        // reset startPosition and lastCurrentTime to restart playback @ stream beginning
        this.startPosition = this.lastCurrentTime = 0;
    };
    BaseStreamController.prototype.onManifestLoaded = function (event, data) {
        this.startTimeOffset = data.startTimeOffset;
        this.initPTS = [];
    };
    BaseStreamController.prototype.onHandlerDestroying = function () {
        this.hls.off(events_1.Events.MANIFEST_LOADED, this.onManifestLoaded, this);
        this.stopLoad();
        _super.prototype.onHandlerDestroying.call(this);
        // @ts-ignore
        this.hls = null;
    };
    BaseStreamController.prototype.onHandlerDestroyed = function () {
        this.state = exports.State.STOPPED;
        if (this.fragmentLoader) {
            this.fragmentLoader.destroy();
        }
        if (this.keyLoader) {
            this.keyLoader.destroy();
        }
        if (this.decrypter) {
            this.decrypter.destroy();
        }
        this.hls =
            this.log =
                this.warn =
                    this.decrypter =
                        this.keyLoader =
                            this.fragmentLoader =
                                this.fragmentTracker =
                                    null;
        _super.prototype.onHandlerDestroyed.call(this);
    };
    BaseStreamController.prototype.loadFragment = function (frag, level, targetBufferTime) {
        this._loadFragForPlayback(frag, level, targetBufferTime);
    };
    BaseStreamController.prototype._loadFragForPlayback = function (frag, level, targetBufferTime) {
        var _this = this;
        var progressCallback = function (data) {
            if (_this.fragContextChanged(frag)) {
                _this.warn("Fragment ".concat(frag.sn).concat(data.part ? ' p: ' + data.part.index : '', " of level ").concat(frag.level, " was dropped during download."));
                _this.fragmentTracker.removeFragment(frag);
                return;
            }
            frag.stats.chunkCount++;
            _this._handleFragmentLoadProgress(data);
        };
        this._doFragLoad(frag, level, targetBufferTime, progressCallback)
            .then(function (data) {
            if (!data) {
                // if we're here we probably needed to backtrack or are waiting for more parts
                return;
            }
            var state = _this.state;
            if (_this.fragContextChanged(frag)) {
                if (state === exports.State.FRAG_LOADING ||
                    (!_this.fragCurrent && state === exports.State.PARSING)) {
                    _this.fragmentTracker.removeFragment(frag);
                    _this.state = exports.State.IDLE;
                }
                return;
            }
            if ('payload' in data) {
                _this.log("Loaded fragment ".concat(frag.sn, " of level ").concat(frag.level));
                _this.hls.trigger(events_1.Events.FRAG_LOADED, data);
            }
            // Pass through the whole payload; controllers not implementing progressive loading receive data from this callback
            _this._handleFragmentLoadComplete(data);
        })
            .catch(function (reason) {
            if (_this.state === exports.State.STOPPED || _this.state === exports.State.ERROR) {
                return;
            }
            _this.warn("Frag error: ".concat((reason === null || reason === void 0 ? void 0 : reason.message) || reason));
            _this.resetFragmentLoading(frag);
        });
    };
    BaseStreamController.prototype.clearTrackerIfNeeded = function (frag) {
        var _a;
        var fragmentTracker = this.fragmentTracker;
        var fragState = fragmentTracker.getState(frag);
        if (fragState === fragment_tracker_1.FragmentState.APPENDING) {
            // Lower the max buffer length and try again
            var playlistType = frag.type;
            var bufferedInfo = this.getFwdBufferInfo(this.mediaBuffer, playlistType);
            var minForwardBufferLength = Math.max(frag.duration, bufferedInfo ? bufferedInfo.len : this.config.maxBufferLength);
            // If backtracking, always remove from the tracker without reducing max buffer length
            var backtrackFragment = this.backtrackFragment;
            var backtracked = backtrackFragment
                ? frag.sn - backtrackFragment.sn
                : 0;
            if (backtracked === 1 ||
                this.reduceMaxBufferLength(minForwardBufferLength, frag.duration)) {
                fragmentTracker.removeFragment(frag);
            }
        }
        else if (((_a = this.mediaBuffer) === null || _a === void 0 ? void 0 : _a.buffered.length) === 0) {
            // Stop gap for bad tracker / buffer flush behavior
            fragmentTracker.removeAllFragments();
        }
        else if (fragmentTracker.hasParts(frag.type)) {
            // In low latency mode, remove fragments for which only some parts were buffered
            fragmentTracker.detectPartialFragments({
                frag: frag,
                part: null,
                stats: frag.stats,
                id: frag.type,
            });
            if (fragmentTracker.getState(frag) === fragment_tracker_1.FragmentState.PARTIAL) {
                fragmentTracker.removeFragment(frag);
            }
        }
    };
    BaseStreamController.prototype.checkLiveUpdate = function (details) {
        if (details.updated && !details.live) {
            // Live stream ended, update fragment tracker
            var lastFragment = details.fragments[details.fragments.length - 1];
            this.fragmentTracker.detectPartialFragments({
                frag: lastFragment,
                part: null,
                stats: lastFragment.stats,
                id: lastFragment.type,
            });
        }
        if (!details.fragments[0]) {
            details.deltaUpdateFailed = true;
        }
    };
    BaseStreamController.prototype.flushMainBuffer = function (startOffset, endOffset, type) {
        if (type === void 0) { type = null; }
        if (!(startOffset - endOffset)) {
            return;
        }
        // When alternate audio is playing, the audio-stream-controller is responsible for the audio buffer. Otherwise,
        // passing a null type flushes both buffers
        var flushScope = { startOffset: startOffset, endOffset: endOffset, type: type };
        this.hls.trigger(events_1.Events.BUFFER_FLUSHING, flushScope);
    };
    BaseStreamController.prototype._loadInitSegment = function (frag, level) {
        var _this = this;
        this._doFragLoad(frag, level)
            .then(function (data) {
            if (!data || _this.fragContextChanged(frag) || !_this.levels) {
                throw new Error('init load aborted');
            }
            return data;
        })
            .then(function (data) {
            var hls = _this.hls;
            var payload = data.payload;
            var decryptData = frag.decryptdata;
            // check to see if the payload needs to be decrypted
            if (payload &&
                payload.byteLength > 0 &&
                (decryptData === null || decryptData === void 0 ? void 0 : decryptData.key) &&
                decryptData.iv &&
                decryptData.method === 'AES-128') {
                var startTime_1 = self.performance.now();
                // decrypt init segment data
                return _this.decrypter
                    .decrypt(new Uint8Array(payload), decryptData.key.buffer, decryptData.iv.buffer)
                    .catch(function (err) {
                    hls.trigger(events_1.Events.ERROR, {
                        type: errors_1.ErrorTypes.MEDIA_ERROR,
                        details: errors_1.ErrorDetails.FRAG_DECRYPT_ERROR,
                        fatal: false,
                        error: err,
                        reason: err.message,
                        frag: frag,
                    });
                    throw err;
                })
                    .then(function (decryptedData) {
                    var endTime = self.performance.now();
                    hls.trigger(events_1.Events.FRAG_DECRYPTED, {
                        frag: frag,
                        payload: decryptedData,
                        stats: {
                            tstart: startTime_1,
                            tdecrypt: endTime,
                        },
                    });
                    data.payload = decryptedData;
                    return _this.completeInitSegmentLoad(data);
                });
            }
            return _this.completeInitSegmentLoad(data);
        })
            .catch(function (reason) {
            if (_this.state === exports.State.STOPPED || _this.state === exports.State.ERROR) {
                return;
            }
            _this.warn(reason);
            _this.resetFragmentLoading(frag);
        });
    };
    BaseStreamController.prototype.completeInitSegmentLoad = function (data) {
        var levels = this.levels;
        if (!levels) {
            throw new Error('init load aborted, missing levels');
        }
        var stats = data.frag.stats;
        this.state = exports.State.IDLE;
        data.frag.data = new Uint8Array(data.payload);
        stats.parsing.start = stats.buffering.start = self.performance.now();
        stats.parsing.end = stats.buffering.end = self.performance.now();
        this.tick();
    };
    BaseStreamController.prototype.fragContextChanged = function (frag) {
        var fragCurrent = this.fragCurrent;
        return (!frag ||
            !fragCurrent ||
            frag.sn !== fragCurrent.sn ||
            frag.level !== fragCurrent.level);
    };
    BaseStreamController.prototype.fragBufferedComplete = function (frag, part) {
        var _a, _b, _c, _d, _e;
        var media = this.mediaBuffer ? this.mediaBuffer : this.media;
        this.log("Buffered ".concat(frag.type, " sn: ").concat(frag.sn).concat(part ? ' part: ' + part.index : '', " of ").concat(this.playlistType === loader_1.PlaylistLevelType.MAIN ? 'level' : 'track', " ").concat(frag.level, " (frag:[").concat(((_a = frag.startPTS) !== null && _a !== void 0 ? _a : NaN).toFixed(3), "-").concat(((_b = frag.endPTS) !== null && _b !== void 0 ? _b : NaN).toFixed(3), "] > buffer:").concat(media
            ? time_ranges_1.default.toString(buffer_helper_1.BufferHelper.getBuffered(media))
            : '(detached)', ")"));
        if (frag.sn !== 'initSegment') {
            if (frag.type !== loader_1.PlaylistLevelType.SUBTITLE) {
                var el_1 = frag.elementaryStreams;
                if (!Object.keys(el_1).some(function (type) { return !!el_1[type]; })) {
                    // empty segment
                    this.state = exports.State.IDLE;
                    return;
                }
            }
            var level = (_c = this.levels) === null || _c === void 0 ? void 0 : _c[frag.level];
            if (level === null || level === void 0 ? void 0 : level.fragmentError) {
                this.log("Resetting level fragment error count of ".concat(level.fragmentError, " on frag buffered"));
                level.fragmentError = 0;
            }
        }
        this.state = exports.State.IDLE;
        if (!media) {
            return;
        }
        if (!this.loadedmetadata &&
            frag.type == loader_1.PlaylistLevelType.MAIN &&
            media.buffered.length &&
            ((_d = this.fragCurrent) === null || _d === void 0 ? void 0 : _d.sn) === ((_e = this.fragPrevious) === null || _e === void 0 ? void 0 : _e.sn)) {
            this.loadedmetadata = true;
            this.seekToStartPos();
        }
        this.tick();
    };
    BaseStreamController.prototype.seekToStartPos = function () { };
    BaseStreamController.prototype._handleFragmentLoadComplete = function (fragLoadedEndData) {
        var transmuxer = this.transmuxer;
        if (!transmuxer) {
            return;
        }
        var frag = fragLoadedEndData.frag, part = fragLoadedEndData.part, partsLoaded = fragLoadedEndData.partsLoaded;
        // If we did not load parts, or loaded all parts, we have complete (not partial) fragment data
        var complete = !partsLoaded ||
            partsLoaded.length === 0 ||
            partsLoaded.some(function (fragLoaded) { return !fragLoaded; });
        var chunkMeta = new transmuxer_1.ChunkMetadata(frag.level, frag.sn, frag.stats.chunkCount + 1, 0, part ? part.index : -1, !complete);
        transmuxer.flush(chunkMeta);
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    BaseStreamController.prototype._handleFragmentLoadProgress = function (frag) { };
    BaseStreamController.prototype._doFragLoad = function (frag, level, targetBufferTime, progressCallback) {
        var _this = this;
        var _a;
        if (targetBufferTime === void 0) { targetBufferTime = null; }
        var details = level === null || level === void 0 ? void 0 : level.details;
        if (!this.levels || !details) {
            throw new Error("frag load aborted, missing level".concat(details ? '' : ' detail', "s"));
        }
        var keyLoadingPromise = null;
        if (frag.encrypted && !((_a = frag.decryptdata) === null || _a === void 0 ? void 0 : _a.key)) {
            this.log("Loading key for ".concat(frag.sn, " of [").concat(details.startSN, "-").concat(details.endSN, "], ").concat(this.logPrefix === '[stream-controller]' ? 'level' : 'track', " ").concat(frag.level));
            this.state = exports.State.KEY_LOADING;
            this.fragCurrent = frag;
            keyLoadingPromise = this.keyLoader.load(frag).then(function (keyLoadedData) {
                if (!_this.fragContextChanged(keyLoadedData.frag)) {
                    _this.hls.trigger(events_1.Events.KEY_LOADED, keyLoadedData);
                    if (_this.state === exports.State.KEY_LOADING) {
                        _this.state = exports.State.IDLE;
                    }
                    return keyLoadedData;
                }
            });
            this.hls.trigger(events_1.Events.KEY_LOADING, { frag: frag });
            if (this.fragCurrent === null) {
                keyLoadingPromise = Promise.reject(new Error("frag load aborted, context changed in KEY_LOADING"));
            }
        }
        else if (!frag.encrypted && details.encryptedFragments.length) {
            this.keyLoader.loadClear(frag, details.encryptedFragments);
        }
        targetBufferTime = Math.max(frag.start, targetBufferTime || 0);
        if (this.config.lowLatencyMode && frag.sn !== 'initSegment') {
            var partList = details.partList;
            if (partList && progressCallback) {
                if (targetBufferTime > frag.end && details.fragmentHint) {
                    frag = details.fragmentHint;
                }
                var partIndex = this.getNextPart(partList, frag, targetBufferTime);
                if (partIndex > -1) {
                    var part_1 = partList[partIndex];
                    this.log("Loading part sn: ".concat(frag.sn, " p: ").concat(part_1.index, " cc: ").concat(frag.cc, " of playlist [").concat(details.startSN, "-").concat(details.endSN, "] parts [0-").concat(partIndex, "-").concat(partList.length - 1, "] ").concat(this.logPrefix === '[stream-controller]' ? 'level' : 'track', ": ").concat(frag.level, ", target: ").concat(parseFloat(targetBufferTime.toFixed(3))));
                    this.nextLoadPosition = part_1.start + part_1.duration;
                    this.state = exports.State.FRAG_LOADING;
                    var result_1;
                    if (keyLoadingPromise) {
                        result_1 = keyLoadingPromise
                            .then(function (keyLoadedData) {
                            if (!keyLoadedData ||
                                _this.fragContextChanged(keyLoadedData.frag)) {
                                return null;
                            }
                            return _this.doFragPartsLoad(frag, part_1, level, progressCallback);
                        })
                            .catch(function (error) { return _this.handleFragLoadError(error); });
                    }
                    else {
                        result_1 = this.doFragPartsLoad(frag, part_1, level, progressCallback).catch(function (error) { return _this.handleFragLoadError(error); });
                    }
                    this.hls.trigger(events_1.Events.FRAG_LOADING, {
                        frag: frag,
                        part: part_1,
                        targetBufferTime: targetBufferTime,
                    });
                    if (this.fragCurrent === null) {
                        return Promise.reject(new Error("frag load aborted, context changed in FRAG_LOADING parts"));
                    }
                    return result_1;
                }
                else if (!frag.url ||
                    this.loadedEndOfParts(partList, targetBufferTime)) {
                    // Fragment hint has no parts
                    return Promise.resolve(null);
                }
            }
        }
        this.log("Loading fragment ".concat(frag.sn, " cc: ").concat(frag.cc, " ").concat(details ? 'of [' + details.startSN + '-' + details.endSN + '] ' : '').concat(this.logPrefix === '[stream-controller]' ? 'level' : 'track', ": ").concat(frag.level, ", target: ").concat(parseFloat(targetBufferTime.toFixed(3))));
        // Don't update nextLoadPosition for fragments which are not buffered
        if (Number.isFinite(frag.sn) && !this.bitrateTest) {
            this.nextLoadPosition = frag.start + frag.duration;
        }
        this.state = exports.State.FRAG_LOADING;
        // Load key before streaming fragment data
        var dataOnProgress = this.config.progressive;
        var result;
        if (dataOnProgress && keyLoadingPromise) {
            result = keyLoadingPromise
                .then(function (keyLoadedData) {
                if (!keyLoadedData || _this.fragContextChanged(keyLoadedData === null || keyLoadedData === void 0 ? void 0 : keyLoadedData.frag)) {
                    return null;
                }
                return _this.fragmentLoader.load(frag, progressCallback);
            })
                .catch(function (error) { return _this.handleFragLoadError(error); });
        }
        else {
            // load unencrypted fragment data with progress event,
            // or handle fragment result after key and fragment are finished loading
            result = Promise.all([
                this.fragmentLoader.load(frag, dataOnProgress ? progressCallback : undefined),
                keyLoadingPromise,
            ])
                .then(function (_a) {
                var fragLoadedData = _a[0];
                if (!dataOnProgress && fragLoadedData && progressCallback) {
                    progressCallback(fragLoadedData);
                }
                return fragLoadedData;
            })
                .catch(function (error) { return _this.handleFragLoadError(error); });
        }
        this.hls.trigger(events_1.Events.FRAG_LOADING, { frag: frag, targetBufferTime: targetBufferTime });
        if (this.fragCurrent === null) {
            return Promise.reject(new Error("frag load aborted, context changed in FRAG_LOADING"));
        }
        return result;
    };
    BaseStreamController.prototype.doFragPartsLoad = function (frag, fromPart, level, progressCallback) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var _a;
            var partsLoaded = [];
            var initialPartList = (_a = level.details) === null || _a === void 0 ? void 0 : _a.partList;
            var loadPart = function (part) {
                _this.fragmentLoader
                    .loadPart(frag, part, progressCallback)
                    .then(function (partLoadedData) {
                    partsLoaded[part.index] = partLoadedData;
                    var loadedPart = partLoadedData.part;
                    _this.hls.trigger(events_1.Events.FRAG_LOADED, partLoadedData);
                    var nextPart = (0, level_helper_1.getPartWith)(level, frag.sn, part.index + 1) ||
                        (0, level_helper_1.findPart)(initialPartList, frag.sn, part.index + 1);
                    if (nextPart) {
                        loadPart(nextPart);
                    }
                    else {
                        return resolve({
                            frag: frag,
                            part: loadedPart,
                            partsLoaded: partsLoaded,
                        });
                    }
                })
                    .catch(reject);
            };
            loadPart(fromPart);
        });
    };
    BaseStreamController.prototype.handleFragLoadError = function (error) {
        if ('data' in error) {
            var data = error.data;
            if (error.data && data.details === errors_1.ErrorDetails.INTERNAL_ABORTED) {
                this.handleFragLoadAborted(data.frag, data.part);
            }
            else {
                this.hls.trigger(events_1.Events.ERROR, data);
            }
        }
        else {
            this.hls.trigger(events_1.Events.ERROR, {
                type: errors_1.ErrorTypes.OTHER_ERROR,
                details: errors_1.ErrorDetails.INTERNAL_EXCEPTION,
                err: error,
                error: error,
                fatal: true,
            });
        }
        return null;
    };
    BaseStreamController.prototype._handleTransmuxerFlush = function (chunkMeta) {
        var context = this.getCurrentContext(chunkMeta);
        if (!context || this.state !== exports.State.PARSING) {
            if (!this.fragCurrent &&
                this.state !== exports.State.STOPPED &&
                this.state !== exports.State.ERROR) {
                this.state = exports.State.IDLE;
            }
            return;
        }
        var frag = context.frag, part = context.part, level = context.level;
        var now = self.performance.now();
        frag.stats.parsing.end = now;
        if (part) {
            part.stats.parsing.end = now;
        }
        this.updateLevelTiming(frag, part, level, chunkMeta.partial);
    };
    BaseStreamController.prototype.getCurrentContext = function (chunkMeta) {
        var _a = this, levels = _a.levels, fragCurrent = _a.fragCurrent;
        var levelIndex = chunkMeta.level, sn = chunkMeta.sn, partIndex = chunkMeta.part;
        if (!(levels === null || levels === void 0 ? void 0 : levels[levelIndex])) {
            this.warn("Levels object was unset while buffering fragment ".concat(sn, " of level ").concat(levelIndex, ". The current chunk will not be buffered."));
            return null;
        }
        var level = levels[levelIndex];
        var part = partIndex > -1 ? (0, level_helper_1.getPartWith)(level, sn, partIndex) : null;
        var frag = part
            ? part.fragment
            : (0, level_helper_1.getFragmentWithSN)(level, sn, fragCurrent);
        if (!frag) {
            return null;
        }
        if (fragCurrent && fragCurrent !== frag) {
            frag.stats = fragCurrent.stats;
        }
        return { frag: frag, part: part, level: level };
    };
    BaseStreamController.prototype.bufferFragmentData = function (data, frag, part, chunkMeta, noBacktracking) {
        if (!data || this.state !== exports.State.PARSING) {
            return;
        }
        var data1 = data.data1, data2 = data.data2;
        var buffer = data1;
        if (data1 && data2) {
            // Combine the moof + mdat so that we buffer with a single append
            buffer = (0, mp4_tools_1.appendUint8Array)(data1, data2);
        }
        if (!(buffer === null || buffer === void 0 ? void 0 : buffer.length)) {
            return;
        }
        var segment = {
            type: data.type,
            frag: frag,
            part: part,
            chunkMeta: chunkMeta,
            parent: frag.type,
            data: buffer,
        };
        this.hls.trigger(events_1.Events.BUFFER_APPENDING, segment);
        if (data.dropped && data.independent && !part) {
            if (noBacktracking) {
                return;
            }
            // Clear buffer so that we reload previous segments sequentially if required
            this.flushBufferGap(frag);
        }
    };
    BaseStreamController.prototype.flushBufferGap = function (frag) {
        var media = this.media;
        if (!media) {
            return;
        }
        // If currentTime is not buffered, clear the back buffer so that we can backtrack as much as needed
        if (!buffer_helper_1.BufferHelper.isBuffered(media, media.currentTime)) {
            this.flushMainBuffer(0, frag.start);
            return;
        }
        // Remove back-buffer without interrupting playback to allow back tracking
        var currentTime = media.currentTime;
        var bufferInfo = buffer_helper_1.BufferHelper.bufferInfo(media, currentTime, 0);
        var fragDuration = frag.duration;
        var segmentFraction = Math.min(this.config.maxFragLookUpTolerance * 2, fragDuration * 0.25);
        var start = Math.max(Math.min(frag.start - segmentFraction, bufferInfo.end - segmentFraction), currentTime + segmentFraction);
        if (frag.start - start > segmentFraction) {
            this.flushMainBuffer(start, frag.start);
        }
    };
    BaseStreamController.prototype.getFwdBufferInfo = function (bufferable, type) {
        var pos = this.getLoadPosition();
        if (!Number.isFinite(pos)) {
            return null;
        }
        return this.getFwdBufferInfoAtPos(bufferable, pos, type);
    };
    BaseStreamController.prototype.getFwdBufferInfoAtPos = function (bufferable, pos, type) {
        var maxBufferHole = this.config.maxBufferHole;
        var bufferInfo = buffer_helper_1.BufferHelper.bufferInfo(bufferable, pos, maxBufferHole);
        // Workaround flaw in getting forward buffer when maxBufferHole is smaller than gap at current pos
        if (bufferInfo.len === 0 && bufferInfo.nextStart !== undefined) {
            var bufferedFragAtPos = this.fragmentTracker.getBufferedFrag(pos, type);
            if (bufferedFragAtPos && bufferInfo.nextStart < bufferedFragAtPos.end) {
                return buffer_helper_1.BufferHelper.bufferInfo(bufferable, pos, Math.max(bufferInfo.nextStart, maxBufferHole));
            }
        }
        return bufferInfo;
    };
    BaseStreamController.prototype.getMaxBufferLength = function (levelBitrate) {
        var config = this.config;
        var maxBufLen;
        if (levelBitrate) {
            maxBufLen = Math.max((8 * config.maxBufferSize) / levelBitrate, config.maxBufferLength);
        }
        else {
            maxBufLen = config.maxBufferLength;
        }
        return Math.min(maxBufLen, config.maxMaxBufferLength);
    };
    BaseStreamController.prototype.reduceMaxBufferLength = function (threshold, fragDuration) {
        var config = this.config;
        var minLength = Math.max(Math.min(threshold - fragDuration, config.maxBufferLength), fragDuration);
        var reducedLength = Math.max(threshold - fragDuration * 3, config.maxMaxBufferLength / 2, minLength);
        if (reducedLength >= minLength) {
            // reduce max buffer length as it might be too high. we do this to avoid loop flushing ...
            config.maxMaxBufferLength = reducedLength;
            this.warn("Reduce max buffer length to ".concat(reducedLength, "s"));
            return true;
        }
        return false;
    };
    BaseStreamController.prototype.getAppendedFrag = function (position, playlistType) {
        if (playlistType === void 0) { playlistType = loader_1.PlaylistLevelType.MAIN; }
        var fragOrPart = this.fragmentTracker.getAppendedFrag(position, loader_1.PlaylistLevelType.MAIN);
        if (fragOrPart && 'fragment' in fragOrPart) {
            return fragOrPart.fragment;
        }
        return fragOrPart;
    };
    BaseStreamController.prototype.getNextFragment = function (pos, levelDetails) {
        var fragments = levelDetails.fragments;
        var fragLen = fragments.length;
        if (!fragLen) {
            return null;
        }
        // find fragment index, contiguous with end of buffer position
        var config = this.config;
        var start = fragments[0].start;
        var frag;
        if (levelDetails.live) {
            var initialLiveManifestSize = config.initialLiveManifestSize;
            if (fragLen < initialLiveManifestSize) {
                this.warn("Not enough fragments to start playback (have: ".concat(fragLen, ", need: ").concat(initialLiveManifestSize, ")"));
                return null;
            }
            // The real fragment start times for a live stream are only known after the PTS range for that level is known.
            // In order to discover the range, we load the best matching fragment for that level and demux it.
            // Do not load using live logic if the starting frag is requested - we want to use getFragmentAtPosition() so that
            // we get the fragment matching that start time
            if ((!levelDetails.PTSKnown &&
                !this.startFragRequested &&
                this.startPosition === -1) ||
                pos < start) {
                frag = this.getInitialLiveFragment(levelDetails, fragments);
                this.startPosition = this.nextLoadPosition = frag
                    ? this.hls.liveSyncPosition || frag.start
                    : pos;
            }
        }
        else if (pos <= start) {
            // VoD playlist: if loadPosition before start of playlist, load first fragment
            frag = fragments[0];
        }
        // If we haven't run into any special cases already, just load the fragment most closely matching the requested position
        if (!frag) {
            var end = config.lowLatencyMode
                ? levelDetails.partEnd
                : levelDetails.fragmentEnd;
            frag = this.getFragmentAtPosition(pos, end, levelDetails);
        }
        return this.mapToInitFragWhenRequired(frag);
    };
    BaseStreamController.prototype.isLoopLoading = function (frag, targetBufferTime) {
        var trackerState = this.fragmentTracker.getState(frag);
        return ((trackerState === fragment_tracker_1.FragmentState.OK ||
            (trackerState === fragment_tracker_1.FragmentState.PARTIAL && !!frag.gap)) &&
            this.nextLoadPosition > targetBufferTime);
    };
    BaseStreamController.prototype.getNextFragmentLoopLoading = function (frag, levelDetails, bufferInfo, playlistType, maxBufLen) {
        var gapStart = frag.gap;
        var nextFragment = this.getNextFragment(this.nextLoadPosition, levelDetails);
        if (nextFragment === null) {
            return nextFragment;
        }
        frag = nextFragment;
        if (gapStart && frag && !frag.gap && bufferInfo.nextStart) {
            // Media buffered after GAP tags should not make the next buffer timerange exceed forward buffer length
            var nextbufferInfo = this.getFwdBufferInfoAtPos(this.mediaBuffer ? this.mediaBuffer : this.media, bufferInfo.nextStart, playlistType);
            if (nextbufferInfo !== null &&
                bufferInfo.len + nextbufferInfo.len >= maxBufLen) {
                // Returning here might result in not finding an audio and video candiate to skip to
                this.log("buffer full after gaps in \"".concat(playlistType, "\" playlist starting at sn: ").concat(frag.sn));
                return null;
            }
        }
        return frag;
    };
    BaseStreamController.prototype.mapToInitFragWhenRequired = function (frag) {
        // If an initSegment is present, it must be buffered first
        if ((frag === null || frag === void 0 ? void 0 : frag.initSegment) && !(frag === null || frag === void 0 ? void 0 : frag.initSegment.data) && !this.bitrateTest) {
            return frag.initSegment;
        }
        return frag;
    };
    BaseStreamController.prototype.getNextPart = function (partList, frag, targetBufferTime) {
        var nextPart = -1;
        var contiguous = false;
        var independentAttrOmitted = true;
        for (var i = 0, len = partList.length; i < len; i++) {
            var part = partList[i];
            independentAttrOmitted = independentAttrOmitted && !part.independent;
            if (nextPart > -1 && targetBufferTime < part.start) {
                break;
            }
            var loaded = part.loaded;
            if (loaded) {
                nextPart = -1;
            }
            else if ((contiguous || part.independent || independentAttrOmitted) &&
                part.fragment === frag) {
                nextPart = i;
            }
            contiguous = loaded;
        }
        return nextPart;
    };
    BaseStreamController.prototype.loadedEndOfParts = function (partList, targetBufferTime) {
        var lastPart = partList[partList.length - 1];
        return lastPart && targetBufferTime > lastPart.start && lastPart.loaded;
    };
    /*
     This method is used find the best matching first fragment for a live playlist. This fragment is used to calculate the
     "sliding" of the playlist, which is its offset from the start of playback. After sliding we can compute the real
     start and end times for each fragment in the playlist (after which this method will not need to be called).
    */
    BaseStreamController.prototype.getInitialLiveFragment = function (levelDetails, fragments) {
        var fragPrevious = this.fragPrevious;
        var frag = null;
        if (fragPrevious) {
            if (levelDetails.hasProgramDateTime) {
                // Prefer using PDT, because it can be accurate enough to choose the correct fragment without knowing the level sliding
                this.log("Live playlist, switching playlist, load frag with same PDT: ".concat(fragPrevious.programDateTime));
                frag = (0, fragment_finders_1.findFragmentByPDT)(fragments, fragPrevious.endProgramDateTime, this.config.maxFragLookUpTolerance);
            }
            if (!frag) {
                // SN does not need to be accurate between renditions, but depending on the packaging it may be so.
                var targetSN = fragPrevious.sn + 1;
                if (targetSN >= levelDetails.startSN &&
                    targetSN <= levelDetails.endSN) {
                    var fragNext = fragments[targetSN - levelDetails.startSN];
                    // Ensure that we're staying within the continuity range, since PTS resets upon a new range
                    if (fragPrevious.cc === fragNext.cc) {
                        frag = fragNext;
                        this.log("Live playlist, switching playlist, load frag with next SN: ".concat(frag.sn));
                    }
                }
                // It's important to stay within the continuity range if available; otherwise the fragments in the playlist
                // will have the wrong start times
                if (!frag) {
                    frag = (0, fragment_finders_1.findFragWithCC)(fragments, fragPrevious.cc);
                    if (frag) {
                        this.log("Live playlist, switching playlist, load frag with same CC: ".concat(frag.sn));
                    }
                }
            }
        }
        else {
            // Find a new start fragment when fragPrevious is null
            var liveStart = this.hls.liveSyncPosition;
            if (liveStart !== null) {
                frag = this.getFragmentAtPosition(liveStart, this.bitrateTest ? levelDetails.fragmentEnd : levelDetails.edge, levelDetails);
            }
        }
        return frag;
    };
    /*
    This method finds the best matching fragment given the provided position.
     */
    BaseStreamController.prototype.getFragmentAtPosition = function (bufferEnd, end, levelDetails) {
        var config = this.config;
        var fragPrevious = this.fragPrevious;
        var fragments = levelDetails.fragments, endSN = levelDetails.endSN;
        var fragmentHint = levelDetails.fragmentHint;
        var maxFragLookUpTolerance = config.maxFragLookUpTolerance;
        var partList = levelDetails.partList;
        var loadingParts = !!(config.lowLatencyMode &&
            (partList === null || partList === void 0 ? void 0 : partList.length) &&
            fragmentHint);
        if (loadingParts && fragmentHint && !this.bitrateTest) {
            // Include incomplete fragment with parts at end
            fragments = fragments.concat(fragmentHint);
            endSN = fragmentHint.sn;
        }
        var frag;
        if (bufferEnd < end) {
            var lookupTolerance = bufferEnd > end - maxFragLookUpTolerance ? 0 : maxFragLookUpTolerance;
            // Remove the tolerance if it would put the bufferEnd past the actual end of stream
            // Uses buffer and sequence number to calculate switch segment (required if using EXT-X-DISCONTINUITY-SEQUENCE)
            frag = (0, fragment_finders_1.findFragmentByPTS)(fragPrevious, fragments, bufferEnd, lookupTolerance);
        }
        else {
            // reach end of playlist
            frag = fragments[fragments.length - 1];
        }
        if (frag) {
            var curSNIdx = frag.sn - levelDetails.startSN;
            // Move fragPrevious forward to support forcing the next fragment to load
            // when the buffer catches up to a previously buffered range.
            var fragState = this.fragmentTracker.getState(frag);
            if (fragState === fragment_tracker_1.FragmentState.OK ||
                (fragState === fragment_tracker_1.FragmentState.PARTIAL && frag.gap)) {
                fragPrevious = frag;
            }
            if (fragPrevious &&
                frag.sn === fragPrevious.sn &&
                (!loadingParts || partList[0].fragment.sn > frag.sn)) {
                // Force the next fragment to load if the previous one was already selected. This can occasionally happen with
                // non-uniform fragment durations
                var sameLevel = fragPrevious && frag.level === fragPrevious.level;
                if (sameLevel) {
                    var nextFrag = fragments[curSNIdx + 1];
                    if (frag.sn < endSN &&
                        this.fragmentTracker.getState(nextFrag) !== fragment_tracker_1.FragmentState.OK) {
                        frag = nextFrag;
                    }
                    else {
                        frag = null;
                    }
                }
            }
        }
        return frag;
    };
    BaseStreamController.prototype.synchronizeToLiveEdge = function (levelDetails) {
        var _a = this, config = _a.config, media = _a.media;
        if (!media) {
            return;
        }
        var liveSyncPosition = this.hls.liveSyncPosition;
        var currentTime = media.currentTime;
        var start = levelDetails.fragments[0].start;
        var end = levelDetails.edge;
        var withinSlidingWindow = currentTime >= start - config.maxFragLookUpTolerance &&
            currentTime <= end;
        // Continue if we can seek forward to sync position or if current time is outside of sliding window
        if (liveSyncPosition !== null &&
            media.duration > liveSyncPosition &&
            (currentTime < liveSyncPosition || !withinSlidingWindow)) {
            // Continue if buffer is starving or if current time is behind max latency
            var maxLatency = config.liveMaxLatencyDuration !== undefined
                ? config.liveMaxLatencyDuration
                : config.liveMaxLatencyDurationCount * levelDetails.targetduration;
            if ((!withinSlidingWindow && media.readyState < 4) ||
                currentTime < end - maxLatency) {
                if (!this.loadedmetadata) {
                    this.nextLoadPosition = liveSyncPosition;
                }
                // Only seek if ready and there is not a significant forward buffer available for playback
                if (media.readyState) {
                    this.warn("Playback: ".concat(currentTime.toFixed(3), " is located too far from the end of live sliding playlist: ").concat(end, ", reset currentTime to : ").concat(liveSyncPosition.toFixed(3)));
                    media.currentTime = liveSyncPosition;
                }
            }
        }
    };
    BaseStreamController.prototype.alignPlaylists = function (details, previousDetails, switchDetails) {
        // FIXME: If not for `shouldAlignOnDiscontinuities` requiring fragPrevious.cc,
        //  this could all go in level-helper mergeDetails()
        var length = details.fragments.length;
        if (!length) {
            this.warn("No fragments in live playlist");
            return 0;
        }
        var slidingStart = details.fragments[0].start;
        var firstLevelLoad = !previousDetails;
        var aligned = details.alignedSliding && Number.isFinite(slidingStart);
        if (firstLevelLoad || (!aligned && !slidingStart)) {
            var fragPrevious = this.fragPrevious;
            (0, discontinuities_1.alignStream)(fragPrevious, switchDetails, details);
            var alignedSlidingStart = details.fragments[0].start;
            this.log("Live playlist sliding: ".concat(alignedSlidingStart.toFixed(2), " start-sn: ").concat(previousDetails ? previousDetails.startSN : 'na', "->").concat(details.startSN, " prev-sn: ").concat(fragPrevious ? fragPrevious.sn : 'na', " fragments: ").concat(length));
            return alignedSlidingStart;
        }
        return slidingStart;
    };
    BaseStreamController.prototype.waitForCdnTuneIn = function (details) {
        // Wait for Low-Latency CDN Tune-in to get an updated playlist
        var advancePartLimit = 3;
        return (details.live &&
            details.canBlockReload &&
            details.partTarget &&
            details.tuneInGoal >
                Math.max(details.partHoldBack, details.partTarget * advancePartLimit));
    };
    BaseStreamController.prototype.setStartPosition = function (details, sliding) {
        // compute start position if set to -1. use it straight away if value is defined
        var startPosition = this.startPosition;
        if (startPosition < sliding) {
            startPosition = -1;
        }
        if (startPosition === -1 || this.lastCurrentTime === -1) {
            // Use Playlist EXT-X-START:TIME-OFFSET when set
            // Prioritize Multivariant Playlist offset so that main, audio, and subtitle stream-controller start times match
            var offsetInMultivariantPlaylist = this.startTimeOffset !== null;
            var startTimeOffset = offsetInMultivariantPlaylist
                ? this.startTimeOffset
                : details.startTimeOffset;
            if (startTimeOffset !== null && Number.isFinite(startTimeOffset)) {
                startPosition = sliding + startTimeOffset;
                if (startTimeOffset < 0) {
                    startPosition += details.totalduration;
                }
                startPosition = Math.min(Math.max(sliding, startPosition), sliding + details.totalduration);
                this.log("Start time offset ".concat(startTimeOffset, " found in ").concat(offsetInMultivariantPlaylist ? 'multivariant' : 'media', " playlist, adjust startPosition to ").concat(startPosition));
                this.startPosition = startPosition;
            }
            else if (details.live) {
                // Leave this.startPosition at -1, so that we can use `getInitialLiveFragment` logic when startPosition has
                // not been specified via the config or an as an argument to startLoad (#3736).
                startPosition = this.hls.liveSyncPosition || sliding;
            }
            else {
                this.startPosition = startPosition = 0;
            }
            this.lastCurrentTime = startPosition;
        }
        this.nextLoadPosition = startPosition;
    };
    BaseStreamController.prototype.getLoadPosition = function () {
        var media = this.media;
        // if we have not yet loaded any fragment, start loading from start position
        var pos = 0;
        if (this.loadedmetadata && media) {
            pos = media.currentTime;
        }
        else if (this.nextLoadPosition) {
            pos = this.nextLoadPosition;
        }
        return pos;
    };
    BaseStreamController.prototype.handleFragLoadAborted = function (frag, part) {
        if (this.transmuxer && frag.sn !== 'initSegment' && frag.stats.aborted) {
            this.warn("Fragment ".concat(frag.sn).concat(part ? ' part ' + part.index : '', " of level ").concat(frag.level, " was aborted"));
            this.resetFragmentLoading(frag);
        }
    };
    BaseStreamController.prototype.resetFragmentLoading = function (frag) {
        if (!this.fragCurrent ||
            (!this.fragContextChanged(frag) &&
                this.state !== exports.State.FRAG_LOADING_WAITING_RETRY)) {
            this.state = exports.State.IDLE;
        }
    };
    BaseStreamController.prototype.onFragmentOrKeyLoadError = function (filterType, data) {
        var _a;
        if (data.chunkMeta && !data.frag) {
            var context = this.getCurrentContext(data.chunkMeta);
            if (context) {
                data.frag = context.frag;
            }
        }
        var frag = data.frag;
        // Handle frag error related to caller's filterType
        if (!frag || frag.type !== filterType || !this.levels) {
            return;
        }
        if (this.fragContextChanged(frag)) {
            this.warn("Frag load error must match current frag to retry ".concat(frag.url, " > ").concat((_a = this.fragCurrent) === null || _a === void 0 ? void 0 : _a.url));
            return;
        }
        var gapTagEncountered = data.details === errors_1.ErrorDetails.FRAG_GAP;
        if (gapTagEncountered) {
            this.fragmentTracker.fragBuffered(frag, true);
        }
        // keep retrying until the limit will be reached
        var errorAction = data.errorAction;
        var _b = errorAction || {}, action = _b.action, _c = _b.retryCount, retryCount = _c === void 0 ? 0 : _c, retryConfig = _b.retryConfig;
        if (errorAction &&
            action === 5 /* NetworkErrorAction.RetryRequest */ &&
            retryConfig) {
            this.resetStartWhenNotLoaded(this.levelLastLoaded);
            var delay = (0, error_helper_1.getRetryDelay)(retryConfig, retryCount);
            this.warn("Fragment ".concat(frag.sn, " of ").concat(filterType, " ").concat(frag.level, " errored with ").concat(data.details, ", retrying loading ").concat(retryCount + 1, "/").concat(retryConfig.maxNumRetry, " in ").concat(delay, "ms"));
            errorAction.resolved = true;
            this.retryDate = self.performance.now() + delay;
            this.state = exports.State.FRAG_LOADING_WAITING_RETRY;
        }
        else if (retryConfig && errorAction) {
            this.resetFragmentErrors(filterType);
            if (retryCount < retryConfig.maxNumRetry) {
                // Network retry is skipped when level switch is preferred
                if (!gapTagEncountered &&
                    action !== 3 /* NetworkErrorAction.RemoveAlternatePermanently */) {
                    errorAction.resolved = true;
                }
            }
            else {
                logger_1.logger.warn("".concat(data.details, " reached or exceeded max retry (").concat(retryCount, ")"));
                return;
            }
        }
        else if ((errorAction === null || errorAction === void 0 ? void 0 : errorAction.action) === 2 /* NetworkErrorAction.SendAlternateToPenaltyBox */) {
            this.state = exports.State.WAITING_LEVEL;
        }
        else {
            this.state = exports.State.ERROR;
        }
        // Perform next async tick sooner to speed up error action resolution
        this.tickImmediate();
    };
    BaseStreamController.prototype.reduceLengthAndFlushBuffer = function (data) {
        // if in appending state
        if (this.state === exports.State.PARSING || this.state === exports.State.PARSED) {
            var frag = data.frag;
            var playlistType = data.parent;
            var bufferedInfo = this.getFwdBufferInfo(this.mediaBuffer, playlistType);
            // 0.5 : tolerance needed as some browsers stalls playback before reaching buffered end
            // reduce max buf len if current position is buffered
            var buffered = bufferedInfo && bufferedInfo.len > 0.5;
            if (buffered) {
                this.reduceMaxBufferLength(bufferedInfo.len, (frag === null || frag === void 0 ? void 0 : frag.duration) || 10);
            }
            var flushBuffer = !buffered;
            if (flushBuffer) {
                // current position is not buffered, but browser is still complaining about buffer full error
                // this happens on IE/Edge, refer to https://github.com/video-dev/hls.js/pull/708
                // in that case flush the whole audio buffer to recover
                this.warn("Buffer full error while media.currentTime is not buffered, flush ".concat(playlistType, " buffer"));
            }
            if (frag) {
                this.fragmentTracker.removeFragment(frag);
                this.nextLoadPosition = frag.start;
            }
            this.resetLoadingState();
            return flushBuffer;
        }
        return false;
    };
    BaseStreamController.prototype.resetFragmentErrors = function (filterType) {
        if (filterType === loader_1.PlaylistLevelType.AUDIO) {
            // Reset current fragment since audio track audio is essential and may not have a fail-over track
            this.fragCurrent = null;
        }
        // Fragment errors that result in a level switch or redundant fail-over
        // should reset the stream controller state to idle
        if (!this.loadedmetadata) {
            this.startFragRequested = false;
        }
        if (this.state !== exports.State.STOPPED) {
            this.state = exports.State.IDLE;
        }
    };
    BaseStreamController.prototype.afterBufferFlushed = function (media, bufferType, playlistType) {
        if (!media) {
            return;
        }
        // After successful buffer flushing, filter flushed fragments from bufferedFrags use mediaBuffered instead of media
        // (so that we will check against video.buffered ranges in case of alt audio track)
        var bufferedTimeRanges = buffer_helper_1.BufferHelper.getBuffered(media);
        this.fragmentTracker.detectEvictedFragments(bufferType, bufferedTimeRanges, playlistType);
        if (this.state === exports.State.ENDED) {
            this.resetLoadingState();
        }
    };
    BaseStreamController.prototype.resetLoadingState = function () {
        this.log('Reset loading state');
        this.fragCurrent = null;
        this.fragPrevious = null;
        this.state = exports.State.IDLE;
    };
    BaseStreamController.prototype.resetStartWhenNotLoaded = function (level) {
        // if loadedmetadata is not set, it means that first frag request failed
        // in that case, reset startFragRequested flag
        if (!this.loadedmetadata) {
            this.startFragRequested = false;
            var details = level ? level.details : null;
            if (details === null || details === void 0 ? void 0 : details.live) {
                // Update the start position and return to IDLE to recover live start
                this.startPosition = -1;
                this.setStartPosition(details, 0);
                this.resetLoadingState();
            }
            else {
                this.nextLoadPosition = this.startPosition;
            }
        }
    };
    BaseStreamController.prototype.resetWhenMissingContext = function (chunkMeta) {
        this.warn("The loading context changed while buffering fragment ".concat(chunkMeta.sn, " of level ").concat(chunkMeta.level, ". This chunk will not be buffered."));
        this.removeUnbufferedFrags();
        this.resetStartWhenNotLoaded(this.levelLastLoaded);
        this.resetLoadingState();
    };
    BaseStreamController.prototype.removeUnbufferedFrags = function (start) {
        if (start === void 0) { start = 0; }
        this.fragmentTracker.removeFragmentsInRange(start, Infinity, this.playlistType, false, true);
    };
    BaseStreamController.prototype.updateLevelTiming = function (frag, part, level, partial) {
        var _this = this;
        var _a;
        var details = level.details;
        if (!details) {
            this.warn('level.details undefined');
            return;
        }
        var parsed = Object.keys(frag.elementaryStreams).reduce(function (result, type) {
            var info = frag.elementaryStreams[type];
            if (info) {
                var parsedDuration = info.endPTS - info.startPTS;
                if (parsedDuration <= 0) {
                    // Destroy the transmuxer after it's next time offset failed to advance because duration was <= 0.
                    // The new transmuxer will be configured with a time offset matching the next fragment start,
                    // preventing the timeline from shifting.
                    _this.warn("Could not parse fragment ".concat(frag.sn, " ").concat(type, " duration reliably (").concat(parsedDuration, ")"));
                    return result || false;
                }
                var drift = partial
                    ? 0
                    : (0, level_helper_1.updateFragPTSDTS)(details, frag, info.startPTS, info.endPTS, info.startDTS, info.endDTS);
                _this.hls.trigger(events_1.Events.LEVEL_PTS_UPDATED, {
                    details: details,
                    level: level,
                    drift: drift,
                    type: type,
                    frag: frag,
                    start: info.startPTS,
                    end: info.endPTS,
                });
                return true;
            }
            return result;
        }, false);
        if (!parsed && ((_a = this.transmuxer) === null || _a === void 0 ? void 0 : _a.error) === null) {
            var error = new Error("Found no media in fragment ".concat(frag.sn, " of level ").concat(frag.level, " resetting transmuxer to fallback to playlist timing"));
            if (level.fragmentError === 0) {
                // Mark and track the odd empty segment as a gap to avoid reloading
                level.fragmentError++;
                frag.gap = true;
                this.fragmentTracker.removeFragment(frag);
                this.fragmentTracker.fragBuffered(frag, true);
            }
            this.warn(error.message);
            this.hls.trigger(events_1.Events.ERROR, {
                type: errors_1.ErrorTypes.MEDIA_ERROR,
                details: errors_1.ErrorDetails.FRAG_PARSING_ERROR,
                fatal: false,
                error: error,
                frag: frag,
                reason: "Found no media in msn ".concat(frag.sn, " of level \"").concat(level.url, "\""),
            });
            if (!this.hls) {
                return;
            }
            this.resetTransmuxer();
            // For this error fallthrough. Marking parsed will allow advancing to next fragment.
        }
        this.state = exports.State.PARSED;
        this.hls.trigger(events_1.Events.FRAG_PARSED, { frag: frag, part: part });
    };
    BaseStreamController.prototype.resetTransmuxer = function () {
        if (this.transmuxer) {
            this.transmuxer.destroy();
            this.transmuxer = null;
        }
    };
    BaseStreamController.prototype.recoverWorkerError = function (data) {
        if (data.event === 'demuxerWorker') {
            this.fragmentTracker.removeAllFragments();
            this.resetTransmuxer();
            this.resetStartWhenNotLoaded(this.levelLastLoaded);
            this.resetLoadingState();
        }
    };
    Object.defineProperty(BaseStreamController.prototype, "state", {
        get: function () {
            return this._state;
        },
        set: function (nextState) {
            var previousState = this._state;
            if (previousState !== nextState) {
                this._state = nextState;
                this.log("".concat(previousState, "->").concat(nextState));
            }
        },
        enumerable: false,
        configurable: true
    });
    return BaseStreamController;
}(task_loop_1.default));
exports.default = BaseStreamController;
