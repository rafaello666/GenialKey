"use strict";
/*
 * cap stream level to media size dimension controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("../events");
var logger_1 = require("../utils/logger");
var CapLevelController = /** @class */ (function () {
    function CapLevelController(hls) {
        this.hls = hls;
        this.autoLevelCapping = Number.POSITIVE_INFINITY;
        this.firstLevel = -1;
        this.media = null;
        this.restrictedLevels = [];
        this.timer = undefined;
        this.clientRect = null;
        this.registerListeners();
    }
    CapLevelController.prototype.setStreamController = function (streamController) {
        this.streamController = streamController;
    };
    CapLevelController.prototype.destroy = function () {
        if (this.hls) {
            this.unregisterListener();
        }
        if (this.timer) {
            this.stopCapping();
        }
        this.media = null;
        this.clientRect = null;
        // @ts-ignore
        this.hls = this.streamController = null;
    };
    CapLevelController.prototype.registerListeners = function () {
        var hls = this.hls;
        hls.on(events_1.Events.FPS_DROP_LEVEL_CAPPING, this.onFpsDropLevelCapping, this);
        hls.on(events_1.Events.MEDIA_ATTACHING, this.onMediaAttaching, this);
        hls.on(events_1.Events.MANIFEST_PARSED, this.onManifestParsed, this);
        hls.on(events_1.Events.LEVELS_UPDATED, this.onLevelsUpdated, this);
        hls.on(events_1.Events.BUFFER_CODECS, this.onBufferCodecs, this);
        hls.on(events_1.Events.MEDIA_DETACHING, this.onMediaDetaching, this);
    };
    CapLevelController.prototype.unregisterListener = function () {
        var hls = this.hls;
        hls.off(events_1.Events.FPS_DROP_LEVEL_CAPPING, this.onFpsDropLevelCapping, this);
        hls.off(events_1.Events.MEDIA_ATTACHING, this.onMediaAttaching, this);
        hls.off(events_1.Events.MANIFEST_PARSED, this.onManifestParsed, this);
        hls.off(events_1.Events.LEVELS_UPDATED, this.onLevelsUpdated, this);
        hls.off(events_1.Events.BUFFER_CODECS, this.onBufferCodecs, this);
        hls.off(events_1.Events.MEDIA_DETACHING, this.onMediaDetaching, this);
    };
    CapLevelController.prototype.onFpsDropLevelCapping = function (event, data) {
        // Don't add a restricted level more than once
        var level = this.hls.levels[data.droppedLevel];
        if (this.isLevelAllowed(level)) {
            this.restrictedLevels.push({
                bitrate: level.bitrate,
                height: level.height,
                width: level.width,
            });
        }
    };
    CapLevelController.prototype.onMediaAttaching = function (event, data) {
        this.media = data.media instanceof HTMLVideoElement ? data.media : null;
        this.clientRect = null;
        if (this.timer && this.hls.levels.length) {
            this.detectPlayerSize();
        }
    };
    CapLevelController.prototype.onManifestParsed = function (event, data) {
        var hls = this.hls;
        this.restrictedLevels = [];
        this.firstLevel = data.firstLevel;
        if (hls.config.capLevelToPlayerSize && data.video) {
            // Start capping immediately if the manifest has signaled video codecs
            this.startCapping();
        }
    };
    CapLevelController.prototype.onLevelsUpdated = function (event, data) {
        if (this.timer && Number.isFinite(this.autoLevelCapping)) {
            this.detectPlayerSize();
        }
    };
    // Only activate capping when playing a video stream; otherwise, multi-bitrate audio-only streams will be restricted
    // to the first level
    CapLevelController.prototype.onBufferCodecs = function (event, data) {
        var hls = this.hls;
        if (hls.config.capLevelToPlayerSize && data.video) {
            // If the manifest did not signal a video codec capping has been deferred until we're certain video is present
            this.startCapping();
        }
    };
    CapLevelController.prototype.onMediaDetaching = function () {
        this.stopCapping();
    };
    CapLevelController.prototype.detectPlayerSize = function () {
        if (this.media) {
            if (this.mediaHeight <= 0 || this.mediaWidth <= 0) {
                this.clientRect = null;
                return;
            }
            var levels = this.hls.levels;
            if (levels.length) {
                var hls = this.hls;
                var maxLevel = this.getMaxLevel(levels.length - 1);
                if (maxLevel !== this.autoLevelCapping) {
                    logger_1.logger.log("Setting autoLevelCapping to ".concat(maxLevel, ": ").concat(levels[maxLevel].height, "p@").concat(levels[maxLevel].bitrate, " for media ").concat(this.mediaWidth, "x").concat(this.mediaHeight));
                }
                hls.autoLevelCapping = maxLevel;
                if (hls.autoLevelCapping > this.autoLevelCapping &&
                    this.streamController) {
                    // if auto level capping has a higher value for the previous one, flush the buffer using nextLevelSwitch
                    // usually happen when the user go to the fullscreen mode.
                    this.streamController.nextLevelSwitch();
                }
                this.autoLevelCapping = hls.autoLevelCapping;
            }
        }
    };
    /*
     * returns level should be the one with the dimensions equal or greater than the media (player) dimensions (so the video will be downscaled)
     */
    CapLevelController.prototype.getMaxLevel = function (capLevelIndex) {
        var _this = this;
        var levels = this.hls.levels;
        if (!levels.length) {
            return -1;
        }
        var validLevels = levels.filter(function (level, index) { return _this.isLevelAllowed(level) && index <= capLevelIndex; });
        this.clientRect = null;
        return CapLevelController.getMaxLevelByMediaSize(validLevels, this.mediaWidth, this.mediaHeight);
    };
    CapLevelController.prototype.startCapping = function () {
        if (this.timer) {
            // Don't reset capping if started twice; this can happen if the manifest signals a video codec
            return;
        }
        this.autoLevelCapping = Number.POSITIVE_INFINITY;
        self.clearInterval(this.timer);
        this.timer = self.setInterval(this.detectPlayerSize.bind(this), 1000);
        this.detectPlayerSize();
    };
    CapLevelController.prototype.stopCapping = function () {
        this.restrictedLevels = [];
        this.firstLevel = -1;
        this.autoLevelCapping = Number.POSITIVE_INFINITY;
        if (this.timer) {
            self.clearInterval(this.timer);
            this.timer = undefined;
        }
    };
    CapLevelController.prototype.getDimensions = function () {
        if (this.clientRect) {
            return this.clientRect;
        }
        var media = this.media;
        var boundsRect = {
            width: 0,
            height: 0,
        };
        if (media) {
            var clientRect = media.getBoundingClientRect();
            boundsRect.width = clientRect.width;
            boundsRect.height = clientRect.height;
            if (!boundsRect.width && !boundsRect.height) {
                // When the media element has no width or height (equivalent to not being in the DOM),
                // then use its width and height attributes (media.width, media.height)
                boundsRect.width =
                    clientRect.right - clientRect.left || media.width || 0;
                boundsRect.height =
                    clientRect.bottom - clientRect.top || media.height || 0;
            }
        }
        this.clientRect = boundsRect;
        return boundsRect;
    };
    Object.defineProperty(CapLevelController.prototype, "mediaWidth", {
        get: function () {
            return this.getDimensions().width * this.contentScaleFactor;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CapLevelController.prototype, "mediaHeight", {
        get: function () {
            return this.getDimensions().height * this.contentScaleFactor;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CapLevelController.prototype, "contentScaleFactor", {
        get: function () {
            var pixelRatio = 1;
            if (!this.hls.config.ignoreDevicePixelRatio) {
                try {
                    pixelRatio = self.devicePixelRatio;
                }
                catch (e) {
                    /* no-op */
                }
            }
            return pixelRatio;
        },
        enumerable: false,
        configurable: true
    });
    CapLevelController.prototype.isLevelAllowed = function (level) {
        var restrictedLevels = this.restrictedLevels;
        return !restrictedLevels.some(function (restrictedLevel) {
            return (level.bitrate === restrictedLevel.bitrate &&
                level.width === restrictedLevel.width &&
                level.height === restrictedLevel.height);
        });
    };
    CapLevelController.getMaxLevelByMediaSize = function (levels, width, height) {
        if (!(levels === null || levels === void 0 ? void 0 : levels.length)) {
            return -1;
        }
        // Levels can have the same dimensions but differing bandwidths - since levels are ordered, we can look to the next
        // to determine whether we've chosen the greatest bandwidth for the media's dimensions
        var atGreatestBandwidth = function (curLevel, nextLevel) {
            if (!nextLevel) {
                return true;
            }
            return (curLevel.width !== nextLevel.width ||
                curLevel.height !== nextLevel.height);
        };
        // If we run through the loop without breaking, the media's dimensions are greater than every level, so default to
        // the max level
        var maxLevelIndex = levels.length - 1;
        // Prevent changes in aspect-ratio from causing capping to toggle back and forth
        var squareSize = Math.max(width, height);
        for (var i = 0; i < levels.length; i += 1) {
            var level = levels[i];
            if ((level.width >= squareSize || level.height >= squareSize) &&
                atGreatestBandwidth(level, levels[i + 1])) {
                maxLevelIndex = i;
                break;
            }
        }
        return maxLevelIndex;
    };
    return CapLevelController;
}());
exports.default = CapLevelController;
