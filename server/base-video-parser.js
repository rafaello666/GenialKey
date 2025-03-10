"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var logger_1 = require("../../utils/logger");
var BaseVideoParser = /** @class */ (function () {
    function BaseVideoParser() {
        this.VideoSample = null;
    }
    BaseVideoParser.prototype.createVideoSample = function (key, pts, dts, debug) {
        return {
            key: key,
            frame: false,
            pts: pts,
            dts: dts,
            units: [],
            debug: debug,
            length: 0,
        };
    };
    BaseVideoParser.prototype.getLastNalUnit = function (samples) {
        var VideoSample = this.VideoSample;
        var lastUnit;
        // try to fallback to previous sample if current one is empty
        if (!VideoSample || VideoSample.units.length === 0) {
            VideoSample = samples[samples.length - 1];
        }
        if (VideoSample === null || VideoSample === void 0 ? void 0 : VideoSample.units) {
            var units = VideoSample.units;
            lastUnit = units[units.length - 1];
        }
        return lastUnit;
    };
    BaseVideoParser.prototype.pushAccessUnit = function (VideoSample, videoTrack) {
        if (VideoSample.units.length && VideoSample.frame) {
            // if sample does not have PTS/DTS, patch with last sample PTS/DTS
            if (VideoSample.pts === undefined) {
                var samples = videoTrack.samples;
                var nbSamples = samples.length;
                if (nbSamples) {
                    var lastSample = samples[nbSamples - 1];
                    VideoSample.pts = lastSample.pts;
                    VideoSample.dts = lastSample.dts;
                }
                else {
                    // dropping samples, no timestamp found
                    videoTrack.dropped++;
                    return;
                }
            }
            videoTrack.samples.push(VideoSample);
        }
        if (VideoSample.debug.length) {
            logger_1.logger.log(VideoSample.pts + '/' + VideoSample.dts + ':' + VideoSample.debug);
        }
    };
    return BaseVideoParser;
}());
exports.default = BaseVideoParser;
