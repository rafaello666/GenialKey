"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var OutputFilter = /** @class */ (function () {
    function OutputFilter(timelineController, trackName) {
        this.cueRanges = [];
        this.startTime = null;
        this.endTime = null;
        this.screen = null;
        this.timelineController = timelineController;
        this.trackName = trackName;
    }
    OutputFilter.prototype.dispatchCue = function () {
        if (this.startTime === null) {
            return;
        }
        this.timelineController.addCues(this.trackName, this.startTime, this.endTime, this.screen, this.cueRanges);
        this.startTime = null;
    };
    OutputFilter.prototype.newCue = function (startTime, endTime, screen) {
        if (this.startTime === null || this.startTime > startTime) {
            this.startTime = startTime;
        }
        this.endTime = endTime;
        this.screen = screen;
        this.timelineController.createCaptionsTrack(this.trackName);
    };
    OutputFilter.prototype.reset = function () {
        this.cueRanges = [];
        this.startTime = null;
    };
    return OutputFilter;
}());
exports.default = OutputFilter;
