"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("../events");
var logger_1 = require("../utils/logger");
var FPSController = /** @class */ (function () {
    function FPSController(hls) {
        this.isVideoPlaybackQualityAvailable = false;
        this.media = null;
        this.lastDroppedFrames = 0;
        this.lastDecodedFrames = 0;
        this.hls = hls;
        this.registerListeners();
    }
    FPSController.prototype.setStreamController = function (streamController) {
        this.streamController = streamController;
    };
    FPSController.prototype.registerListeners = function () {
        this.hls.on(events_1.Events.MEDIA_ATTACHING, this.onMediaAttaching, this);
    };
    FPSController.prototype.unregisterListeners = function () {
        this.hls.off(events_1.Events.MEDIA_ATTACHING, this.onMediaAttaching, this);
    };
    FPSController.prototype.destroy = function () {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.unregisterListeners();
        this.isVideoPlaybackQualityAvailable = false;
        this.media = null;
    };
    FPSController.prototype.onMediaAttaching = function (event, data) {
        var config = this.hls.config;
        if (config.capLevelOnFPSDrop) {
            var media = data.media instanceof self.HTMLVideoElement ? data.media : null;
            this.media = media;
            if (media && typeof media.getVideoPlaybackQuality === 'function') {
                this.isVideoPlaybackQualityAvailable = true;
            }
            self.clearInterval(this.timer);
            this.timer = self.setInterval(this.checkFPSInterval.bind(this), config.fpsDroppedMonitoringPeriod);
        }
    };
    FPSController.prototype.checkFPS = function (video, decodedFrames, droppedFrames) {
        var currentTime = performance.now();
        if (decodedFrames) {
            if (this.lastTime) {
                var currentPeriod = currentTime - this.lastTime;
                var currentDropped = droppedFrames - this.lastDroppedFrames;
                var currentDecoded = decodedFrames - this.lastDecodedFrames;
                var droppedFPS = (1000 * currentDropped) / currentPeriod;
                var hls = this.hls;
                hls.trigger(events_1.Events.FPS_DROP, {
                    currentDropped: currentDropped,
                    currentDecoded: currentDecoded,
                    totalDroppedFrames: droppedFrames,
                });
                if (droppedFPS > 0) {
                    // logger.log('checkFPS : droppedFPS/decodedFPS:' + droppedFPS/(1000 * currentDecoded / currentPeriod));
                    if (currentDropped >
                        hls.config.fpsDroppedMonitoringThreshold * currentDecoded) {
                        var currentLevel = hls.currentLevel;
                        logger_1.logger.warn('drop FPS ratio greater than max allowed value for currentLevel: ' +
                            currentLevel);
                        if (currentLevel > 0 &&
                            (hls.autoLevelCapping === -1 ||
                                hls.autoLevelCapping >= currentLevel)) {
                            currentLevel = currentLevel - 1;
                            hls.trigger(events_1.Events.FPS_DROP_LEVEL_CAPPING, {
                                level: currentLevel,
                                droppedLevel: hls.currentLevel,
                            });
                            hls.autoLevelCapping = currentLevel;
                            this.streamController.nextLevelSwitch();
                        }
                    }
                }
            }
            this.lastTime = currentTime;
            this.lastDroppedFrames = droppedFrames;
            this.lastDecodedFrames = decodedFrames;
        }
    };
    FPSController.prototype.checkFPSInterval = function () {
        var video = this.media;
        if (video) {
            if (this.isVideoPlaybackQualityAvailable) {
                var videoPlaybackQuality = video.getVideoPlaybackQuality();
                this.checkFPS(video, videoPlaybackQuality.totalVideoFrames, videoPlaybackQuality.droppedVideoFrames);
            }
            else {
                // HTMLVideoElement doesn't include the webkit types
                this.checkFPS(video, video.webkitDecodedFrameCount, video.webkitDroppedFrameCount);
            }
        }
    };
    return FPSController;
}());
exports.default = FPSController;
