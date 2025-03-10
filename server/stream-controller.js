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
var base_stream_controller_1 = require("./base-stream-controller");
var is_supported_1 = require("../is-supported");
var events_1 = require("../events");
var buffer_helper_1 = require("../utils/buffer-helper");
var fragment_tracker_1 = require("./fragment-tracker");
var loader_1 = require("../types/loader");
var fragment_1 = require("../loader/fragment");
var transmuxer_interface_1 = require("../demux/transmuxer-interface");
var transmuxer_1 = require("../types/transmuxer");
var gap_controller_1 = require("./gap-controller");
var errors_1 = require("../errors");
var TICK_INTERVAL = 100; // how often to tick in ms
var StreamController = /** @class */ (function (_super) {
    __extends(StreamController, _super);
    function StreamController(hls, fragmentTracker, keyLoader) {
        var _this = _super.call(this, hls, fragmentTracker, keyLoader, '[stream-controller]', loader_1.PlaylistLevelType.MAIN) || this;
        _this.audioCodecSwap = false;
        _this.gapController = null;
        _this.level = -1;
        _this._forceStartLoad = false;
        _this.altAudio = false;
        _this.audioOnly = false;
        _this.fragPlaying = null;
        _this.onvplaying = null;
        _this.onvseeked = null;
        _this.fragLastKbps = 0;
        _this.couldBacktrack = false;
        _this.backtrackFragment = null;
        _this.audioCodecSwitch = false;
        _this.videoBuffer = null;
        _this._registerListeners();
        return _this;
    }
    StreamController.prototype._registerListeners = function () {
        var hls = this.hls;
        hls.on(events_1.Events.MEDIA_ATTACHED, this.onMediaAttached, this);
        hls.on(events_1.Events.MEDIA_DETACHING, this.onMediaDetaching, this);
        hls.on(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.on(events_1.Events.MANIFEST_PARSED, this.onManifestParsed, this);
        hls.on(events_1.Events.LEVEL_LOADING, this.onLevelLoading, this);
        hls.on(events_1.Events.LEVEL_LOADED, this.onLevelLoaded, this);
        hls.on(events_1.Events.FRAG_LOAD_EMERGENCY_ABORTED, this.onFragLoadEmergencyAborted, this);
        hls.on(events_1.Events.ERROR, this.onError, this);
        hls.on(events_1.Events.AUDIO_TRACK_SWITCHING, this.onAudioTrackSwitching, this);
        hls.on(events_1.Events.AUDIO_TRACK_SWITCHED, this.onAudioTrackSwitched, this);
        hls.on(events_1.Events.BUFFER_CREATED, this.onBufferCreated, this);
        hls.on(events_1.Events.BUFFER_FLUSHED, this.onBufferFlushed, this);
        hls.on(events_1.Events.LEVELS_UPDATED, this.onLevelsUpdated, this);
        hls.on(events_1.Events.FRAG_BUFFERED, this.onFragBuffered, this);
    };
    StreamController.prototype._unregisterListeners = function () {
        var hls = this.hls;
        hls.off(events_1.Events.MEDIA_ATTACHED, this.onMediaAttached, this);
        hls.off(events_1.Events.MEDIA_DETACHING, this.onMediaDetaching, this);
        hls.off(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.off(events_1.Events.MANIFEST_PARSED, this.onManifestParsed, this);
        hls.off(events_1.Events.LEVEL_LOADED, this.onLevelLoaded, this);
        hls.off(events_1.Events.FRAG_LOAD_EMERGENCY_ABORTED, this.onFragLoadEmergencyAborted, this);
        hls.off(events_1.Events.ERROR, this.onError, this);
        hls.off(events_1.Events.AUDIO_TRACK_SWITCHING, this.onAudioTrackSwitching, this);
        hls.off(events_1.Events.AUDIO_TRACK_SWITCHED, this.onAudioTrackSwitched, this);
        hls.off(events_1.Events.BUFFER_CREATED, this.onBufferCreated, this);
        hls.off(events_1.Events.BUFFER_FLUSHED, this.onBufferFlushed, this);
        hls.off(events_1.Events.LEVELS_UPDATED, this.onLevelsUpdated, this);
        hls.off(events_1.Events.FRAG_BUFFERED, this.onFragBuffered, this);
    };
    StreamController.prototype.onHandlerDestroying = function () {
        this._unregisterListeners();
        _super.prototype.onHandlerDestroying.call(this);
    };
    StreamController.prototype.startLoad = function (startPosition) {
        if (this.levels) {
            var _a = this, lastCurrentTime = _a.lastCurrentTime, hls = _a.hls;
            this.stopLoad();
            this.setInterval(TICK_INTERVAL);
            this.level = -1;
            if (!this.startFragRequested) {
                // determine load level
                var startLevel = hls.startLevel;
                if (startLevel === -1) {
                    if (hls.config.testBandwidth && this.levels.length > 1) {
                        // -1 : guess start Level by doing a bitrate test by loading first fragment of lowest quality level
                        startLevel = 0;
                        this.bitrateTest = true;
                    }
                    else {
                        startLevel = hls.firstAutoLevel;
                    }
                }
                // set new level to playlist loader : this will trigger start level load
                // hls.nextLoadLevel remains until it is set to a new value or until a new frag is successfully loaded
                hls.nextLoadLevel = startLevel;
                this.level = hls.loadLevel;
                this.loadedmetadata = false;
            }
            // if startPosition undefined but lastCurrentTime set, set startPosition to last currentTime
            if (lastCurrentTime > 0 && startPosition === -1) {
                this.log("Override startPosition with lastCurrentTime @".concat(lastCurrentTime.toFixed(3)));
                startPosition = lastCurrentTime;
            }
            this.state = base_stream_controller_1.State.IDLE;
            this.nextLoadPosition =
                this.startPosition =
                    this.lastCurrentTime =
                        startPosition;
            this.tick();
        }
        else {
            this._forceStartLoad = true;
            this.state = base_stream_controller_1.State.STOPPED;
        }
    };
    StreamController.prototype.stopLoad = function () {
        this._forceStartLoad = false;
        _super.prototype.stopLoad.call(this);
    };
    StreamController.prototype.doTick = function () {
        var _a;
        switch (this.state) {
            case base_stream_controller_1.State.WAITING_LEVEL: {
                var _b = this, levels = _b.levels, level = _b.level;
                var currentLevel = levels === null || levels === void 0 ? void 0 : levels[level];
                var details = currentLevel === null || currentLevel === void 0 ? void 0 : currentLevel.details;
                if (details &&
                    (!details.live || this.levelLastLoaded === currentLevel)) {
                    if (this.waitForCdnTuneIn(details)) {
                        break;
                    }
                    this.state = base_stream_controller_1.State.IDLE;
                    break;
                }
                else if (this.hls.nextLoadLevel !== this.level) {
                    this.state = base_stream_controller_1.State.IDLE;
                    break;
                }
                break;
            }
            case base_stream_controller_1.State.FRAG_LOADING_WAITING_RETRY:
                {
                    var now = self.performance.now();
                    var retryDate = this.retryDate;
                    // if current time is gt than retryDate, or if media seeking let's switch to IDLE state to retry loading
                    if (!retryDate || now >= retryDate || ((_a = this.media) === null || _a === void 0 ? void 0 : _a.seeking)) {
                        var _c = this, levels = _c.levels, level = _c.level;
                        var currentLevel = levels === null || levels === void 0 ? void 0 : levels[level];
                        this.resetStartWhenNotLoaded(currentLevel || null);
                        this.state = base_stream_controller_1.State.IDLE;
                    }
                }
                break;
            default:
                break;
        }
        if (this.state === base_stream_controller_1.State.IDLE) {
            this.doTickIdle();
        }
        this.onTickEnd();
    };
    StreamController.prototype.onTickEnd = function () {
        _super.prototype.onTickEnd.call(this);
        this.checkBuffer();
        this.checkFragmentChanged();
    };
    StreamController.prototype.doTickIdle = function () {
        var _a;
        var _b = this, hls = _b.hls, levelLastLoaded = _b.levelLastLoaded, levels = _b.levels, media = _b.media;
        // if start level not parsed yet OR
        // if video not attached AND start fragment already requested OR start frag prefetch not enabled
        // exit loop, as we either need more info (level not parsed) or we need media to be attached to load new fragment
        if (levelLastLoaded === null ||
            (!media && (this.startFragRequested || !hls.config.startFragPrefetch))) {
            return;
        }
        // If the "main" level is audio-only but we are loading an alternate track in the same group, do not load anything
        if (this.altAudio && this.audioOnly) {
            return;
        }
        var level = this.buffering ? hls.nextLoadLevel : hls.loadLevel;
        if (!(levels === null || levels === void 0 ? void 0 : levels[level])) {
            return;
        }
        var levelInfo = levels[level];
        // if buffer length is less than maxBufLen try to load a new fragment
        var bufferInfo = this.getMainFwdBufferInfo();
        if (bufferInfo === null) {
            return;
        }
        var lastDetails = this.getLevelDetails();
        if (lastDetails && this._streamEnded(bufferInfo, lastDetails)) {
            var data = {};
            if (this.altAudio) {
                data.type = 'video';
            }
            this.hls.trigger(events_1.Events.BUFFER_EOS, data);
            this.state = base_stream_controller_1.State.ENDED;
            return;
        }
        if (!this.buffering) {
            return;
        }
        // set next load level : this will trigger a playlist load if needed
        if (hls.loadLevel !== level && hls.manualLevel === -1) {
            this.log("Adapting to level ".concat(level, " from level ").concat(this.level));
        }
        this.level = hls.nextLoadLevel = level;
        var levelDetails = levelInfo.details;
        // if level info not retrieved yet, switch state and wait for level retrieval
        // if live playlist, ensure that new playlist has been refreshed to avoid loading/try to load
        // a useless and outdated fragment (that might even introduce load error if it is already out of the live playlist)
        if (!levelDetails ||
            this.state === base_stream_controller_1.State.WAITING_LEVEL ||
            (levelDetails.live && this.levelLastLoaded !== levelInfo)) {
            this.level = level;
            this.state = base_stream_controller_1.State.WAITING_LEVEL;
            return;
        }
        var bufferLen = bufferInfo.len;
        // compute max Buffer Length that we could get from this load level, based on level bitrate. don't buffer more than 60 MB and more than 30s
        var maxBufLen = this.getMaxBufferLength(levelInfo.maxBitrate);
        // Stay idle if we are still with buffer margins
        if (bufferLen >= maxBufLen) {
            return;
        }
        if (this.backtrackFragment &&
            this.backtrackFragment.start > bufferInfo.end) {
            this.backtrackFragment = null;
        }
        var targetBufferTime = this.backtrackFragment
            ? this.backtrackFragment.start
            : bufferInfo.end;
        var frag = this.getNextFragment(targetBufferTime, levelDetails);
        // Avoid backtracking by loading an earlier segment in streams with segments that do not start with a key frame (flagged by `couldBacktrack`)
        if (this.couldBacktrack &&
            !this.fragPrevious &&
            frag &&
            frag.sn !== 'initSegment' &&
            this.fragmentTracker.getState(frag) !== fragment_tracker_1.FragmentState.OK) {
            var backtrackSn = ((_a = this.backtrackFragment) !== null && _a !== void 0 ? _a : frag).sn;
            var fragIdx = backtrackSn - levelDetails.startSN;
            var backtrackFrag = levelDetails.fragments[fragIdx - 1];
            if (backtrackFrag && frag.cc === backtrackFrag.cc) {
                frag = backtrackFrag;
                this.fragmentTracker.removeFragment(backtrackFrag);
            }
        }
        else if (this.backtrackFragment && bufferInfo.len) {
            this.backtrackFragment = null;
        }
        // Avoid loop loading by using nextLoadPosition set for backtracking and skipping consecutive GAP tags
        if (frag && this.isLoopLoading(frag, targetBufferTime)) {
            var gapStart = frag.gap;
            if (!gapStart) {
                // Cleanup the fragment tracker before trying to find the next unbuffered fragment
                var type = this.audioOnly && !this.altAudio
                    ? fragment_1.ElementaryStreamTypes.AUDIO
                    : fragment_1.ElementaryStreamTypes.VIDEO;
                var mediaBuffer = (type === fragment_1.ElementaryStreamTypes.VIDEO
                    ? this.videoBuffer
                    : this.mediaBuffer) || this.media;
                if (mediaBuffer) {
                    this.afterBufferFlushed(mediaBuffer, type, loader_1.PlaylistLevelType.MAIN);
                }
            }
            frag = this.getNextFragmentLoopLoading(frag, levelDetails, bufferInfo, loader_1.PlaylistLevelType.MAIN, maxBufLen);
        }
        if (!frag) {
            return;
        }
        if (frag.initSegment && !frag.initSegment.data && !this.bitrateTest) {
            frag = frag.initSegment;
        }
        this.loadFragment(frag, levelInfo, targetBufferTime);
    };
    StreamController.prototype.loadFragment = function (frag, level, targetBufferTime) {
        // Check if fragment is not loaded
        var fragState = this.fragmentTracker.getState(frag);
        this.fragCurrent = frag;
        if (fragState === fragment_tracker_1.FragmentState.NOT_LOADED ||
            fragState === fragment_tracker_1.FragmentState.PARTIAL) {
            if (frag.sn === 'initSegment') {
                this._loadInitSegment(frag, level);
            }
            else if (this.bitrateTest) {
                this.log("Fragment ".concat(frag.sn, " of level ").concat(frag.level, " is being downloaded to test bitrate and will not be buffered"));
                this._loadBitrateTestFrag(frag, level);
            }
            else {
                this.startFragRequested = true;
                _super.prototype.loadFragment.call(this, frag, level, targetBufferTime);
            }
        }
        else {
            this.clearTrackerIfNeeded(frag);
        }
    };
    StreamController.prototype.getBufferedFrag = function (position) {
        return this.fragmentTracker.getBufferedFrag(position, loader_1.PlaylistLevelType.MAIN);
    };
    StreamController.prototype.followingBufferedFrag = function (frag) {
        if (frag) {
            // try to get range of next fragment (500ms after this range)
            return this.getBufferedFrag(frag.end + 0.5);
        }
        return null;
    };
    /*
      on immediate level switch :
       - pause playback if playing
       - cancel any pending load request
       - and trigger a buffer flush
    */
    StreamController.prototype.immediateLevelSwitch = function () {
        this.abortCurrentFrag();
        this.flushMainBuffer(0, Number.POSITIVE_INFINITY);
    };
    /**
     * try to switch ASAP without breaking video playback:
     * in order to ensure smooth but quick level switching,
     * we need to find the next flushable buffer range
     * we should take into account new segment fetch time
     */
    StreamController.prototype.nextLevelSwitch = function () {
        var _a = this, levels = _a.levels, media = _a.media;
        // ensure that media is defined and that metadata are available (to retrieve currentTime)
        if (media === null || media === void 0 ? void 0 : media.readyState) {
            var fetchdelay = void 0;
            var fragPlayingCurrent = this.getAppendedFrag(media.currentTime);
            if (fragPlayingCurrent && fragPlayingCurrent.start > 1) {
                // flush buffer preceding current fragment (flush until current fragment start offset)
                // minus 1s to avoid video freezing, that could happen if we flush keyframe of current video ...
                this.flushMainBuffer(0, fragPlayingCurrent.start - 1);
            }
            var levelDetails = this.getLevelDetails();
            if (levelDetails === null || levelDetails === void 0 ? void 0 : levelDetails.live) {
                var bufferInfo = this.getMainFwdBufferInfo();
                // Do not flush in live stream with low buffer
                if (!bufferInfo || bufferInfo.len < levelDetails.targetduration * 2) {
                    return;
                }
            }
            if (!media.paused && levels) {
                // add a safety delay of 1s
                var nextLevelId = this.hls.nextLoadLevel;
                var nextLevel = levels[nextLevelId];
                var fragLastKbps = this.fragLastKbps;
                if (fragLastKbps && this.fragCurrent) {
                    fetchdelay =
                        (this.fragCurrent.duration * nextLevel.maxBitrate) /
                            (1000 * fragLastKbps) +
                            1;
                }
                else {
                    fetchdelay = 0;
                }
            }
            else {
                fetchdelay = 0;
            }
            // this.log('fetchdelay:'+fetchdelay);
            // find buffer range that will be reached once new fragment will be fetched
            var bufferedFrag = this.getBufferedFrag(media.currentTime + fetchdelay);
            if (bufferedFrag) {
                // we can flush buffer range following this one without stalling playback
                var nextBufferedFrag = this.followingBufferedFrag(bufferedFrag);
                if (nextBufferedFrag) {
                    // if we are here, we can also cancel any loading/demuxing in progress, as they are useless
                    this.abortCurrentFrag();
                    // start flush position is in next buffered frag. Leave some padding for non-independent segments and smoother playback.
                    var maxStart = nextBufferedFrag.maxStartPTS
                        ? nextBufferedFrag.maxStartPTS
                        : nextBufferedFrag.start;
                    var fragDuration = nextBufferedFrag.duration;
                    var startPts = Math.max(bufferedFrag.end, maxStart +
                        Math.min(Math.max(fragDuration - this.config.maxFragLookUpTolerance, fragDuration * (this.couldBacktrack ? 0.5 : 0.125)), fragDuration * (this.couldBacktrack ? 0.75 : 0.25)));
                    this.flushMainBuffer(startPts, Number.POSITIVE_INFINITY);
                }
            }
        }
    };
    StreamController.prototype.abortCurrentFrag = function () {
        var fragCurrent = this.fragCurrent;
        this.fragCurrent = null;
        this.backtrackFragment = null;
        if (fragCurrent) {
            fragCurrent.abortRequests();
            this.fragmentTracker.removeFragment(fragCurrent);
        }
        switch (this.state) {
            case base_stream_controller_1.State.KEY_LOADING:
            case base_stream_controller_1.State.FRAG_LOADING:
            case base_stream_controller_1.State.FRAG_LOADING_WAITING_RETRY:
            case base_stream_controller_1.State.PARSING:
            case base_stream_controller_1.State.PARSED:
                this.state = base_stream_controller_1.State.IDLE;
                break;
        }
        this.nextLoadPosition = this.getLoadPosition();
    };
    StreamController.prototype.flushMainBuffer = function (startOffset, endOffset) {
        _super.prototype.flushMainBuffer.call(this, startOffset, endOffset, this.altAudio ? 'video' : null);
    };
    StreamController.prototype.onMediaAttached = function (event, data) {
        _super.prototype.onMediaAttached.call(this, event, data);
        var media = data.media;
        this.onvplaying = this.onMediaPlaying.bind(this);
        this.onvseeked = this.onMediaSeeked.bind(this);
        media.addEventListener('playing', this.onvplaying);
        media.addEventListener('seeked', this.onvseeked);
        this.gapController = new gap_controller_1.default(this.config, media, this.fragmentTracker, this.hls);
    };
    StreamController.prototype.onMediaDetaching = function () {
        var media = this.media;
        if (media && this.onvplaying && this.onvseeked) {
            media.removeEventListener('playing', this.onvplaying);
            media.removeEventListener('seeked', this.onvseeked);
            this.onvplaying = this.onvseeked = null;
            this.videoBuffer = null;
        }
        this.fragPlaying = null;
        if (this.gapController) {
            this.gapController.destroy();
            this.gapController = null;
        }
        _super.prototype.onMediaDetaching.call(this);
    };
    StreamController.prototype.onMediaPlaying = function () {
        // tick to speed up FRAG_CHANGED triggering
        this.tick();
    };
    StreamController.prototype.onMediaSeeked = function () {
        var media = this.media;
        var currentTime = media ? media.currentTime : null;
        if (Number.isFinite(currentTime)) {
            this.log("Media seeked to ".concat(currentTime.toFixed(3)));
        }
        // If seeked was issued before buffer was appended do not tick immediately
        var bufferInfo = this.getMainFwdBufferInfo();
        if (bufferInfo === null || bufferInfo.len === 0) {
            this.warn("Main forward buffer length on \"seeked\" event ".concat(bufferInfo ? bufferInfo.len : 'empty', ")"));
            return;
        }
        // tick to speed up FRAG_CHANGED triggering
        this.tick();
    };
    StreamController.prototype.onManifestLoading = function () {
        // reset buffer on manifest loading
        this.log('Trigger BUFFER_RESET');
        this.hls.trigger(events_1.Events.BUFFER_RESET, undefined);
        this.fragmentTracker.removeAllFragments();
        this.couldBacktrack = false;
        this.startPosition = this.lastCurrentTime = this.fragLastKbps = 0;
        this.levels =
            this.fragPlaying =
                this.backtrackFragment =
                    this.levelLastLoaded =
                        null;
        this.altAudio = this.audioOnly = this.startFragRequested = false;
    };
    StreamController.prototype.onManifestParsed = function (event, data) {
        // detect if we have different kind of audio codecs used amongst playlists
        var aac = false;
        var heaac = false;
        data.levels.forEach(function (level) {
            var codec = level.audioCodec;
            if (codec) {
                aac = aac || codec.indexOf('mp4a.40.2') !== -1;
                heaac = heaac || codec.indexOf('mp4a.40.5') !== -1;
            }
        });
        this.audioCodecSwitch = aac && heaac && !(0, is_supported_1.changeTypeSupported)();
        if (this.audioCodecSwitch) {
            this.log('Both AAC/HE-AAC audio found in levels; declaring level codec as HE-AAC');
        }
        this.levels = data.levels;
        this.startFragRequested = false;
    };
    StreamController.prototype.onLevelLoading = function (event, data) {
        var levels = this.levels;
        if (!levels || this.state !== base_stream_controller_1.State.IDLE) {
            return;
        }
        var level = levels[data.level];
        if (!level.details ||
            (level.details.live && this.levelLastLoaded !== level) ||
            this.waitForCdnTuneIn(level.details)) {
            this.state = base_stream_controller_1.State.WAITING_LEVEL;
        }
    };
    StreamController.prototype.onLevelLoaded = function (event, data) {
        var _a, _b;
        var levels = this.levels;
        var newLevelId = data.level;
        var newDetails = data.details;
        var duration = newDetails.totalduration;
        if (!levels) {
            this.warn("Levels were reset while loading level ".concat(newLevelId));
            return;
        }
        this.log("Level ".concat(newLevelId, " loaded [").concat(newDetails.startSN, ",").concat(newDetails.endSN, "]").concat(newDetails.lastPartSn
            ? "[part-".concat(newDetails.lastPartSn, "-").concat(newDetails.lastPartIndex, "]")
            : '', ", cc [").concat(newDetails.startCC, ", ").concat(newDetails.endCC, "] duration:").concat(duration));
        var curLevel = levels[newLevelId];
        var fragCurrent = this.fragCurrent;
        if (fragCurrent &&
            (this.state === base_stream_controller_1.State.FRAG_LOADING ||
                this.state === base_stream_controller_1.State.FRAG_LOADING_WAITING_RETRY)) {
            if (fragCurrent.level !== data.level && fragCurrent.loader) {
                this.abortCurrentFrag();
            }
        }
        var sliding = 0;
        if (newDetails.live || ((_a = curLevel.details) === null || _a === void 0 ? void 0 : _a.live)) {
            this.checkLiveUpdate(newDetails);
            if (newDetails.deltaUpdateFailed) {
                return;
            }
            sliding = this.alignPlaylists(newDetails, curLevel.details, (_b = this.levelLastLoaded) === null || _b === void 0 ? void 0 : _b.details);
        }
        // override level info
        curLevel.details = newDetails;
        this.levelLastLoaded = curLevel;
        this.hls.trigger(events_1.Events.LEVEL_UPDATED, {
            details: newDetails,
            level: newLevelId,
        });
        // only switch back to IDLE state if we were waiting for level to start downloading a new fragment
        if (this.state === base_stream_controller_1.State.WAITING_LEVEL) {
            if (this.waitForCdnTuneIn(newDetails)) {
                // Wait for Low-Latency CDN Tune-in
                return;
            }
            this.state = base_stream_controller_1.State.IDLE;
        }
        if (!this.startFragRequested) {
            this.setStartPosition(newDetails, sliding);
        }
        else if (newDetails.live) {
            this.synchronizeToLiveEdge(newDetails);
        }
        // trigger handler right now
        this.tick();
    };
    StreamController.prototype._handleFragmentLoadProgress = function (data) {
        var _a;
        var frag = data.frag, part = data.part, payload = data.payload;
        var levels = this.levels;
        if (!levels) {
            this.warn("Levels were reset while fragment load was in progress. Fragment ".concat(frag.sn, " of level ").concat(frag.level, " will not be buffered"));
            return;
        }
        var currentLevel = levels[frag.level];
        var details = currentLevel.details;
        if (!details) {
            this.warn("Dropping fragment ".concat(frag.sn, " of level ").concat(frag.level, " after level details were reset"));
            this.fragmentTracker.removeFragment(frag);
            return;
        }
        var videoCodec = currentLevel.videoCodec;
        // time Offset is accurate if level PTS is known, or if playlist is not sliding (not live)
        var accurateTimeOffset = details.PTSKnown || !details.live;
        var initSegmentData = (_a = frag.initSegment) === null || _a === void 0 ? void 0 : _a.data;
        var audioCodec = this._getAudioCodec(currentLevel);
        // transmux the MPEG-TS data to ISO-BMFF segments
        // this.log(`Transmuxing ${frag.sn} of [${details.startSN} ,${details.endSN}],level ${frag.level}, cc ${frag.cc}`);
        var transmuxer = (this.transmuxer =
            this.transmuxer ||
                new transmuxer_interface_1.default(this.hls, loader_1.PlaylistLevelType.MAIN, this._handleTransmuxComplete.bind(this), this._handleTransmuxerFlush.bind(this)));
        var partIndex = part ? part.index : -1;
        var partial = partIndex !== -1;
        var chunkMeta = new transmuxer_1.ChunkMetadata(frag.level, frag.sn, frag.stats.chunkCount, payload.byteLength, partIndex, partial);
        var initPTS = this.initPTS[frag.cc];
        transmuxer.push(payload, initSegmentData, audioCodec, videoCodec, frag, part, details.totalduration, accurateTimeOffset, chunkMeta, initPTS);
    };
    StreamController.prototype.onAudioTrackSwitching = function (event, data) {
        // if any URL found on new audio track, it is an alternate audio track
        var fromAltAudio = this.altAudio;
        var altAudio = !!data.url;
        // if we switch on main audio, ensure that main fragment scheduling is synced with media.buffered
        // don't do anything if we switch to alt audio: audio stream controller is handling it.
        // we will just have to change buffer scheduling on audioTrackSwitched
        if (!altAudio) {
            if (this.mediaBuffer !== this.media) {
                this.log('Switching on main audio, use media.buffered to schedule main fragment loading');
                this.mediaBuffer = this.media;
                var fragCurrent = this.fragCurrent;
                // we need to refill audio buffer from main: cancel any frag loading to speed up audio switch
                if (fragCurrent) {
                    this.log('Switching to main audio track, cancel main fragment load');
                    fragCurrent.abortRequests();
                    this.fragmentTracker.removeFragment(fragCurrent);
                }
                // destroy transmuxer to force init segment generation (following audio switch)
                this.resetTransmuxer();
                // switch to IDLE state to load new fragment
                this.resetLoadingState();
            }
            else if (this.audioOnly) {
                // Reset audio transmuxer so when switching back to main audio we're not still appending where we left off
                this.resetTransmuxer();
            }
            var hls = this.hls;
            // If switching from alt to main audio, flush all audio and trigger track switched
            if (fromAltAudio) {
                hls.trigger(events_1.Events.BUFFER_FLUSHING, {
                    startOffset: 0,
                    endOffset: Number.POSITIVE_INFINITY,
                    type: null,
                });
                this.fragmentTracker.removeAllFragments();
            }
            hls.trigger(events_1.Events.AUDIO_TRACK_SWITCHED, data);
        }
    };
    StreamController.prototype.onAudioTrackSwitched = function (event, data) {
        var trackId = data.id;
        var altAudio = !!this.hls.audioTracks[trackId].url;
        if (altAudio) {
            var videoBuffer = this.videoBuffer;
            // if we switched on alternate audio, ensure that main fragment scheduling is synced with video sourcebuffer buffered
            if (videoBuffer && this.mediaBuffer !== videoBuffer) {
                this.log('Switching on alternate audio, use video.buffered to schedule main fragment loading');
                this.mediaBuffer = videoBuffer;
            }
        }
        this.altAudio = altAudio;
        this.tick();
    };
    StreamController.prototype.onBufferCreated = function (event, data) {
        var tracks = data.tracks;
        var mediaTrack;
        var name;
        var alternate = false;
        for (var type in tracks) {
            var track = tracks[type];
            if (track.id === 'main') {
                name = type;
                mediaTrack = track;
                // keep video source buffer reference
                if (type === 'video') {
                    var videoTrack = tracks[type];
                    if (videoTrack) {
                        this.videoBuffer = videoTrack.buffer;
                    }
                }
            }
            else {
                alternate = true;
            }
        }
        if (alternate && mediaTrack) {
            this.log("Alternate track found, use ".concat(name, ".buffered to schedule main fragment loading"));
            this.mediaBuffer = mediaTrack.buffer;
        }
        else {
            this.mediaBuffer = this.media;
        }
    };
    StreamController.prototype.onFragBuffered = function (event, data) {
        var frag = data.frag, part = data.part;
        if (frag && frag.type !== loader_1.PlaylistLevelType.MAIN) {
            return;
        }
        if (this.fragContextChanged(frag)) {
            // If a level switch was requested while a fragment was buffering, it will emit the FRAG_BUFFERED event upon completion
            // Avoid setting state back to IDLE, since that will interfere with a level switch
            this.warn("Fragment ".concat(frag.sn).concat(part ? ' p: ' + part.index : '', " of level ").concat(frag.level, " finished buffering, but was aborted. state: ").concat(this.state));
            if (this.state === base_stream_controller_1.State.PARSED) {
                this.state = base_stream_controller_1.State.IDLE;
            }
            return;
        }
        var stats = part ? part.stats : frag.stats;
        this.fragLastKbps = Math.round((8 * stats.total) / (stats.buffering.end - stats.loading.first));
        if (frag.sn !== 'initSegment') {
            this.fragPrevious = frag;
        }
        this.fragBufferedComplete(frag, part);
    };
    StreamController.prototype.onError = function (event, data) {
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
                this.onFragmentOrKeyLoadError(loader_1.PlaylistLevelType.MAIN, data);
                break;
            case errors_1.ErrorDetails.LEVEL_LOAD_ERROR:
            case errors_1.ErrorDetails.LEVEL_LOAD_TIMEOUT:
            case errors_1.ErrorDetails.LEVEL_PARSING_ERROR:
                // in case of non fatal error while loading level, if level controller is not retrying to load level, switch back to IDLE
                if (!data.levelRetry &&
                    this.state === base_stream_controller_1.State.WAITING_LEVEL &&
                    ((_a = data.context) === null || _a === void 0 ? void 0 : _a.type) === loader_1.PlaylistContextType.LEVEL) {
                    this.state = base_stream_controller_1.State.IDLE;
                }
                break;
            case errors_1.ErrorDetails.BUFFER_APPEND_ERROR:
            case errors_1.ErrorDetails.BUFFER_FULL_ERROR:
                if (!data.parent || data.parent !== 'main') {
                    return;
                }
                if (data.details === errors_1.ErrorDetails.BUFFER_APPEND_ERROR) {
                    this.resetLoadingState();
                    return;
                }
                if (this.reduceLengthAndFlushBuffer(data)) {
                    this.flushMainBuffer(0, Number.POSITIVE_INFINITY);
                }
                break;
            case errors_1.ErrorDetails.INTERNAL_EXCEPTION:
                this.recoverWorkerError(data);
                break;
            default:
                break;
        }
    };
    // Checks the health of the buffer and attempts to resolve playback stalls.
    StreamController.prototype.checkBuffer = function () {
        var _a = this, media = _a.media, gapController = _a.gapController;
        if (!media || !gapController || !media.readyState) {
            // Exit early if we don't have media or if the media hasn't buffered anything yet (readyState 0)
            return;
        }
        if (this.loadedmetadata || !buffer_helper_1.BufferHelper.getBuffered(media).length) {
            // Resolve gaps using the main buffer, whose ranges are the intersections of the A/V sourcebuffers
            var activeFrag = this.state !== base_stream_controller_1.State.IDLE ? this.fragCurrent : null;
            gapController.poll(this.lastCurrentTime, activeFrag);
        }
        this.lastCurrentTime = media.currentTime;
    };
    StreamController.prototype.onFragLoadEmergencyAborted = function () {
        this.state = base_stream_controller_1.State.IDLE;
        // if loadedmetadata is not set, it means that we are emergency switch down on first frag
        // in that case, reset startFragRequested flag
        if (!this.loadedmetadata) {
            this.startFragRequested = false;
            this.nextLoadPosition = this.startPosition;
        }
        this.tickImmediate();
    };
    StreamController.prototype.onBufferFlushed = function (event, _a) {
        var type = _a.type;
        if (type !== fragment_1.ElementaryStreamTypes.AUDIO ||
            (this.audioOnly && !this.altAudio)) {
            var mediaBuffer = (type === fragment_1.ElementaryStreamTypes.VIDEO
                ? this.videoBuffer
                : this.mediaBuffer) || this.media;
            this.afterBufferFlushed(mediaBuffer, type, loader_1.PlaylistLevelType.MAIN);
            this.tick();
        }
    };
    StreamController.prototype.onLevelsUpdated = function (event, data) {
        if (this.level > -1 && this.fragCurrent) {
            this.level = this.fragCurrent.level;
        }
        this.levels = data.levels;
    };
    StreamController.prototype.swapAudioCodec = function () {
        this.audioCodecSwap = !this.audioCodecSwap;
    };
    /**
     * Seeks to the set startPosition if not equal to the mediaElement's current time.
     */
    StreamController.prototype.seekToStartPos = function () {
        var media = this.media;
        if (!media) {
            return;
        }
        var currentTime = media.currentTime;
        var startPosition = this.startPosition;
        // only adjust currentTime if different from startPosition or if startPosition not buffered
        // at that stage, there should be only one buffered range, as we reach that code after first fragment has been buffered
        if (startPosition >= 0 && currentTime < startPosition) {
            if (media.seeking) {
                this.log("could not seek to ".concat(startPosition, ", already seeking at ").concat(currentTime));
                return;
            }
            var buffered = buffer_helper_1.BufferHelper.getBuffered(media);
            var bufferStart = buffered.length ? buffered.start(0) : 0;
            var delta = bufferStart - startPosition;
            if (delta > 0 &&
                (delta < this.config.maxBufferHole ||
                    delta < this.config.maxFragLookUpTolerance)) {
                this.log("adjusting start position by ".concat(delta, " to match buffer start"));
                startPosition += delta;
                this.startPosition = startPosition;
            }
            this.log("seek to target start position ".concat(startPosition, " from current time ").concat(currentTime));
            media.currentTime = startPosition;
        }
    };
    StreamController.prototype._getAudioCodec = function (currentLevel) {
        var audioCodec = this.config.defaultAudioCodec || currentLevel.audioCodec;
        if (this.audioCodecSwap && audioCodec) {
            this.log('Swapping audio codec');
            if (audioCodec.indexOf('mp4a.40.5') !== -1) {
                audioCodec = 'mp4a.40.2';
            }
            else {
                audioCodec = 'mp4a.40.5';
            }
        }
        return audioCodec;
    };
    StreamController.prototype._loadBitrateTestFrag = function (frag, level) {
        var _this = this;
        frag.bitrateTest = true;
        this._doFragLoad(frag, level).then(function (data) {
            var hls = _this.hls;
            if (!data || _this.fragContextChanged(frag)) {
                return;
            }
            level.fragmentError = 0;
            _this.state = base_stream_controller_1.State.IDLE;
            _this.startFragRequested = false;
            _this.bitrateTest = false;
            var stats = frag.stats;
            // Bitrate tests fragments are neither parsed nor buffered
            stats.parsing.start =
                stats.parsing.end =
                    stats.buffering.start =
                        stats.buffering.end =
                            self.performance.now();
            hls.trigger(events_1.Events.FRAG_LOADED, data);
            frag.bitrateTest = false;
        });
    };
    StreamController.prototype._handleTransmuxComplete = function (transmuxResult) {
        var _a;
        var id = 'main';
        var hls = this.hls;
        var remuxResult = transmuxResult.remuxResult, chunkMeta = transmuxResult.chunkMeta;
        var context = this.getCurrentContext(chunkMeta);
        if (!context) {
            this.resetWhenMissingContext(chunkMeta);
            return;
        }
        var frag = context.frag, part = context.part, level = context.level;
        var video = remuxResult.video, text = remuxResult.text, id3 = remuxResult.id3, initSegment = remuxResult.initSegment;
        var details = level.details;
        // The audio-stream-controller handles audio buffering if Hls.js is playing an alternate audio track
        var audio = this.altAudio ? undefined : remuxResult.audio;
        // Check if the current fragment has been aborted. We check this by first seeing if we're still playing the current level.
        // If we are, subsequently check if the currently loading fragment (fragCurrent) has changed.
        if (this.fragContextChanged(frag)) {
            this.fragmentTracker.removeFragment(frag);
            return;
        }
        this.state = base_stream_controller_1.State.PARSING;
        if (initSegment) {
            if (initSegment === null || initSegment === void 0 ? void 0 : initSegment.tracks) {
                var mapFragment = frag.initSegment || frag;
                this._bufferInitSegment(level, initSegment.tracks, mapFragment, chunkMeta);
                hls.trigger(events_1.Events.FRAG_PARSING_INIT_SEGMENT, {
                    frag: mapFragment,
                    id: id,
                    tracks: initSegment.tracks,
                });
            }
            // This would be nice if Number.isFinite acted as a typeguard, but it doesn't. See: https://github.com/Microsoft/TypeScript/issues/10038
            var initPTS = initSegment.initPTS;
            var timescale = initSegment.timescale;
            if (Number.isFinite(initPTS)) {
                this.initPTS[frag.cc] = { baseTime: initPTS, timescale: timescale };
                hls.trigger(events_1.Events.INIT_PTS_FOUND, { frag: frag, id: id, initPTS: initPTS, timescale: timescale });
            }
        }
        // Avoid buffering if backtracking this fragment
        if (video && details && frag.sn !== 'initSegment') {
            var prevFrag = details.fragments[frag.sn - 1 - details.startSN];
            var isFirstFragment = frag.sn === details.startSN;
            var isFirstInDiscontinuity = !prevFrag || frag.cc > prevFrag.cc;
            if (remuxResult.independent !== false) {
                var startPTS = video.startPTS, endPTS = video.endPTS, startDTS = video.startDTS, endDTS = video.endDTS;
                if (part) {
                    part.elementaryStreams[video.type] = {
                        startPTS: startPTS,
                        endPTS: endPTS,
                        startDTS: startDTS,
                        endDTS: endDTS,
                    };
                }
                else {
                    if (video.firstKeyFrame &&
                        video.independent &&
                        chunkMeta.id === 1 &&
                        !isFirstInDiscontinuity) {
                        this.couldBacktrack = true;
                    }
                    if (video.dropped && video.independent) {
                        // Backtrack if dropped frames create a gap after currentTime
                        var bufferInfo = this.getMainFwdBufferInfo();
                        var targetBufferTime = (bufferInfo ? bufferInfo.end : this.getLoadPosition()) +
                            this.config.maxBufferHole;
                        var startTime = video.firstKeyFramePTS
                            ? video.firstKeyFramePTS
                            : startPTS;
                        if (!isFirstFragment &&
                            targetBufferTime < startTime - this.config.maxBufferHole &&
                            !isFirstInDiscontinuity) {
                            this.backtrack(frag);
                            return;
                        }
                        else if (isFirstInDiscontinuity) {
                            // Mark segment with a gap to avoid loop loading
                            frag.gap = true;
                        }
                        // Set video stream start to fragment start so that truncated samples do not distort the timeline, and mark it partial
                        frag.setElementaryStreamInfo(video.type, frag.start, endPTS, frag.start, endDTS, true);
                    }
                    else if (isFirstFragment && startPTS > gap_controller_1.MAX_START_GAP_JUMP) {
                        // Mark segment with a gap to skip large start gap
                        frag.gap = true;
                    }
                }
                frag.setElementaryStreamInfo(video.type, startPTS, endPTS, startDTS, endDTS);
                if (this.backtrackFragment) {
                    this.backtrackFragment = frag;
                }
                this.bufferFragmentData(video, frag, part, chunkMeta, isFirstFragment || isFirstInDiscontinuity);
            }
            else if (isFirstFragment || isFirstInDiscontinuity) {
                // Mark segment with a gap to avoid loop loading
                frag.gap = true;
            }
            else {
                this.backtrack(frag);
                return;
            }
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
        if (details && ((_a = id3 === null || id3 === void 0 ? void 0 : id3.samples) === null || _a === void 0 ? void 0 : _a.length)) {
            var emittedID3 = {
                id: id,
                frag: frag,
                details: details,
                samples: id3.samples,
            };
            hls.trigger(events_1.Events.FRAG_PARSING_METADATA, emittedID3);
        }
        if (details && text) {
            var emittedText = {
                id: id,
                frag: frag,
                details: details,
                samples: text.samples,
            };
            hls.trigger(events_1.Events.FRAG_PARSING_USERDATA, emittedText);
        }
    };
    StreamController.prototype._bufferInitSegment = function (currentLevel, tracks, frag, chunkMeta) {
        var _this = this;
        if (this.state !== base_stream_controller_1.State.PARSING) {
            return;
        }
        this.audioOnly = !!tracks.audio && !tracks.video;
        // if audio track is expected to come from audio stream controller, discard any coming from main
        if (this.altAudio && !this.audioOnly) {
            delete tracks.audio;
        }
        // include levelCodec in audio and video tracks
        var audio = tracks.audio, video = tracks.video, audiovideo = tracks.audiovideo;
        if (audio) {
            var audioCodec = currentLevel.audioCodec;
            var ua = navigator.userAgent.toLowerCase();
            if (this.audioCodecSwitch) {
                if (audioCodec) {
                    if (audioCodec.indexOf('mp4a.40.5') !== -1) {
                        audioCodec = 'mp4a.40.2';
                    }
                    else {
                        audioCodec = 'mp4a.40.5';
                    }
                }
                // In the case that AAC and HE-AAC audio codecs are signalled in manifest,
                // force HE-AAC, as it seems that most browsers prefers it.
                // don't force HE-AAC if mono stream, or in Firefox
                var audioMetadata = audio.metadata;
                if (audioMetadata &&
                    'channelCount' in audioMetadata &&
                    (audioMetadata.channelCount || 1) !== 1 &&
                    ua.indexOf('firefox') === -1) {
                    audioCodec = 'mp4a.40.5';
                }
            }
            // HE-AAC is broken on Android, always signal audio codec as AAC even if variant manifest states otherwise
            if (audioCodec &&
                audioCodec.indexOf('mp4a.40.5') !== -1 &&
                ua.indexOf('android') !== -1 &&
                audio.container !== 'audio/mpeg') {
                // Exclude mpeg audio
                audioCodec = 'mp4a.40.2';
                this.log("Android: force audio codec to ".concat(audioCodec));
            }
            if (currentLevel.audioCodec && currentLevel.audioCodec !== audioCodec) {
                this.log("Swapping manifest audio codec \"".concat(currentLevel.audioCodec, "\" for \"").concat(audioCodec, "\""));
            }
            audio.levelCodec = audioCodec;
            audio.id = 'main';
            this.log("Init audio buffer, container:".concat(audio.container, ", codecs[selected/level/parsed]=[").concat(audioCodec || '', "/").concat(currentLevel.audioCodec || '', "/").concat(audio.codec, "]"));
        }
        if (video) {
            video.levelCodec = currentLevel.videoCodec;
            video.id = 'main';
            this.log("Init video buffer, container:".concat(video.container, ", codecs[level/parsed]=[").concat(currentLevel.videoCodec || '', "/").concat(video.codec, "]"));
        }
        if (audiovideo) {
            this.log("Init audiovideo buffer, container:".concat(audiovideo.container, ", codecs[level/parsed]=[").concat(currentLevel.codecs, "/").concat(audiovideo.codec, "]"));
        }
        this.hls.trigger(events_1.Events.BUFFER_CODECS, tracks);
        // loop through tracks that are going to be provided to bufferController
        Object.keys(tracks).forEach(function (trackName) {
            var track = tracks[trackName];
            var initSegment = track.initSegment;
            if (initSegment === null || initSegment === void 0 ? void 0 : initSegment.byteLength) {
                _this.hls.trigger(events_1.Events.BUFFER_APPENDING, {
                    type: trackName,
                    data: initSegment,
                    frag: frag,
                    part: null,
                    chunkMeta: chunkMeta,
                    parent: frag.type,
                });
            }
        });
        // trigger handler right now
        this.tickImmediate();
    };
    StreamController.prototype.getMainFwdBufferInfo = function () {
        return this.getFwdBufferInfo(this.mediaBuffer ? this.mediaBuffer : this.media, loader_1.PlaylistLevelType.MAIN);
    };
    StreamController.prototype.backtrack = function (frag) {
        this.couldBacktrack = true;
        // Causes findFragments to backtrack through fragments to find the keyframe
        this.backtrackFragment = frag;
        this.resetTransmuxer();
        this.flushBufferGap(frag);
        this.fragmentTracker.removeFragment(frag);
        this.fragPrevious = null;
        this.nextLoadPosition = frag.start;
        this.state = base_stream_controller_1.State.IDLE;
    };
    StreamController.prototype.checkFragmentChanged = function () {
        var video = this.media;
        var fragPlayingCurrent = null;
        if (video && video.readyState > 1 && video.seeking === false) {
            var currentTime = video.currentTime;
            /* if video element is in seeked state, currentTime can only increase.
              (assuming that playback rate is positive ...)
              As sometimes currentTime jumps back to zero after a
              media decode error, check this, to avoid seeking back to
              wrong position after a media decode error
            */
            if (buffer_helper_1.BufferHelper.isBuffered(video, currentTime)) {
                fragPlayingCurrent = this.getAppendedFrag(currentTime);
            }
            else if (buffer_helper_1.BufferHelper.isBuffered(video, currentTime + 0.1)) {
                /* ensure that FRAG_CHANGED event is triggered at startup,
                  when first video frame is displayed and playback is paused.
                  add a tolerance of 100ms, in case current position is not buffered,
                  check if current pos+100ms is buffered and use that buffer range
                  for FRAG_CHANGED event reporting */
                fragPlayingCurrent = this.getAppendedFrag(currentTime + 0.1);
            }
            if (fragPlayingCurrent) {
                this.backtrackFragment = null;
                var fragPlaying = this.fragPlaying;
                var fragCurrentLevel = fragPlayingCurrent.level;
                if (!fragPlaying ||
                    fragPlayingCurrent.sn !== fragPlaying.sn ||
                    fragPlaying.level !== fragCurrentLevel) {
                    this.fragPlaying = fragPlayingCurrent;
                    this.hls.trigger(events_1.Events.FRAG_CHANGED, { frag: fragPlayingCurrent });
                    if (!fragPlaying || fragPlaying.level !== fragCurrentLevel) {
                        this.hls.trigger(events_1.Events.LEVEL_SWITCHED, {
                            level: fragCurrentLevel,
                        });
                    }
                }
            }
        }
    };
    Object.defineProperty(StreamController.prototype, "nextLevel", {
        get: function () {
            var frag = this.nextBufferedFrag;
            if (frag) {
                return frag.level;
            }
            return -1;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(StreamController.prototype, "currentFrag", {
        get: function () {
            var media = this.media;
            if (media) {
                return this.fragPlaying || this.getAppendedFrag(media.currentTime);
            }
            return null;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(StreamController.prototype, "currentProgramDateTime", {
        get: function () {
            var media = this.media;
            if (media) {
                var currentTime = media.currentTime;
                var frag = this.currentFrag;
                if (frag &&
                    Number.isFinite(currentTime) &&
                    Number.isFinite(frag.programDateTime)) {
                    var epocMs = frag.programDateTime + (currentTime - frag.start) * 1000;
                    return new Date(epocMs);
                }
            }
            return null;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(StreamController.prototype, "currentLevel", {
        get: function () {
            var frag = this.currentFrag;
            if (frag) {
                return frag.level;
            }
            return -1;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(StreamController.prototype, "nextBufferedFrag", {
        get: function () {
            var frag = this.currentFrag;
            if (frag) {
                return this.followingBufferedFrag(frag);
            }
            return null;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(StreamController.prototype, "forceStartLoad", {
        get: function () {
            return this._forceStartLoad;
        },
        enumerable: false,
        configurable: true
    });
    return StreamController;
}(base_stream_controller_1.default));
exports.default = StreamController;
