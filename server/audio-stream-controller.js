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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var base_stream_controller_1 = require("./base-stream-controller");
var events_1 = require("../events");
var buffer_helper_1 = require("../utils/buffer-helper");
var fragment_tracker_1 = require("./fragment-tracker");
var level_1 = require("../types/level");
var loader_1 = require("../types/loader");
var fragment_1 = require("../loader/fragment");
var chunk_cache_1 = require("../demux/chunk-cache");
var transmuxer_interface_1 = require("../demux/transmuxer-interface");
var transmuxer_1 = require("../types/transmuxer");
var fragment_finders_1 = require("./fragment-finders");
var discontinuities_1 = require("../utils/discontinuities");
var errors_1 = require("../errors");
var rendition_helper_1 = require("../utils/rendition-helper");
var TICK_INTERVAL = 100; // how often to tick in ms
var AudioStreamController = /** @class */ (function (_super) {
    __extends(AudioStreamController, _super);
    function AudioStreamController(hls, fragmentTracker, keyLoader) {
        var _this = _super.call(this, hls, fragmentTracker, keyLoader, '[audio-stream-controller]', loader_1.PlaylistLevelType.AUDIO) || this;
        _this.videoBuffer = null;
        _this.videoTrackCC = -1;
        _this.waitingVideoCC = -1;
        _this.bufferedTrack = null;
        _this.switchingTrack = null;
        _this.trackId = -1;
        _this.waitingData = null;
        _this.mainDetails = null;
        _this.flushing = false;
        _this.bufferFlushed = false;
        _this.cachedTrackLoadedData = null;
        _this._registerListeners();
        return _this;
    }
    AudioStreamController.prototype.onHandlerDestroying = function () {
        this._unregisterListeners();
        _super.prototype.onHandlerDestroying.call(this);
        this.mainDetails = null;
        this.bufferedTrack = null;
        this.switchingTrack = null;
    };
    AudioStreamController.prototype._registerListeners = function () {
        var hls = this.hls;
        hls.on(events_1.Events.MEDIA_ATTACHED, this.onMediaAttached, this);
        hls.on(events_1.Events.MEDIA_DETACHING, this.onMediaDetaching, this);
        hls.on(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.on(events_1.Events.LEVEL_LOADED, this.onLevelLoaded, this);
        hls.on(events_1.Events.AUDIO_TRACKS_UPDATED, this.onAudioTracksUpdated, this);
        hls.on(events_1.Events.AUDIO_TRACK_SWITCHING, this.onAudioTrackSwitching, this);
        hls.on(events_1.Events.AUDIO_TRACK_LOADED, this.onAudioTrackLoaded, this);
        hls.on(events_1.Events.ERROR, this.onError, this);
        hls.on(events_1.Events.BUFFER_RESET, this.onBufferReset, this);
        hls.on(events_1.Events.BUFFER_CREATED, this.onBufferCreated, this);
        hls.on(events_1.Events.BUFFER_FLUSHING, this.onBufferFlushing, this);
        hls.on(events_1.Events.BUFFER_FLUSHED, this.onBufferFlushed, this);
        hls.on(events_1.Events.INIT_PTS_FOUND, this.onInitPtsFound, this);
        hls.on(events_1.Events.FRAG_BUFFERED, this.onFragBuffered, this);
    };
    AudioStreamController.prototype._unregisterListeners = function () {
        var hls = this.hls;
        hls.off(events_1.Events.MEDIA_ATTACHED, this.onMediaAttached, this);
        hls.off(events_1.Events.MEDIA_DETACHING, this.onMediaDetaching, this);
        hls.off(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.off(events_1.Events.LEVEL_LOADED, this.onLevelLoaded, this);
        hls.off(events_1.Events.AUDIO_TRACKS_UPDATED, this.onAudioTracksUpdated, this);
        hls.off(events_1.Events.AUDIO_TRACK_SWITCHING, this.onAudioTrackSwitching, this);
        hls.off(events_1.Events.AUDIO_TRACK_LOADED, this.onAudioTrackLoaded, this);
        hls.off(events_1.Events.ERROR, this.onError, this);
        hls.off(events_1.Events.BUFFER_RESET, this.onBufferReset, this);
        hls.off(events_1.Events.BUFFER_CREATED, this.onBufferCreated, this);
        hls.off(events_1.Events.BUFFER_FLUSHING, this.onBufferFlushing, this);
        hls.off(events_1.Events.BUFFER_FLUSHED, this.onBufferFlushed, this);
        hls.off(events_1.Events.INIT_PTS_FOUND, this.onInitPtsFound, this);
        hls.off(events_1.Events.FRAG_BUFFERED, this.onFragBuffered, this);
    };
    // INIT_PTS_FOUND is triggered when the video track parsed in the stream-controller has a new PTS value
    AudioStreamController.prototype.onInitPtsFound = function (event, _a) {
        var frag = _a.frag, id = _a.id, initPTS = _a.initPTS, timescale = _a.timescale;
        // Always update the new INIT PTS
        // Can change due level switch
        if (id === 'main') {
            var cc = frag.cc;
            this.initPTS[frag.cc] = { baseTime: initPTS, timescale: timescale };
            this.log("InitPTS for cc: ".concat(cc, " found from main: ").concat(initPTS));
            this.videoTrackCC = cc;
            // If we are waiting, tick immediately to unblock audio fragment transmuxing
            if (this.state === base_stream_controller_1.State.WAITING_INIT_PTS) {
                this.tick();
            }
        }
    };
    AudioStreamController.prototype.startLoad = function (startPosition) {
        if (!this.levels) {
            this.startPosition = startPosition;
            this.state = base_stream_controller_1.State.STOPPED;
            return;
        }
        var lastCurrentTime = this.lastCurrentTime;
        this.stopLoad();
        this.setInterval(TICK_INTERVAL);
        if (lastCurrentTime > 0 && startPosition === -1) {
            this.log("Override startPosition with lastCurrentTime @".concat(lastCurrentTime.toFixed(3)));
            startPosition = lastCurrentTime;
            this.state = base_stream_controller_1.State.IDLE;
        }
        else {
            this.loadedmetadata = false;
            this.state = base_stream_controller_1.State.WAITING_TRACK;
        }
        this.nextLoadPosition =
            this.startPosition =
                this.lastCurrentTime =
                    startPosition;
        this.tick();
    };
    AudioStreamController.prototype.doTick = function () {
        var _a, _b;
        switch (this.state) {
            case base_stream_controller_1.State.IDLE:
                this.doTickIdle();
                break;
            case base_stream_controller_1.State.WAITING_TRACK: {
                var _c = this, levels = _c.levels, trackId = _c.trackId;
                var details = (_a = levels === null || levels === void 0 ? void 0 : levels[trackId]) === null || _a === void 0 ? void 0 : _a.details;
                if (details) {
                    if (this.waitForCdnTuneIn(details)) {
                        break;
                    }
                    this.state = base_stream_controller_1.State.WAITING_INIT_PTS;
                }
                break;
            }
            case base_stream_controller_1.State.FRAG_LOADING_WAITING_RETRY: {
                var now = performance.now();
                var retryDate = this.retryDate;
                // if current time is gt than retryDate, or if media seeking let's switch to IDLE state to retry loading
                if (!retryDate || now >= retryDate || ((_b = this.media) === null || _b === void 0 ? void 0 : _b.seeking)) {
                    var _d = this, levels = _d.levels, trackId = _d.trackId;
                    this.log('RetryDate reached, switch back to IDLE state');
                    this.resetStartWhenNotLoaded((levels === null || levels === void 0 ? void 0 : levels[trackId]) || null);
                    this.state = base_stream_controller_1.State.IDLE;
                }
                break;
            }
            case base_stream_controller_1.State.WAITING_INIT_PTS: {
                // Ensure we don't get stuck in the WAITING_INIT_PTS state if the waiting frag CC doesn't match any initPTS
                var waitingData = this.waitingData;
                if (waitingData) {
                    var frag = waitingData.frag, part = waitingData.part, cache = waitingData.cache, complete = waitingData.complete;
                    if (this.initPTS[frag.cc] !== undefined) {
                        this.waitingData = null;
                        this.waitingVideoCC = -1;
                        this.state = base_stream_controller_1.State.FRAG_LOADING;
                        var payload = cache.flush();
                        var data = {
                            frag: frag,
                            part: part,
                            payload: payload,
                            networkDetails: null,
                        };
                        this._handleFragmentLoadProgress(data);
                        if (complete) {
                            _super.prototype._handleFragmentLoadComplete.call(this, data);
                        }
                    }
                    else if (this.videoTrackCC !== this.waitingVideoCC) {
                        // Drop waiting fragment if videoTrackCC has changed since waitingFragment was set and initPTS was not found
                        this.log("Waiting fragment cc (".concat(frag.cc, ") cancelled because video is at cc ").concat(this.videoTrackCC));
                        this.clearWaitingFragment();
                    }
                    else {
                        // Drop waiting fragment if an earlier fragment is needed
                        var pos = this.getLoadPosition();
                        var bufferInfo = buffer_helper_1.BufferHelper.bufferInfo(this.mediaBuffer, pos, this.config.maxBufferHole);
                        var waitingFragmentAtPosition = (0, fragment_finders_1.fragmentWithinToleranceTest)(bufferInfo.end, this.config.maxFragLookUpTolerance, frag);
                        if (waitingFragmentAtPosition < 0) {
                            this.log("Waiting fragment cc (".concat(frag.cc, ") @ ").concat(frag.start, " cancelled because another fragment at ").concat(bufferInfo.end, " is needed"));
                            this.clearWaitingFragment();
                        }
                    }
                }
                else {
                    this.state = base_stream_controller_1.State.IDLE;
                }
            }
        }
        this.onTickEnd();
    };
    AudioStreamController.prototype.clearWaitingFragment = function () {
        var waitingData = this.waitingData;
        if (waitingData) {
            this.fragmentTracker.removeFragment(waitingData.frag);
            this.waitingData = null;
            this.waitingVideoCC = -1;
            this.state = base_stream_controller_1.State.IDLE;
        }
    };
    AudioStreamController.prototype.resetLoadingState = function () {
        this.clearWaitingFragment();
        _super.prototype.resetLoadingState.call(this);
    };
    AudioStreamController.prototype.onTickEnd = function () {
        var media = this.media;
        if (!(media === null || media === void 0 ? void 0 : media.readyState)) {
            // Exit early if we don't have media or if the media hasn't buffered anything yet (readyState 0)
            return;
        }
        this.lastCurrentTime = media.currentTime;
    };
    AudioStreamController.prototype.doTickIdle = function () {
        var _a = this, hls = _a.hls, levels = _a.levels, media = _a.media, trackId = _a.trackId;
        var config = hls.config;
        // 1. if buffering is suspended
        // 2. if video not attached AND
        //    start fragment already requested OR start frag prefetch not enabled
        // 3. if tracks or track not loaded and selected
        // then exit loop
        // => if media not attached but start frag prefetch is enabled and start frag not requested yet, we will not exit loop
        if (!this.buffering ||
            (!media && (this.startFragRequested || !config.startFragPrefetch)) ||
            !(levels === null || levels === void 0 ? void 0 : levels[trackId])) {
            return;
        }
        var levelInfo = levels[trackId];
        var trackDetails = levelInfo.details;
        if (!trackDetails ||
            (trackDetails.live && this.levelLastLoaded !== levelInfo) ||
            this.waitForCdnTuneIn(trackDetails)) {
            this.state = base_stream_controller_1.State.WAITING_TRACK;
            return;
        }
        var bufferable = this.mediaBuffer ? this.mediaBuffer : this.media;
        if (this.bufferFlushed && bufferable) {
            this.bufferFlushed = false;
            this.afterBufferFlushed(bufferable, fragment_1.ElementaryStreamTypes.AUDIO, loader_1.PlaylistLevelType.AUDIO);
        }
        var bufferInfo = this.getFwdBufferInfo(bufferable, loader_1.PlaylistLevelType.AUDIO);
        if (bufferInfo === null) {
            return;
        }
        if (!this.switchingTrack && this._streamEnded(bufferInfo, trackDetails)) {
            hls.trigger(events_1.Events.BUFFER_EOS, { type: 'audio' });
            this.state = base_stream_controller_1.State.ENDED;
            return;
        }
        var mainBufferInfo = this.getFwdBufferInfo(this.videoBuffer ? this.videoBuffer : this.media, loader_1.PlaylistLevelType.MAIN);
        var bufferLen = bufferInfo.len;
        var maxBufLen = this.getMaxBufferLength(mainBufferInfo === null || mainBufferInfo === void 0 ? void 0 : mainBufferInfo.len);
        var fragments = trackDetails.fragments;
        var start = fragments[0].start;
        var loadPosition = this.getLoadPosition();
        var targetBufferTime = this.flushing ? loadPosition : bufferInfo.end;
        if (this.switchingTrack && media) {
            var pos = loadPosition;
            // if currentTime (pos) is less than alt audio playlist start time, it means that alt audio is ahead of currentTime
            if (trackDetails.PTSKnown && pos < start) {
                // if everything is buffered from pos to start or if audio buffer upfront, let's seek to start
                if (bufferInfo.end > start || bufferInfo.nextStart) {
                    this.log('Alt audio track ahead of main track, seek to start of alt audio track');
                    media.currentTime = start + 0.05;
                }
            }
        }
        // if buffer length is less than maxBufLen, or near the end, find a fragment to load
        if (bufferLen >= maxBufLen &&
            !this.switchingTrack &&
            targetBufferTime < fragments[fragments.length - 1].start) {
            return;
        }
        var frag = this.getNextFragment(targetBufferTime, trackDetails);
        var atGap = false;
        // Avoid loop loading by using nextLoadPosition set for backtracking and skipping consecutive GAP tags
        if (frag && this.isLoopLoading(frag, targetBufferTime)) {
            atGap = !!frag.gap;
            frag = this.getNextFragmentLoopLoading(frag, trackDetails, bufferInfo, loader_1.PlaylistLevelType.MAIN, maxBufLen);
        }
        if (!frag) {
            this.bufferFlushed = true;
            return;
        }
        // Buffer audio up to one target duration ahead of main buffer
        var atBufferSyncLimit = mainBufferInfo &&
            frag.start > mainBufferInfo.end + trackDetails.targetduration;
        if (atBufferSyncLimit ||
            // Or wait for main buffer after buffing some audio
            (!(mainBufferInfo === null || mainBufferInfo === void 0 ? void 0 : mainBufferInfo.len) && bufferInfo.len)) {
            // Check fragment-tracker for main fragments since GAP segments do not show up in bufferInfo
            var mainFrag = this.getAppendedFrag(frag.start, loader_1.PlaylistLevelType.MAIN);
            if (mainFrag === null) {
                return;
            }
            // Bridge gaps in main buffer
            atGap || (atGap = !!mainFrag.gap || (!!atBufferSyncLimit && mainBufferInfo.len === 0));
            if ((atBufferSyncLimit && !atGap) ||
                (atGap && bufferInfo.nextStart && bufferInfo.nextStart < mainFrag.end)) {
                return;
            }
        }
        this.loadFragment(frag, levelInfo, targetBufferTime);
    };
    AudioStreamController.prototype.getMaxBufferLength = function (mainBufferLength) {
        var maxConfigBuffer = _super.prototype.getMaxBufferLength.call(this);
        if (!mainBufferLength) {
            return maxConfigBuffer;
        }
        return Math.min(Math.max(maxConfigBuffer, mainBufferLength), this.config.maxMaxBufferLength);
    };
    AudioStreamController.prototype.onMediaDetaching = function () {
        this.videoBuffer = null;
        this.bufferFlushed = this.flushing = false;
        _super.prototype.onMediaDetaching.call(this);
    };
    AudioStreamController.prototype.onAudioTracksUpdated = function (event, _a) {
        var audioTracks = _a.audioTracks;
        // Reset tranxmuxer is essential for large context switches (Content Steering)
        this.resetTransmuxer();
        this.levels = audioTracks.map(function (mediaPlaylist) { return new level_1.Level(mediaPlaylist); });
    };
    AudioStreamController.prototype.onAudioTrackSwitching = function (event, data) {
        // if any URL found on new audio track, it is an alternate audio track
        var altAudio = !!data.url;
        this.trackId = data.id;
        var fragCurrent = this.fragCurrent;
        if (fragCurrent) {
            fragCurrent.abortRequests();
            this.removeUnbufferedFrags(fragCurrent.start);
        }
        this.resetLoadingState();
        // destroy useless transmuxer when switching audio to main
        if (!altAudio) {
            this.resetTransmuxer();
        }
        else {
            // switching to audio track, start timer if not already started
            this.setInterval(TICK_INTERVAL);
        }
        // should we switch tracks ?
        if (altAudio) {
            this.switchingTrack = data;
            // main audio track are handled by stream-controller, just do something if switching to alt audio track
            this.state = base_stream_controller_1.State.IDLE;
            this.flushAudioIfNeeded(data);
        }
        else {
            this.switchingTrack = null;
            this.bufferedTrack = data;
            this.state = base_stream_controller_1.State.STOPPED;
        }
        this.tick();
    };
    AudioStreamController.prototype.onManifestLoading = function () {
        this.fragmentTracker.removeAllFragments();
        this.startPosition = this.lastCurrentTime = 0;
        this.bufferFlushed = this.flushing = false;
        this.levels =
            this.mainDetails =
                this.waitingData =
                    this.bufferedTrack =
                        this.cachedTrackLoadedData =
                            this.switchingTrack =
                                null;
        this.startFragRequested = false;
        this.trackId = this.videoTrackCC = this.waitingVideoCC = -1;
    };
    AudioStreamController.prototype.onLevelLoaded = function (event, data) {
        this.mainDetails = data.details;
        if (this.cachedTrackLoadedData !== null) {
            this.hls.trigger(events_1.Events.AUDIO_TRACK_LOADED, this.cachedTrackLoadedData);
            this.cachedTrackLoadedData = null;
        }
    };
    AudioStreamController.prototype.onAudioTrackLoaded = function (event, data) {
        var _a, _b;
        if (this.mainDetails == null) {
            this.cachedTrackLoadedData = data;
            return;
        }
        var levels = this.levels;
        var newDetails = data.details, trackId = data.id;
        if (!levels) {
            this.warn("Audio tracks were reset while loading level ".concat(trackId));
            return;
        }
        this.log("Audio track ".concat(trackId, " loaded [").concat(newDetails.startSN, ",").concat(newDetails.endSN, "]").concat(newDetails.lastPartSn
            ? "[part-".concat(newDetails.lastPartSn, "-").concat(newDetails.lastPartIndex, "]")
            : '', ",duration:").concat(newDetails.totalduration));
        var track = levels[trackId];
        var sliding = 0;
        if (newDetails.live || ((_a = track.details) === null || _a === void 0 ? void 0 : _a.live)) {
            this.checkLiveUpdate(newDetails);
            var mainDetails = this.mainDetails;
            if (newDetails.deltaUpdateFailed || !mainDetails) {
                return;
            }
            if (!track.details &&
                newDetails.hasProgramDateTime &&
                mainDetails.hasProgramDateTime) {
                // Make sure our audio rendition is aligned with the "main" rendition, using
                // pdt as our reference times.
                (0, discontinuities_1.alignMediaPlaylistByPDT)(newDetails, mainDetails);
                sliding = newDetails.fragments[0].start;
            }
            else {
                sliding = this.alignPlaylists(newDetails, track.details, (_b = this.levelLastLoaded) === null || _b === void 0 ? void 0 : _b.details);
            }
        }
        track.details = newDetails;
        this.levelLastLoaded = track;
        // compute start position if we are aligned with the main playlist
        if (!this.startFragRequested && (this.mainDetails || !newDetails.live)) {
            this.setStartPosition(this.mainDetails || newDetails, sliding);
        }
        // only switch back to IDLE state if we were waiting for track to start downloading a new fragment
        if (this.state === base_stream_controller_1.State.WAITING_TRACK &&
            !this.waitForCdnTuneIn(newDetails)) {
            this.state = base_stream_controller_1.State.IDLE;
        }
        // trigger handler right now
        this.tick();
    };
    AudioStreamController.prototype._handleFragmentLoadProgress = function (data) {
        var _a;
        var frag = data.frag, part = data.part, payload = data.payload;
        var _b = this, config = _b.config, trackId = _b.trackId, levels = _b.levels;
        if (!levels) {
            this.warn("Audio tracks were reset while fragment load was in progress. Fragment ".concat(frag.sn, " of level ").concat(frag.level, " will not be buffered"));
            return;
        }
        var track = levels[trackId];
        if (!track) {
            this.warn('Audio track is undefined on fragment load progress');
            return;
        }
        var details = track.details;
        if (!details) {
            this.warn('Audio track details undefined on fragment load progress');
            this.removeUnbufferedFrags(frag.start);
            return;
        }
        var audioCodec = config.defaultAudioCodec || track.audioCodec || 'mp4a.40.2';
        var transmuxer = this.transmuxer;
        if (!transmuxer) {
            transmuxer = this.transmuxer = new transmuxer_interface_1.default(this.hls, loader_1.PlaylistLevelType.AUDIO, this._handleTransmuxComplete.bind(this), this._handleTransmuxerFlush.bind(this));
        }
        // Check if we have video initPTS
        // If not we need to wait for it
        var initPTS = this.initPTS[frag.cc];
        var initSegmentData = (_a = frag.initSegment) === null || _a === void 0 ? void 0 : _a.data;
        if (initPTS !== undefined) {
            // this.log(`Transmuxing ${sn} of [${details.startSN} ,${details.endSN}],track ${trackId}`);
            // time Offset is accurate if level PTS is known, or if playlist is not sliding (not live)
            var accurateTimeOffset = false; // details.PTSKnown || !details.live;
            var partIndex = part ? part.index : -1;
            var partial = partIndex !== -1;
            var chunkMeta = new transmuxer_1.ChunkMetadata(frag.level, frag.sn, frag.stats.chunkCount, payload.byteLength, partIndex, partial);
            transmuxer.push(payload, initSegmentData, audioCodec, '', frag, part, details.totalduration, accurateTimeOffset, chunkMeta, initPTS);
        }
        else {
            this.log("Unknown video PTS for cc ".concat(frag.cc, ", waiting for video PTS before demuxing audio frag ").concat(frag.sn, " of [").concat(details.startSN, " ,").concat(details.endSN, "],track ").concat(trackId));
            var cache = (this.waitingData = this.waitingData || {
                frag: frag,
                part: part,
                cache: new chunk_cache_1.default(),
                complete: false,
            }).cache;
            cache.push(new Uint8Array(payload));
            this.waitingVideoCC = this.videoTrackCC;
            this.state = base_stream_controller_1.State.WAITING_INIT_PTS;
        }
    };
    AudioStreamController.prototype._handleFragmentLoadComplete = function (fragLoadedData) {
        if (this.waitingData) {
            this.waitingData.complete = true;
            return;
        }
        _super.prototype._handleFragmentLoadComplete.call(this, fragLoadedData);
    };
    AudioStreamController.prototype.onBufferReset = function ( /* event: Events.BUFFER_RESET */) {
        // reset reference to sourcebuffers
        this.mediaBuffer = this.videoBuffer = null;
        this.loadedmetadata = false;
    };
    AudioStreamController.prototype.onBufferCreated = function (event, data) {
        var audioTrack = data.tracks.audio;
        if (audioTrack) {
            this.mediaBuffer = audioTrack.buffer || null;
        }
        if (data.tracks.video) {
            this.videoBuffer = data.tracks.video.buffer || null;
        }
    };
    AudioStreamController.prototype.onFragBuffered = function (event, data) {
        var frag = data.frag, part = data.part;
        if (frag.type !== loader_1.PlaylistLevelType.AUDIO) {
            if (!this.loadedmetadata && frag.type === loader_1.PlaylistLevelType.MAIN) {
                var bufferable = this.videoBuffer || this.media;
                if (bufferable) {
                    var bufferedTimeRanges = buffer_helper_1.BufferHelper.getBuffered(bufferable);
                    if (bufferedTimeRanges.length) {
                        this.loadedmetadata = true;
                    }
                }
            }
            return;
        }
        if (this.fragContextChanged(frag)) {
            // If a level switch was requested while a fragment was buffering, it will emit the FRAG_BUFFERED event upon completion
            // Avoid setting state back to IDLE or concluding the audio switch; otherwise, the switched-to track will not buffer
            this.warn("Fragment ".concat(frag.sn).concat(part ? ' p: ' + part.index : '', " of level ").concat(frag.level, " finished buffering, but was aborted. state: ").concat(this.state, ", audioSwitch: ").concat(this.switchingTrack ? this.switchingTrack.name : 'false'));
            return;
        }
        if (frag.sn !== 'initSegment') {
            this.fragPrevious = frag;
            var track = this.switchingTrack;
            if (track) {
                this.bufferedTrack = track;
                this.switchingTrack = null;
                this.hls.trigger(events_1.Events.AUDIO_TRACK_SWITCHED, __assign({}, track));
            }
        }
        this.fragBufferedComplete(frag, part);
    };
    AudioStreamController.prototype.onError = function (event, data) {
        var _a;
        if (data.fatal) {
            this.state = base_stream_controller_1.State.ERROR;
            return;
        }
        switch (data.details) {
            case errors_1.ErrorDetails.FRAG_GAP:
            case errors_1.ErrorDetails.FRAG_PARSING_ERROR:
            case errors_1.ErrorDetails.FRAG_DECRYPT_ERROR:
            case errors_1.ErrorDetails.FRAG_LOAD_ERROR:
            case errors_1.ErrorDetails.FRAG_LOAD_TIMEOUT:
            case errors_1.ErrorDetails.KEY_LOAD_ERROR:
            case errors_1.ErrorDetails.KEY_LOAD_TIMEOUT:
                this.onFragmentOrKeyLoadError(loader_1.PlaylistLevelType.AUDIO, data);
                break;
            case errors_1.ErrorDetails.AUDIO_TRACK_LOAD_ERROR:
            case errors_1.ErrorDetails.AUDIO_TRACK_LOAD_TIMEOUT:
            case errors_1.ErrorDetails.LEVEL_PARSING_ERROR:
                // in case of non fatal error while loading track, if not retrying to load track, switch back to IDLE
                if (!data.levelRetry &&
                    this.state === base_stream_controller_1.State.WAITING_TRACK &&
                    ((_a = data.context) === null || _a === void 0 ? void 0 : _a.type) === loader_1.PlaylistContextType.AUDIO_TRACK) {
                    this.state = base_stream_controller_1.State.IDLE;
                }
                break;
            case errors_1.ErrorDetails.BUFFER_APPEND_ERROR:
            case errors_1.ErrorDetails.BUFFER_FULL_ERROR:
                if (!data.parent || data.parent !== 'audio') {
                    return;
                }
                if (data.details === errors_1.ErrorDetails.BUFFER_APPEND_ERROR) {
                    this.resetLoadingState();
                    return;
                }
                if (this.reduceLengthAndFlushBuffer(data)) {
                    this.bufferedTrack = null;
                    _super.prototype.flushMainBuffer.call(this, 0, Number.POSITIVE_INFINITY, 'audio');
                }
                break;
            case errors_1.ErrorDetails.INTERNAL_EXCEPTION:
                this.recoverWorkerError(data);
                break;
            default:
                break;
        }
    };
    AudioStreamController.prototype.onBufferFlushing = function (event, _a) {
        var type = _a.type;
        if (type !== fragment_1.ElementaryStreamTypes.VIDEO) {
            this.flushing = true;
        }
    };
    AudioStreamController.prototype.onBufferFlushed = function (event, _a) {
        var type = _a.type;
        if (type !== fragment_1.ElementaryStreamTypes.VIDEO) {
            this.flushing = false;
            this.bufferFlushed = true;
            if (this.state === base_stream_controller_1.State.ENDED) {
                this.state = base_stream_controller_1.State.IDLE;
            }
            var mediaBuffer = this.mediaBuffer || this.media;
            if (mediaBuffer) {
                this.afterBufferFlushed(mediaBuffer, type, loader_1.PlaylistLevelType.AUDIO);
                this.tick();
            }
        }
    };
    AudioStreamController.prototype._handleTransmuxComplete = function (transmuxResult) {
        var _a;
        var id = 'audio';
        var hls = this.hls;
        var remuxResult = transmuxResult.remuxResult, chunkMeta = transmuxResult.chunkMeta;
        var context = this.getCurrentContext(chunkMeta);
        if (!context) {
            this.resetWhenMissingContext(chunkMeta);
            return;
        }
        var frag = context.frag, part = context.part, level = context.level;
        var details = level.details;
        var audio = remuxResult.audio, text = remuxResult.text, id3 = remuxResult.id3, initSegment = remuxResult.initSegment;
        // Check if the current fragment has been aborted. We check this by first seeing if we're still playing the current level.
        // If we are, subsequently check if the currently loading fragment (fragCurrent) has changed.
        if (this.fragContextChanged(frag) || !details) {
            this.fragmentTracker.removeFragment(frag);
            return;
        }
        this.state = base_stream_controller_1.State.PARSING;
        if (this.switchingTrack && audio) {
            this.completeAudioSwitch(this.switchingTrack);
        }
        if (initSegment === null || initSegment === void 0 ? void 0 : initSegment.tracks) {
            var mapFragment = frag.initSegment || frag;
            this._bufferInitSegment(level, initSegment.tracks, mapFragment, chunkMeta);
            hls.trigger(events_1.Events.FRAG_PARSING_INIT_SEGMENT, {
                frag: mapFragment,
                id: id,
                tracks: initSegment.tracks,
            });
            // Only flush audio from old audio tracks when PTS is known on new audio track
        }
        if (audio) {
            var startPTS = audio.startPTS, endPTS = audio.endPTS, startDTS = audio.startDTS, endDTS = audio.endDTS;
            if (part) {
                part.elementaryStreams[fragment_1.ElementaryStreamTypes.AUDIO] = {
                    startPTS: startPTS,
                    endPTS: endPTS,
                    startDTS: startDTS,
                    endDTS: endDTS,
                };
            }
            frag.setElementaryStreamInfo(fragment_1.ElementaryStreamTypes.AUDIO, startPTS, endPTS, startDTS, endDTS);
            this.bufferFragmentData(audio, frag, part, chunkMeta);
        }
        if ((_a = id3 === null || id3 === void 0 ? void 0 : id3.samples) === null || _a === void 0 ? void 0 : _a.length) {
            var emittedID3 = Object.assign({
                id: id,
                frag: frag,
                details: details,
            }, id3);
            hls.trigger(events_1.Events.FRAG_PARSING_METADATA, emittedID3);
        }
        if (text) {
            var emittedText = Object.assign({
                id: id,
                frag: frag,
                details: details,
            }, text);
            hls.trigger(events_1.Events.FRAG_PARSING_USERDATA, emittedText);
        }
    };
    AudioStreamController.prototype._bufferInitSegment = function (currentLevel, tracks, frag, chunkMeta) {
        if (this.state !== base_stream_controller_1.State.PARSING) {
            return;
        }
        // delete any video track found on audio transmuxer
        if (tracks.video) {
            delete tracks.video;
        }
        // include levelCodec in audio and video tracks
        var track = tracks.audio;
        if (!track) {
            return;
        }
        track.id = 'audio';
        var variantAudioCodecs = currentLevel.audioCodec;
        this.log("Init audio buffer, container:".concat(track.container, ", codecs[level/parsed]=[").concat(variantAudioCodecs, "/").concat(track.codec, "]"));
        // SourceBuffer will use track.levelCodec if defined
        if (variantAudioCodecs && variantAudioCodecs.split(',').length === 1) {
            track.levelCodec = variantAudioCodecs;
        }
        this.hls.trigger(events_1.Events.BUFFER_CODECS, tracks);
        var initSegment = track.initSegment;
        if (initSegment === null || initSegment === void 0 ? void 0 : initSegment.byteLength) {
            var segment = {
                type: 'audio',
                frag: frag,
                part: null,
                chunkMeta: chunkMeta,
                parent: frag.type,
                data: initSegment,
            };
            this.hls.trigger(events_1.Events.BUFFER_APPENDING, segment);
        }
        // trigger handler right now
        this.tickImmediate();
    };
    AudioStreamController.prototype.loadFragment = function (frag, track, targetBufferTime) {
        var _a;
        // only load if fragment is not loaded or if in audio switch
        var fragState = this.fragmentTracker.getState(frag);
        this.fragCurrent = frag;
        // we force a frag loading in audio switch as fragment tracker might not have evicted previous frags in case of quick audio switch
        if (this.switchingTrack ||
            fragState === fragment_tracker_1.FragmentState.NOT_LOADED ||
            fragState === fragment_tracker_1.FragmentState.PARTIAL) {
            if (frag.sn === 'initSegment') {
                this._loadInitSegment(frag, track);
            }
            else if (((_a = track.details) === null || _a === void 0 ? void 0 : _a.live) && !this.initPTS[frag.cc]) {
                this.log("Waiting for video PTS in continuity counter ".concat(frag.cc, " of live stream before loading audio fragment ").concat(frag.sn, " of level ").concat(this.trackId));
                this.state = base_stream_controller_1.State.WAITING_INIT_PTS;
                var mainDetails = this.mainDetails;
                if (mainDetails &&
                    mainDetails.fragments[0].start !== track.details.fragments[0].start) {
                    (0, discontinuities_1.alignMediaPlaylistByPDT)(track.details, mainDetails);
                }
            }
            else {
                this.startFragRequested = true;
                _super.prototype.loadFragment.call(this, frag, track, targetBufferTime);
            }
        }
        else {
            this.clearTrackerIfNeeded(frag);
        }
    };
    AudioStreamController.prototype.flushAudioIfNeeded = function (switchingTrack) {
        if (this.media && this.bufferedTrack) {
            var _a = this.bufferedTrack, name_1 = _a.name, lang = _a.lang, assocLang = _a.assocLang, characteristics = _a.characteristics, audioCodec = _a.audioCodec, channels = _a.channels;
            if (!(0, rendition_helper_1.matchesOption)({ name: name_1, lang: lang, assocLang: assocLang, characteristics: characteristics, audioCodec: audioCodec, channels: channels }, switchingTrack, rendition_helper_1.audioMatchPredicate)) {
                this.log('Switching audio track : flushing all audio');
                _super.prototype.flushMainBuffer.call(this, 0, Number.POSITIVE_INFINITY, 'audio');
                this.bufferedTrack = null;
            }
        }
    };
    AudioStreamController.prototype.completeAudioSwitch = function (switchingTrack) {
        var hls = this.hls;
        this.flushAudioIfNeeded(switchingTrack);
        this.bufferedTrack = switchingTrack;
        this.switchingTrack = null;
        hls.trigger(events_1.Events.AUDIO_TRACK_SWITCHED, __assign({}, switchingTrack));
    };
    return AudioStreamController;
}(base_stream_controller_1.default));
exports.default = AudioStreamController;
