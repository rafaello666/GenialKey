"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("../errors");
var events_1 = require("../events");
var logger_1 = require("../utils/logger");
var LatencyController = /** @class */ (function () {
    function LatencyController(hls) {
        var _this = this;
        this.media = null;
        this.levelDetails = null;
        this.currentTime = 0;
        this.stallCount = 0;
        this._latency = null;
        this.timeupdateHandler = function () { return _this.timeupdate(); };
        this.hls = hls;
        this.config = hls.config;
        this.registerListeners();
    }
    Object.defineProperty(LatencyController.prototype, "latency", {
        get: function () {
            return this._latency || 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LatencyController.prototype, "maxLatency", {
        get: function () {
            var _a = this, config = _a.config, levelDetails = _a.levelDetails;
            if (config.liveMaxLatencyDuration !== undefined) {
                return config.liveMaxLatencyDuration;
            }
            return levelDetails
                ? config.liveMaxLatencyDurationCount * levelDetails.targetduration
                : 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LatencyController.prototype, "targetLatency", {
        get: function () {
            var levelDetails = this.levelDetails;
            if (levelDetails === null) {
                return null;
            }
            var holdBack = levelDetails.holdBack, partHoldBack = levelDetails.partHoldBack, targetduration = levelDetails.targetduration;
            var _a = this.config, liveSyncDuration = _a.liveSyncDuration, liveSyncDurationCount = _a.liveSyncDurationCount, lowLatencyMode = _a.lowLatencyMode;
            var userConfig = this.hls.userConfig;
            var targetLatency = lowLatencyMode ? partHoldBack || holdBack : holdBack;
            if (userConfig.liveSyncDuration ||
                userConfig.liveSyncDurationCount ||
                targetLatency === 0) {
                targetLatency =
                    liveSyncDuration !== undefined
                        ? liveSyncDuration
                        : liveSyncDurationCount * targetduration;
            }
            var maxLiveSyncOnStallIncrease = targetduration;
            var liveSyncOnStallIncrease = 1.0;
            return (targetLatency +
                Math.min(this.stallCount * liveSyncOnStallIncrease, maxLiveSyncOnStallIncrease));
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LatencyController.prototype, "liveSyncPosition", {
        get: function () {
            var liveEdge = this.estimateLiveEdge();
            var targetLatency = this.targetLatency;
            var levelDetails = this.levelDetails;
            if (liveEdge === null || targetLatency === null || levelDetails === null) {
                return null;
            }
            var edge = levelDetails.edge;
            var syncPosition = liveEdge - targetLatency - this.edgeStalled;
            var min = edge - levelDetails.totalduration;
            var max = edge -
                ((this.config.lowLatencyMode && levelDetails.partTarget) ||
                    levelDetails.targetduration);
            return Math.min(Math.max(min, syncPosition), max);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LatencyController.prototype, "drift", {
        get: function () {
            var levelDetails = this.levelDetails;
            if (levelDetails === null) {
                return 1;
            }
            return levelDetails.drift;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LatencyController.prototype, "edgeStalled", {
        get: function () {
            var levelDetails = this.levelDetails;
            if (levelDetails === null) {
                return 0;
            }
            var maxLevelUpdateAge = ((this.config.lowLatencyMode && levelDetails.partTarget) ||
                levelDetails.targetduration) * 3;
            return Math.max(levelDetails.age - maxLevelUpdateAge, 0);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LatencyController.prototype, "forwardBufferLength", {
        get: function () {
            var _a = this, media = _a.media, levelDetails = _a.levelDetails;
            if (!media || !levelDetails) {
                return 0;
            }
            var bufferedRanges = media.buffered.length;
            return ((bufferedRanges
                ? media.buffered.end(bufferedRanges - 1)
                : levelDetails.edge) - this.currentTime);
        },
        enumerable: false,
        configurable: true
    });
    LatencyController.prototype.destroy = function () {
        this.unregisterListeners();
        this.onMediaDetaching();
        this.levelDetails = null;
        // @ts-ignore
        this.hls = this.timeupdateHandler = null;
    };
    LatencyController.prototype.registerListeners = function () {
        this.hls.on(events_1.Events.MEDIA_ATTACHED, this.onMediaAttached, this);
        this.hls.on(events_1.Events.MEDIA_DETACHING, this.onMediaDetaching, this);
        this.hls.on(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        this.hls.on(events_1.Events.LEVEL_UPDATED, this.onLevelUpdated, this);
        this.hls.on(events_1.Events.ERROR, this.onError, this);
    };
    LatencyController.prototype.unregisterListeners = function () {
        this.hls.off(events_1.Events.MEDIA_ATTACHED, this.onMediaAttached, this);
        this.hls.off(events_1.Events.MEDIA_DETACHING, this.onMediaDetaching, this);
        this.hls.off(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        this.hls.off(events_1.Events.LEVEL_UPDATED, this.onLevelUpdated, this);
        this.hls.off(events_1.Events.ERROR, this.onError, this);
    };
    LatencyController.prototype.onMediaAttached = function (event, data) {
        this.media = data.media;
        this.media.addEventListener('timeupdate', this.timeupdateHandler);
    };
    LatencyController.prototype.onMediaDetaching = function () {
        if (this.media) {
            this.media.removeEventListener('timeupdate', this.timeupdateHandler);
            this.media = null;
        }
    };
    LatencyController.prototype.onManifestLoading = function () {
        this.levelDetails = null;
        this._latency = null;
        this.stallCount = 0;
    };
    LatencyController.prototype.onLevelUpdated = function (event, _a) {
        var details = _a.details;
        this.levelDetails = details;
        if (details.advanced) {
            this.timeupdate();
        }
        if (!details.live && this.media) {
            this.media.removeEventListener('timeupdate', this.timeupdateHandler);
        }
    };
    LatencyController.prototype.onError = function (event, data) {
        var _a;
        if (data.details !== errors_1.ErrorDetails.BUFFER_STALLED_ERROR) {
            return;
        }
        this.stallCount++;
        if ((_a = this.levelDetails) === null || _a === void 0 ? void 0 : _a.live) {
            logger_1.logger.warn('[playback-rate-controller]: Stall detected, adjusting target latency');
        }
    };
    LatencyController.prototype.timeupdate = function () {
        var _a = this, media = _a.media, levelDetails = _a.levelDetails;
        if (!media || !levelDetails) {
            return;
        }
        this.currentTime = media.currentTime;
        var latency = this.computeLatency();
        if (latency === null) {
            return;
        }
        this._latency = latency;
        // Adapt playbackRate to meet target latency in low-latency mode
        var _b = this.config, lowLatencyMode = _b.lowLatencyMode, maxLiveSyncPlaybackRate = _b.maxLiveSyncPlaybackRate;
        if (!lowLatencyMode ||
            maxLiveSyncPlaybackRate === 1 ||
            !levelDetails.live) {
            return;
        }
        var targetLatency = this.targetLatency;
        if (targetLatency === null) {
            return;
        }
        var distanceFromTarget = latency - targetLatency;
        // Only adjust playbackRate when within one target duration of targetLatency
        // and more than one second from under-buffering.
        // Playback further than one target duration from target can be considered DVR playback.
        var liveMinLatencyDuration = Math.min(this.maxLatency, targetLatency + levelDetails.targetduration);
        var inLiveRange = distanceFromTarget < liveMinLatencyDuration;
        if (inLiveRange &&
            distanceFromTarget > 0.05 &&
            this.forwardBufferLength > 1) {
            var max = Math.min(2, Math.max(1.0, maxLiveSyncPlaybackRate));
            var rate = Math.round((2 / (1 + Math.exp(-0.75 * distanceFromTarget - this.edgeStalled))) *
                20) / 20;
            media.playbackRate = Math.min(max, Math.max(1, rate));
        }
        else if (media.playbackRate !== 1 && media.playbackRate !== 0) {
            media.playbackRate = 1;
        }
    };
    LatencyController.prototype.estimateLiveEdge = function () {
        var levelDetails = this.levelDetails;
        if (levelDetails === null) {
            return null;
        }
        return levelDetails.edge + levelDetails.age;
    };
    LatencyController.prototype.computeLatency = function () {
        var liveEdge = this.estimateLiveEdge();
        if (liveEdge === null) {
            return null;
        }
        return liveEdge - this.currentTime;
    };
    return LatencyController;
}());
exports.default = LatencyController;
