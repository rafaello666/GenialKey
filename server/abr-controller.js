"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ewma_bandwidth_estimator_1 = require("../utils/ewma-bandwidth-estimator");
var events_1 = require("../events");
var errors_1 = require("../errors");
var loader_1 = require("../types/loader");
var logger_1 = require("../utils/logger");
var mediacapabilities_helper_1 = require("../utils/mediacapabilities-helper");
var rendition_helper_1 = require("../utils/rendition-helper");
var AbrController = /** @class */ (function () {
    function AbrController(hls) {
        var _this = this;
        this.lastLevelLoadSec = 0;
        this.lastLoadedFragLevel = -1;
        this.firstSelection = -1;
        this._nextAutoLevel = -1;
        this.nextAutoLevelKey = '';
        this.audioTracksByGroup = null;
        this.codecTiers = null;
        this.timer = -1;
        this.fragCurrent = null;
        this.partCurrent = null;
        this.bitrateTestDelay = 0;
        /*
            This method monitors the download rate of the current fragment, and will downswitch if that fragment will not load
            quickly enough to prevent underbuffering
          */
        this._abandonRulesCheck = function () {
            var _a = _this, frag = _a.fragCurrent, part = _a.partCurrent, hls = _a.hls;
            var autoLevelEnabled = hls.autoLevelEnabled, media = hls.media;
            if (!frag || !media) {
                return;
            }
            var now = performance.now();
            var stats = part ? part.stats : frag.stats;
            var duration = part ? part.duration : frag.duration;
            var timeLoading = now - stats.loading.start;
            var minAutoLevel = hls.minAutoLevel;
            // If frag loading is aborted, complete, or from lowest level, stop timer and return
            if (stats.aborted ||
                (stats.loaded && stats.loaded === stats.total) ||
                frag.level <= minAutoLevel) {
                _this.clearTimer();
                // reset forced auto level value so that next level will be selected
                _this._nextAutoLevel = -1;
                return;
            }
            // This check only runs if we're in ABR mode and actually playing
            if (!autoLevelEnabled ||
                media.paused ||
                !media.playbackRate ||
                !media.readyState) {
                return;
            }
            var bufferInfo = hls.mainForwardBufferInfo;
            if (bufferInfo === null) {
                return;
            }
            var ttfbEstimate = _this.bwEstimator.getEstimateTTFB();
            var playbackRate = Math.abs(media.playbackRate);
            // To maintain stable adaptive playback, only begin monitoring frag loading after half or more of its playback duration has passed
            if (timeLoading <=
                Math.max(ttfbEstimate, 1000 * (duration / (playbackRate * 2)))) {
                return;
            }
            // bufferStarvationDelay is an estimate of the amount time (in seconds) it will take to exhaust the buffer
            var bufferStarvationDelay = bufferInfo.len / playbackRate;
            var ttfb = stats.loading.first
                ? stats.loading.first - stats.loading.start
                : -1;
            var loadedFirstByte = stats.loaded && ttfb > -1;
            var bwEstimate = _this.getBwEstimate();
            var levels = hls.levels;
            var level = levels[frag.level];
            var expectedLen = stats.total ||
                Math.max(stats.loaded, Math.round((duration * level.averageBitrate) / 8));
            var timeStreaming = loadedFirstByte ? timeLoading - ttfb : timeLoading;
            if (timeStreaming < 1 && loadedFirstByte) {
                timeStreaming = Math.min(timeLoading, (stats.loaded * 8) / bwEstimate);
            }
            var loadRate = loadedFirstByte
                ? (stats.loaded * 1000) / timeStreaming
                : 0;
            // fragLoadDelay is an estimate of the time (in seconds) it will take to buffer the remainder of the fragment
            var fragLoadedDelay = loadRate
                ? (expectedLen - stats.loaded) / loadRate
                : (expectedLen * 8) / bwEstimate + ttfbEstimate / 1000;
            // Only downswitch if the time to finish loading the current fragment is greater than the amount of buffer left
            if (fragLoadedDelay <= bufferStarvationDelay) {
                return;
            }
            var bwe = loadRate ? loadRate * 8 : bwEstimate;
            var fragLevelNextLoadedDelay = Number.POSITIVE_INFINITY;
            var nextLoadLevel;
            // Iterate through lower level and try to find the largest one that avoids rebuffering
            for (nextLoadLevel = frag.level - 1; nextLoadLevel > minAutoLevel; nextLoadLevel--) {
                // compute time to load next fragment at lower level
                // 8 = bits per byte (bps/Bps)
                var levelNextBitrate = levels[nextLoadLevel].maxBitrate;
                fragLevelNextLoadedDelay = _this.getTimeToLoadFrag(ttfbEstimate / 1000, bwe, duration * levelNextBitrate, !levels[nextLoadLevel].details);
                if (fragLevelNextLoadedDelay < bufferStarvationDelay) {
                    break;
                }
            }
            // Only emergency switch down if it takes less time to load a new fragment at lowest level instead of continuing
            // to load the current one
            if (fragLevelNextLoadedDelay >= fragLoadedDelay) {
                return;
            }
            // if estimated load time of new segment is completely unreasonable, ignore and do not emergency switch down
            if (fragLevelNextLoadedDelay > duration * 10) {
                return;
            }
            hls.nextLoadLevel = hls.nextAutoLevel = nextLoadLevel;
            if (loadedFirstByte) {
                // If there has been loading progress, sample bandwidth using loading time offset by minimum TTFB time
                _this.bwEstimator.sample(timeLoading - Math.min(ttfbEstimate, ttfb), stats.loaded);
            }
            else {
                // If there has been no loading progress, sample TTFB
                _this.bwEstimator.sampleTTFB(timeLoading);
            }
            var nextLoadLevelBitrate = levels[nextLoadLevel].maxBitrate;
            if (_this.getBwEstimate() * _this.hls.config.abrBandWidthUpFactor >
                nextLoadLevelBitrate) {
                _this.resetEstimator(nextLoadLevelBitrate);
            }
            _this.clearTimer();
            logger_1.logger.warn("[abr] Fragment ".concat(frag.sn).concat(part ? ' part ' + part.index : '', " of level ").concat(frag.level, " is loading too slowly;\n      Time to underbuffer: ").concat(bufferStarvationDelay.toFixed(3), " s\n      Estimated load time for current fragment: ").concat(fragLoadedDelay.toFixed(3), " s\n      Estimated load time for down switch fragment: ").concat(fragLevelNextLoadedDelay.toFixed(3), " s\n      TTFB estimate: ").concat(ttfb | 0, " ms\n      Current BW estimate: ").concat(Number.isFinite(bwEstimate) ? bwEstimate | 0 : 'Unknown', " bps\n      New BW estimate: ").concat(_this.getBwEstimate() | 0, " bps\n      Switching to level ").concat(nextLoadLevel, " @ ").concat(nextLoadLevelBitrate | 0, " bps"));
            hls.trigger(events_1.Events.FRAG_LOAD_EMERGENCY_ABORTED, { frag: frag, part: part, stats: stats });
        };
        this.hls = hls;
        this.bwEstimator = this.initEstimator();
        this.registerListeners();
    }
    AbrController.prototype.resetEstimator = function (abrEwmaDefaultEstimate) {
        if (abrEwmaDefaultEstimate) {
            logger_1.logger.log("setting initial bwe to ".concat(abrEwmaDefaultEstimate));
            this.hls.config.abrEwmaDefaultEstimate = abrEwmaDefaultEstimate;
        }
        this.firstSelection = -1;
        this.bwEstimator = this.initEstimator();
    };
    AbrController.prototype.initEstimator = function () {
        var config = this.hls.config;
        return new ewma_bandwidth_estimator_1.default(config.abrEwmaSlowVoD, config.abrEwmaFastVoD, config.abrEwmaDefaultEstimate);
    };
    AbrController.prototype.registerListeners = function () {
        var hls = this.hls;
        hls.on(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.on(events_1.Events.FRAG_LOADING, this.onFragLoading, this);
        hls.on(events_1.Events.FRAG_LOADED, this.onFragLoaded, this);
        hls.on(events_1.Events.FRAG_BUFFERED, this.onFragBuffered, this);
        hls.on(events_1.Events.LEVEL_SWITCHING, this.onLevelSwitching, this);
        hls.on(events_1.Events.LEVEL_LOADED, this.onLevelLoaded, this);
        hls.on(events_1.Events.LEVELS_UPDATED, this.onLevelsUpdated, this);
        hls.on(events_1.Events.MAX_AUTO_LEVEL_UPDATED, this.onMaxAutoLevelUpdated, this);
        hls.on(events_1.Events.ERROR, this.onError, this);
    };
    AbrController.prototype.unregisterListeners = function () {
        var hls = this.hls;
        if (!hls) {
            return;
        }
        hls.off(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.off(events_1.Events.FRAG_LOADING, this.onFragLoading, this);
        hls.off(events_1.Events.FRAG_LOADED, this.onFragLoaded, this);
        hls.off(events_1.Events.FRAG_BUFFERED, this.onFragBuffered, this);
        hls.off(events_1.Events.LEVEL_SWITCHING, this.onLevelSwitching, this);
        hls.off(events_1.Events.LEVEL_LOADED, this.onLevelLoaded, this);
        hls.off(events_1.Events.LEVELS_UPDATED, this.onLevelsUpdated, this);
        hls.off(events_1.Events.MAX_AUTO_LEVEL_UPDATED, this.onMaxAutoLevelUpdated, this);
        hls.off(events_1.Events.ERROR, this.onError, this);
    };
    AbrController.prototype.destroy = function () {
        this.unregisterListeners();
        this.clearTimer();
        // @ts-ignore
        this.hls = this._abandonRulesCheck = null;
        this.fragCurrent = this.partCurrent = null;
    };
    AbrController.prototype.onManifestLoading = function (event, data) {
        this.lastLoadedFragLevel = -1;
        this.firstSelection = -1;
        this.lastLevelLoadSec = 0;
        this.fragCurrent = this.partCurrent = null;
        this.onLevelsUpdated();
        this.clearTimer();
    };
    AbrController.prototype.onLevelsUpdated = function () {
        if (this.lastLoadedFragLevel > -1 && this.fragCurrent) {
            this.lastLoadedFragLevel = this.fragCurrent.level;
        }
        this._nextAutoLevel = -1;
        this.onMaxAutoLevelUpdated();
        this.codecTiers = null;
        this.audioTracksByGroup = null;
    };
    AbrController.prototype.onMaxAutoLevelUpdated = function () {
        this.firstSelection = -1;
        this.nextAutoLevelKey = '';
    };
    AbrController.prototype.onFragLoading = function (event, data) {
        var _a;
        var frag = data.frag;
        if (this.ignoreFragment(frag)) {
            return;
        }
        if (!frag.bitrateTest) {
            this.fragCurrent = frag;
            this.partCurrent = (_a = data.part) !== null && _a !== void 0 ? _a : null;
        }
        this.clearTimer();
        this.timer = self.setInterval(this._abandonRulesCheck, 100);
    };
    AbrController.prototype.onLevelSwitching = function (event, data) {
        this.clearTimer();
    };
    AbrController.prototype.onError = function (event, data) {
        if (data.fatal) {
            return;
        }
        switch (data.details) {
            case errors_1.ErrorDetails.BUFFER_ADD_CODEC_ERROR:
            case errors_1.ErrorDetails.BUFFER_APPEND_ERROR:
                // Reset last loaded level so that a new selection can be made after calling recoverMediaError
                this.lastLoadedFragLevel = -1;
                this.firstSelection = -1;
                break;
            case errors_1.ErrorDetails.FRAG_LOAD_TIMEOUT: {
                var frag = data.frag;
                var _a = this, fragCurrent = _a.fragCurrent, part = _a.partCurrent;
                if (frag &&
                    fragCurrent &&
                    frag.sn === fragCurrent.sn &&
                    frag.level === fragCurrent.level) {
                    var now = performance.now();
                    var stats = part ? part.stats : frag.stats;
                    var timeLoading = now - stats.loading.start;
                    var ttfb = stats.loading.first
                        ? stats.loading.first - stats.loading.start
                        : -1;
                    var loadedFirstByte = stats.loaded && ttfb > -1;
                    if (loadedFirstByte) {
                        var ttfbEstimate = this.bwEstimator.getEstimateTTFB();
                        this.bwEstimator.sample(timeLoading - Math.min(ttfbEstimate, ttfb), stats.loaded);
                    }
                    else {
                        this.bwEstimator.sampleTTFB(timeLoading);
                    }
                }
                break;
            }
        }
    };
    AbrController.prototype.getTimeToLoadFrag = function (timeToFirstByteSec, bandwidth, fragSizeBits, isSwitch) {
        var fragLoadSec = timeToFirstByteSec + fragSizeBits / bandwidth;
        var playlistLoadSec = isSwitch ? this.lastLevelLoadSec : 0;
        return fragLoadSec + playlistLoadSec;
    };
    AbrController.prototype.onLevelLoaded = function (event, data) {
        var config = this.hls.config;
        var loading = data.stats.loading;
        var timeLoadingMs = loading.end - loading.start;
        if (Number.isFinite(timeLoadingMs)) {
            this.lastLevelLoadSec = timeLoadingMs / 1000;
        }
        if (data.details.live) {
            this.bwEstimator.update(config.abrEwmaSlowLive, config.abrEwmaFastLive);
        }
        else {
            this.bwEstimator.update(config.abrEwmaSlowVoD, config.abrEwmaFastVoD);
        }
    };
    AbrController.prototype.onFragLoaded = function (event, _a) {
        var frag = _a.frag, part = _a.part;
        var stats = part ? part.stats : frag.stats;
        if (frag.type === loader_1.PlaylistLevelType.MAIN) {
            this.bwEstimator.sampleTTFB(stats.loading.first - stats.loading.start);
        }
        if (this.ignoreFragment(frag)) {
            return;
        }
        // stop monitoring bw once frag loaded
        this.clearTimer();
        // reset forced auto level value so that next level will be selected
        if (frag.level === this._nextAutoLevel) {
            this._nextAutoLevel = -1;
        }
        this.firstSelection = -1;
        // compute level average bitrate
        if (this.hls.config.abrMaxWithRealBitrate) {
            var duration = part ? part.duration : frag.duration;
            var level = this.hls.levels[frag.level];
            var loadedBytes = (level.loaded ? level.loaded.bytes : 0) + stats.loaded;
            var loadedDuration = (level.loaded ? level.loaded.duration : 0) + duration;
            level.loaded = { bytes: loadedBytes, duration: loadedDuration };
            level.realBitrate = Math.round((8 * loadedBytes) / loadedDuration);
        }
        if (frag.bitrateTest) {
            var fragBufferedData = {
                stats: stats,
                frag: frag,
                part: part,
                id: frag.type,
            };
            this.onFragBuffered(events_1.Events.FRAG_BUFFERED, fragBufferedData);
            frag.bitrateTest = false;
        }
        else {
            // store level id after successful fragment load for playback
            this.lastLoadedFragLevel = frag.level;
        }
    };
    AbrController.prototype.onFragBuffered = function (event, data) {
        var frag = data.frag, part = data.part;
        var stats = (part === null || part === void 0 ? void 0 : part.stats.loaded) ? part.stats : frag.stats;
        if (stats.aborted) {
            return;
        }
        if (this.ignoreFragment(frag)) {
            return;
        }
        // Use the difference between parsing and request instead of buffering and request to compute fragLoadingProcessing;
        // rationale is that buffer appending only happens once media is attached. This can happen when config.startFragPrefetch
        // is used. If we used buffering in that case, our BW estimate sample will be very large.
        var processingMs = stats.parsing.end -
            stats.loading.start -
            Math.min(stats.loading.first - stats.loading.start, this.bwEstimator.getEstimateTTFB());
        this.bwEstimator.sample(processingMs, stats.loaded);
        stats.bwEstimate = this.getBwEstimate();
        if (frag.bitrateTest) {
            this.bitrateTestDelay = processingMs / 1000;
        }
        else {
            this.bitrateTestDelay = 0;
        }
    };
    AbrController.prototype.ignoreFragment = function (frag) {
        // Only count non-alt-audio frags which were actually buffered in our BW calculations
        return frag.type !== loader_1.PlaylistLevelType.MAIN || frag.sn === 'initSegment';
    };
    AbrController.prototype.clearTimer = function () {
        if (this.timer > -1) {
            self.clearInterval(this.timer);
            this.timer = -1;
        }
    };
    Object.defineProperty(AbrController.prototype, "firstAutoLevel", {
        get: function () {
            var _a = this.hls, maxAutoLevel = _a.maxAutoLevel, minAutoLevel = _a.minAutoLevel;
            var bwEstimate = this.getBwEstimate();
            var maxStartDelay = this.hls.config.maxStarvationDelay;
            var abrAutoLevel = this.findBestLevel(bwEstimate, minAutoLevel, maxAutoLevel, 0, maxStartDelay, 1, 1);
            if (abrAutoLevel > -1) {
                return abrAutoLevel;
            }
            var firstLevel = this.hls.firstLevel;
            var clamped = Math.min(Math.max(firstLevel, minAutoLevel), maxAutoLevel);
            logger_1.logger.warn("[abr] Could not find best starting auto level. Defaulting to first in playlist ".concat(firstLevel, " clamped to ").concat(clamped));
            return clamped;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AbrController.prototype, "forcedAutoLevel", {
        get: function () {
            if (this.nextAutoLevelKey) {
                return -1;
            }
            return this._nextAutoLevel;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AbrController.prototype, "nextAutoLevel", {
        // return next auto level
        get: function () {
            var forcedAutoLevel = this.forcedAutoLevel;
            var bwEstimator = this.bwEstimator;
            var useEstimate = bwEstimator.canEstimate();
            var loadedFirstFrag = this.lastLoadedFragLevel > -1;
            // in case next auto level has been forced, and bw not available or not reliable, return forced value
            if (forcedAutoLevel !== -1 &&
                (!useEstimate ||
                    !loadedFirstFrag ||
                    this.nextAutoLevelKey === this.getAutoLevelKey())) {
                return forcedAutoLevel;
            }
            // compute next level using ABR logic
            var nextABRAutoLevel = useEstimate && loadedFirstFrag
                ? this.getNextABRAutoLevel()
                : this.firstAutoLevel;
            // use forced auto level while it hasn't errored more than ABR selection
            if (forcedAutoLevel !== -1) {
                var levels = this.hls.levels;
                if (levels.length > Math.max(forcedAutoLevel, nextABRAutoLevel) &&
                    levels[forcedAutoLevel].loadError <= levels[nextABRAutoLevel].loadError) {
                    return forcedAutoLevel;
                }
            }
            // save result until state has changed
            this._nextAutoLevel = nextABRAutoLevel;
            this.nextAutoLevelKey = this.getAutoLevelKey();
            return nextABRAutoLevel;
        },
        set: function (nextLevel) {
            var _a = this.hls, maxAutoLevel = _a.maxAutoLevel, minAutoLevel = _a.minAutoLevel;
            var value = Math.min(Math.max(nextLevel, minAutoLevel), maxAutoLevel);
            if (this._nextAutoLevel !== value) {
                this.nextAutoLevelKey = '';
                this._nextAutoLevel = value;
            }
        },
        enumerable: false,
        configurable: true
    });
    AbrController.prototype.getAutoLevelKey = function () {
        return "".concat(this.getBwEstimate(), "_").concat(this.getStarvationDelay().toFixed(2));
    };
    AbrController.prototype.getNextABRAutoLevel = function () {
        var _a = this, fragCurrent = _a.fragCurrent, partCurrent = _a.partCurrent, hls = _a.hls;
        var maxAutoLevel = hls.maxAutoLevel, config = hls.config, minAutoLevel = hls.minAutoLevel;
        var currentFragDuration = partCurrent
            ? partCurrent.duration
            : fragCurrent
                ? fragCurrent.duration
                : 0;
        var avgbw = this.getBwEstimate();
        // bufferStarvationDelay is the wall-clock time left until the playback buffer is exhausted.
        var bufferStarvationDelay = this.getStarvationDelay();
        var bwFactor = config.abrBandWidthFactor;
        var bwUpFactor = config.abrBandWidthUpFactor;
        // First, look to see if we can find a level matching with our avg bandwidth AND that could also guarantee no rebuffering at all
        if (bufferStarvationDelay) {
            var bestLevel_1 = this.findBestLevel(avgbw, minAutoLevel, maxAutoLevel, bufferStarvationDelay, 0, bwFactor, bwUpFactor);
            if (bestLevel_1 >= 0) {
                return bestLevel_1;
            }
        }
        // not possible to get rid of rebuffering... try to find level that will guarantee less than maxStarvationDelay of rebuffering
        var maxStarvationDelay = currentFragDuration
            ? Math.min(currentFragDuration, config.maxStarvationDelay)
            : config.maxStarvationDelay;
        if (!bufferStarvationDelay) {
            // in case buffer is empty, let's check if previous fragment was loaded to perform a bitrate test
            var bitrateTestDelay = this.bitrateTestDelay;
            if (bitrateTestDelay) {
                // if it is the case, then we need to adjust our max starvation delay using maxLoadingDelay config value
                // max video loading delay used in  automatic start level selection :
                // in that mode ABR controller will ensure that video loading time (ie the time to fetch the first fragment at lowest quality level +
                // the time to fetch the fragment at the appropriate quality level is less than ```maxLoadingDelay``` )
                // cap maxLoadingDelay and ensure it is not bigger 'than bitrate test' frag duration
                var maxLoadingDelay = currentFragDuration
                    ? Math.min(currentFragDuration, config.maxLoadingDelay)
                    : config.maxLoadingDelay;
                maxStarvationDelay = maxLoadingDelay - bitrateTestDelay;
                logger_1.logger.info("[abr] bitrate test took ".concat(Math.round(1000 * bitrateTestDelay), "ms, set first fragment max fetchDuration to ").concat(Math.round(1000 * maxStarvationDelay), " ms"));
                // don't use conservative factor on bitrate test
                bwFactor = bwUpFactor = 1;
            }
        }
        var bestLevel = this.findBestLevel(avgbw, minAutoLevel, maxAutoLevel, bufferStarvationDelay, maxStarvationDelay, bwFactor, bwUpFactor);
        logger_1.logger.info("[abr] ".concat(bufferStarvationDelay ? 'rebuffering expected' : 'buffer is empty', ", optimal quality level ").concat(bestLevel));
        if (bestLevel > -1) {
            return bestLevel;
        }
        // If no matching level found, see if min auto level would be a better option
        var minLevel = hls.levels[minAutoLevel];
        var autoLevel = hls.levels[hls.loadLevel];
        if ((minLevel === null || minLevel === void 0 ? void 0 : minLevel.bitrate) < (autoLevel === null || autoLevel === void 0 ? void 0 : autoLevel.bitrate)) {
            return minAutoLevel;
        }
        // or if bitrate is not lower, continue to use loadLevel
        return hls.loadLevel;
    };
    AbrController.prototype.getStarvationDelay = function () {
        var hls = this.hls;
        var media = hls.media;
        if (!media) {
            return Infinity;
        }
        // playbackRate is the absolute value of the playback rate; if media.playbackRate is 0, we use 1 to load as
        // if we're playing back at the normal rate.
        var playbackRate = media && media.playbackRate !== 0 ? Math.abs(media.playbackRate) : 1.0;
        var bufferInfo = hls.mainForwardBufferInfo;
        return (bufferInfo ? bufferInfo.len : 0) / playbackRate;
    };
    AbrController.prototype.getBwEstimate = function () {
        return this.bwEstimator.canEstimate()
            ? this.bwEstimator.getEstimate()
            : this.hls.config.abrEwmaDefaultEstimate;
    };
    AbrController.prototype.findBestLevel = function (currentBw, minAutoLevel, maxAutoLevel, bufferStarvationDelay, maxStarvationDelay, bwFactor, bwUpFactor) {
        var _this = this;
        var _a, _b;
        var maxFetchDuration = bufferStarvationDelay + maxStarvationDelay;
        var lastLoadedFragLevel = this.lastLoadedFragLevel;
        var selectionBaseLevel = lastLoadedFragLevel === -1 ? this.hls.firstLevel : lastLoadedFragLevel;
        var _c = this, fragCurrent = _c.fragCurrent, partCurrent = _c.partCurrent;
        var _d = this.hls, levels = _d.levels, allAudioTracks = _d.allAudioTracks, loadLevel = _d.loadLevel, config = _d.config;
        if (levels.length === 1) {
            return 0;
        }
        var level = levels[selectionBaseLevel];
        var live = !!((_a = level === null || level === void 0 ? void 0 : level.details) === null || _a === void 0 ? void 0 : _a.live);
        var firstSelection = loadLevel === -1 || lastLoadedFragLevel === -1;
        var currentCodecSet;
        var currentVideoRange = 'SDR';
        var currentFrameRate = (level === null || level === void 0 ? void 0 : level.frameRate) || 0;
        var audioPreference = config.audioPreference, videoPreference = config.videoPreference;
        var audioTracksByGroup = this.audioTracksByGroup ||
            (this.audioTracksByGroup = (0, rendition_helper_1.getAudioTracksByGroup)(allAudioTracks));
        if (firstSelection) {
            if (this.firstSelection !== -1) {
                return this.firstSelection;
            }
            var codecTiers = this.codecTiers ||
                (this.codecTiers = (0, rendition_helper_1.getCodecTiers)(levels, audioTracksByGroup, minAutoLevel, maxAutoLevel));
            var startTier = (0, rendition_helper_1.getStartCodecTier)(codecTiers, currentVideoRange, currentBw, audioPreference, videoPreference);
            var codecSet = startTier.codecSet, videoRanges = startTier.videoRanges, minFramerate = startTier.minFramerate, minBitrate = startTier.minBitrate, preferHDR = startTier.preferHDR;
            currentCodecSet = codecSet;
            currentVideoRange = preferHDR
                ? videoRanges[videoRanges.length - 1]
                : videoRanges[0];
            currentFrameRate = minFramerate;
            currentBw = Math.max(currentBw, minBitrate);
            logger_1.logger.log("[abr] picked start tier ".concat(JSON.stringify(startTier)));
        }
        else {
            currentCodecSet = level === null || level === void 0 ? void 0 : level.codecSet;
            currentVideoRange = level === null || level === void 0 ? void 0 : level.videoRange;
        }
        var currentFragDuration = partCurrent
            ? partCurrent.duration
            : fragCurrent
                ? fragCurrent.duration
                : 0;
        var ttfbEstimateSec = this.bwEstimator.getEstimateTTFB() / 1000;
        var levelsSkipped = [];
        var _loop_1 = function (i) {
            var levelInfo = levels[i];
            var upSwitch = i > selectionBaseLevel;
            if (!levelInfo) {
                return "continue";
            }
            if (__USE_MEDIA_CAPABILITIES__ &&
                config.useMediaCapabilities &&
                !levelInfo.supportedResult &&
                !levelInfo.supportedPromise) {
                var mediaCapabilities = navigator.mediaCapabilities;
                if (typeof (mediaCapabilities === null || mediaCapabilities === void 0 ? void 0 : mediaCapabilities.decodingInfo) === 'function' &&
                    (0, mediacapabilities_helper_1.requiresMediaCapabilitiesDecodingInfo)(levelInfo, audioTracksByGroup, currentVideoRange, currentFrameRate, currentBw, audioPreference)) {
                    levelInfo.supportedPromise = (0, mediacapabilities_helper_1.getMediaDecodingInfoPromise)(levelInfo, audioTracksByGroup, mediaCapabilities);
                    levelInfo.supportedPromise.then(function (decodingInfo) {
                        if (!_this.hls) {
                            return;
                        }
                        levelInfo.supportedResult = decodingInfo;
                        var levels = _this.hls.levels;
                        var index = levels.indexOf(levelInfo);
                        if (decodingInfo.error) {
                            logger_1.logger.warn("[abr] MediaCapabilities decodingInfo error: \"".concat(decodingInfo.error, "\" for level ").concat(index, " ").concat(JSON.stringify(decodingInfo)));
                        }
                        else if (!decodingInfo.supported) {
                            logger_1.logger.warn("[abr] Unsupported MediaCapabilities decodingInfo result for level ".concat(index, " ").concat(JSON.stringify(decodingInfo)));
                            if (index > -1 && levels.length > 1) {
                                logger_1.logger.log("[abr] Removing unsupported level ".concat(index));
                                _this.hls.removeLevel(index);
                            }
                        }
                    });
                }
                else {
                    levelInfo.supportedResult = mediacapabilities_helper_1.SUPPORTED_INFO_DEFAULT;
                }
            }
            // skip candidates which change codec-family or video-range,
            // and which decrease or increase frame-rate for up and down-switch respectfully
            if ((currentCodecSet && levelInfo.codecSet !== currentCodecSet) ||
                (currentVideoRange && levelInfo.videoRange !== currentVideoRange) ||
                (upSwitch && currentFrameRate > levelInfo.frameRate) ||
                (!upSwitch &&
                    currentFrameRate > 0 &&
                    currentFrameRate < levelInfo.frameRate) ||
                (levelInfo.supportedResult &&
                    !((_b = levelInfo.supportedResult.decodingInfoResults) === null || _b === void 0 ? void 0 : _b[0].smooth))) {
                levelsSkipped.push(i);
                return "continue";
            }
            var levelDetails = levelInfo.details;
            var avgDuration = (partCurrent
                ? levelDetails === null || levelDetails === void 0 ? void 0 : levelDetails.partTarget
                : levelDetails === null || levelDetails === void 0 ? void 0 : levelDetails.averagetargetduration) || currentFragDuration;
            var adjustedbw = void 0;
            // follow algorithm captured from stagefright :
            // https://android.googlesource.com/platform/frameworks/av/+/master/media/libstagefright/httplive/LiveSession.cpp
            // Pick the highest bandwidth stream below or equal to estimated bandwidth.
            // consider only 80% of the available bandwidth, but if we are switching up,
            // be even more conservative (70%) to avoid overestimating and immediately
            // switching back.
            if (!upSwitch) {
                adjustedbw = bwFactor * currentBw;
            }
            else {
                adjustedbw = bwUpFactor * currentBw;
            }
            // Use average bitrate when starvation delay (buffer length) is gt or eq two segment durations and rebuffering is not expected (maxStarvationDelay > 0)
            var bitrate = currentFragDuration &&
                bufferStarvationDelay >= currentFragDuration * 2 &&
                maxStarvationDelay === 0
                ? levels[i].averageBitrate
                : levels[i].maxBitrate;
            var fetchDuration = this_1.getTimeToLoadFrag(ttfbEstimateSec, adjustedbw, bitrate * avgDuration, levelDetails === undefined);
            var canSwitchWithinTolerance = 
            // if adjusted bw is greater than level bitrate AND
            adjustedbw >= bitrate &&
                // no level change, or new level has no error history
                (i === lastLoadedFragLevel ||
                    (levelInfo.loadError === 0 && levelInfo.fragmentError === 0)) &&
                // fragment fetchDuration unknown OR live stream OR fragment fetchDuration less than max allowed fetch duration, then this level matches
                // we don't account for max Fetch Duration for live streams, this is to avoid switching down when near the edge of live sliding window ...
                // special case to support startLevel = -1 (bitrateTest) on live streams : in that case we should not exit loop so that findBestLevel will return -1
                (fetchDuration <= ttfbEstimateSec ||
                    !Number.isFinite(fetchDuration) ||
                    (live && !this_1.bitrateTestDelay) ||
                    fetchDuration < maxFetchDuration);
            if (canSwitchWithinTolerance) {
                var forcedAutoLevel = this_1.forcedAutoLevel;
                if (i !== loadLevel &&
                    (forcedAutoLevel === -1 || forcedAutoLevel !== loadLevel)) {
                    if (levelsSkipped.length) {
                        logger_1.logger.trace("[abr] Skipped level(s) ".concat(levelsSkipped.join(','), " of ").concat(maxAutoLevel, " max with CODECS and VIDEO-RANGE:\"").concat(levels[levelsSkipped[0]].codecs, "\" ").concat(levels[levelsSkipped[0]].videoRange, "; not compatible with \"").concat(level.codecs, "\" ").concat(currentVideoRange));
                    }
                    logger_1.logger.info("[abr] switch candidate:".concat(selectionBaseLevel, "->").concat(i, " adjustedbw(").concat(Math.round(adjustedbw), ")-bitrate=").concat(Math.round(adjustedbw - bitrate), " ttfb:").concat(ttfbEstimateSec.toFixed(1), " avgDuration:").concat(avgDuration.toFixed(1), " maxFetchDuration:").concat(maxFetchDuration.toFixed(1), " fetchDuration:").concat(fetchDuration.toFixed(1), " firstSelection:").concat(firstSelection, " codecSet:").concat(currentCodecSet, " videoRange:").concat(currentVideoRange, " hls.loadLevel:").concat(loadLevel));
                }
                if (firstSelection) {
                    this_1.firstSelection = i;
                }
                return { value: i };
            }
        };
        var this_1 = this;
        for (var i = maxAutoLevel; i >= minAutoLevel; i--) {
            var state_1 = _loop_1(i);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        // not enough time budget even with quality level 0 ... rebuffering might happen
        return -1;
    };
    return AbrController;
}());
exports.default = AbrController;
