"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SKIP_BUFFER_RANGE_START = exports.SKIP_BUFFER_HOLE_STEP_SECONDS = exports.MAX_START_GAP_JUMP = exports.STALL_MINIMUM_DURATION_MS = void 0;
var buffer_helper_1 = require("../utils/buffer-helper");
var errors_1 = require("../errors");
var loader_1 = require("../types/loader");
var events_1 = require("../events");
var logger_1 = require("../utils/logger");
exports.STALL_MINIMUM_DURATION_MS = 250;
exports.MAX_START_GAP_JUMP = 2.0;
exports.SKIP_BUFFER_HOLE_STEP_SECONDS = 0.1;
exports.SKIP_BUFFER_RANGE_START = 0.05;
var GapController = /** @class */ (function () {
    function GapController(config, media, fragmentTracker, hls) {
        this.media = null;
        this.nudgeRetry = 0;
        this.stallReported = false;
        this.stalled = null;
        this.moved = false;
        this.seeking = false;
        this.config = config;
        this.media = media;
        this.fragmentTracker = fragmentTracker;
        this.hls = hls;
    }
    GapController.prototype.destroy = function () {
        this.media = null;
        // @ts-ignore
        this.hls = this.fragmentTracker = null;
    };
    /**
     * Checks if the playhead is stuck within a gap, and if so, attempts to free it.
     * A gap is an unbuffered range between two buffered ranges (or the start and the first buffered range).
     *
     * @param lastCurrentTime - Previously read playhead position
     */
    GapController.prototype.poll = function (lastCurrentTime, activeFrag) {
        var _a;
        var _b = this, config = _b.config, media = _b.media, stalled = _b.stalled;
        if (media === null) {
            return;
        }
        var currentTime = media.currentTime, seeking = media.seeking;
        var seeked = this.seeking && !seeking;
        var beginSeek = !this.seeking && seeking;
        this.seeking = seeking;
        // The playhead is moving, no-op
        if (currentTime !== lastCurrentTime) {
            this.moved = true;
            if (!seeking) {
                this.nudgeRetry = 0;
            }
            if (stalled !== null) {
                // The playhead is now moving, but was previously stalled
                if (this.stallReported) {
                    var stalledDuration_1 = self.performance.now() - stalled;
                    logger_1.logger.warn("playback not stuck anymore @".concat(currentTime, ", after ").concat(Math.round(stalledDuration_1), "ms"));
                    this.stallReported = false;
                }
                this.stalled = null;
            }
            return;
        }
        // Clear stalled state when beginning or finishing seeking so that we don't report stalls coming out of a seek
        if (beginSeek || seeked) {
            this.stalled = null;
            return;
        }
        // The playhead should not be moving
        if ((media.paused && !seeking) ||
            media.ended ||
            media.playbackRate === 0 ||
            !buffer_helper_1.BufferHelper.getBuffered(media).length) {
            this.nudgeRetry = 0;
            return;
        }
        var bufferInfo = buffer_helper_1.BufferHelper.bufferInfo(media, currentTime, 0);
        var nextStart = bufferInfo.nextStart || 0;
        if (seeking) {
            // Waiting for seeking in a buffered range to complete
            var hasEnoughBuffer = bufferInfo.len > exports.MAX_START_GAP_JUMP;
            // Next buffered range is too far ahead to jump to while still seeking
            var noBufferGap = !nextStart ||
                (activeFrag && activeFrag.start <= currentTime) ||
                (nextStart - currentTime > exports.MAX_START_GAP_JUMP &&
                    !this.fragmentTracker.getPartialFragment(currentTime));
            if (hasEnoughBuffer || noBufferGap) {
                return;
            }
            // Reset moved state when seeking to a point in or before a gap
            this.moved = false;
        }
        // Skip start gaps if we haven't played, but the last poll detected the start of a stall
        // The addition poll gives the browser a chance to jump the gap for us
        if (!this.moved && this.stalled !== null) {
            // There is no playable buffer (seeked, waiting for buffer)
            var isBuffered = bufferInfo.len > 0;
            if (!isBuffered && !nextStart) {
                return;
            }
            // Jump start gaps within jump threshold
            var startJump = Math.max(nextStart, bufferInfo.start || 0) - currentTime;
            // When joining a live stream with audio tracks, account for live playlist window sliding by allowing
            // a larger jump over start gaps caused by the audio-stream-controller buffering a start fragment
            // that begins over 1 target duration after the video start position.
            var level = this.hls.levels
                ? this.hls.levels[this.hls.currentLevel]
                : null;
            var isLive = (_a = level === null || level === void 0 ? void 0 : level.details) === null || _a === void 0 ? void 0 : _a.live;
            var maxStartGapJump = isLive
                ? level.details.targetduration * 2
                : exports.MAX_START_GAP_JUMP;
            var partialOrGap = this.fragmentTracker.getPartialFragment(currentTime);
            if (startJump > 0 && (startJump <= maxStartGapJump || partialOrGap)) {
                if (!media.paused) {
                    this._trySkipBufferHole(partialOrGap);
                }
                return;
            }
        }
        // Start tracking stall time
        var tnow = self.performance.now();
        if (stalled === null) {
            this.stalled = tnow;
            return;
        }
        var stalledDuration = tnow - stalled;
        if (!seeking && stalledDuration >= exports.STALL_MINIMUM_DURATION_MS) {
            // Report stalling after trying to fix
            this._reportStall(bufferInfo);
            if (!this.media) {
                return;
            }
        }
        var bufferedWithHoles = buffer_helper_1.BufferHelper.bufferInfo(media, currentTime, config.maxBufferHole);
        this._tryFixBufferStall(bufferedWithHoles, stalledDuration);
    };
    /**
     * Detects and attempts to fix known buffer stalling issues.
     * @param bufferInfo - The properties of the current buffer.
     * @param stalledDurationMs - The amount of time Hls.js has been stalling for.
     * @private
     */
    GapController.prototype._tryFixBufferStall = function (bufferInfo, stalledDurationMs) {
        var _a = this, config = _a.config, fragmentTracker = _a.fragmentTracker, media = _a.media;
        if (media === null) {
            return;
        }
        var currentTime = media.currentTime;
        var partial = fragmentTracker.getPartialFragment(currentTime);
        if (partial) {
            // Try to skip over the buffer hole caused by a partial fragment
            // This method isn't limited by the size of the gap between buffered ranges
            var targetTime = this._trySkipBufferHole(partial);
            // we return here in this case, meaning
            // the branch below only executes when we haven't seeked to a new position
            if (targetTime || !this.media) {
                return;
            }
        }
        // if we haven't had to skip over a buffer hole of a partial fragment
        // we may just have to "nudge" the playlist as the browser decoding/rendering engine
        // needs to cross some sort of threshold covering all source-buffers content
        // to start playing properly.
        if ((bufferInfo.len > config.maxBufferHole ||
            (bufferInfo.nextStart &&
                bufferInfo.nextStart - currentTime < config.maxBufferHole)) &&
            stalledDurationMs > config.highBufferWatchdogPeriod * 1000) {
            logger_1.logger.warn('Trying to nudge playhead over buffer-hole');
            // Try to nudge currentTime over a buffer hole if we've been stalling for the configured amount of seconds
            // We only try to jump the hole if it's under the configured size
            // Reset stalled so to rearm watchdog timer
            this.stalled = null;
            this._tryNudgeBuffer();
        }
    };
    /**
     * Triggers a BUFFER_STALLED_ERROR event, but only once per stall period.
     * @param bufferLen - The playhead distance from the end of the current buffer segment.
     * @private
     */
    GapController.prototype._reportStall = function (bufferInfo) {
        var _a = this, hls = _a.hls, media = _a.media, stallReported = _a.stallReported;
        if (!stallReported && media) {
            // Report stalled error once
            this.stallReported = true;
            var error = new Error("Playback stalling at @".concat(media.currentTime, " due to low buffer (").concat(JSON.stringify(bufferInfo), ")"));
            logger_1.logger.warn(error.message);
            hls.trigger(events_1.Events.ERROR, {
                type: errors_1.ErrorTypes.MEDIA_ERROR,
                details: errors_1.ErrorDetails.BUFFER_STALLED_ERROR,
                fatal: false,
                error: error,
                buffer: bufferInfo.len,
            });
        }
    };
    /**
     * Attempts to fix buffer stalls by jumping over known gaps caused by partial fragments
     * @param partial - The partial fragment found at the current time (where playback is stalling).
     * @private
     */
    GapController.prototype._trySkipBufferHole = function (partial) {
        var _a = this, config = _a.config, hls = _a.hls, media = _a.media;
        if (media === null) {
            return 0;
        }
        // Check if currentTime is between unbuffered regions of partial fragments
        var currentTime = media.currentTime;
        var bufferInfo = buffer_helper_1.BufferHelper.bufferInfo(media, currentTime, 0);
        var startTime = currentTime < bufferInfo.start ? bufferInfo.start : bufferInfo.nextStart;
        if (startTime) {
            var bufferStarved = bufferInfo.len <= config.maxBufferHole;
            var waiting = bufferInfo.len > 0 && bufferInfo.len < 1 && media.readyState < 3;
            var gapLength = startTime - currentTime;
            if (gapLength > 0 && (bufferStarved || waiting)) {
                // Only allow large gaps to be skipped if it is a start gap, or all fragments in skip range are partial
                if (gapLength > config.maxBufferHole) {
                    var fragmentTracker = this.fragmentTracker;
                    var startGap = false;
                    if (currentTime === 0) {
                        var startFrag = fragmentTracker.getAppendedFrag(0, loader_1.PlaylistLevelType.MAIN);
                        if (startFrag && startTime < startFrag.end) {
                            startGap = true;
                        }
                    }
                    if (!startGap) {
                        var startProvisioned = partial ||
                            fragmentTracker.getAppendedFrag(currentTime, loader_1.PlaylistLevelType.MAIN);
                        if (startProvisioned) {
                            var moreToLoad = false;
                            var pos = startProvisioned.end;
                            while (pos < startTime) {
                                var provisioned = fragmentTracker.getPartialFragment(pos);
                                if (provisioned) {
                                    pos += provisioned.duration;
                                }
                                else {
                                    moreToLoad = true;
                                    break;
                                }
                            }
                            if (moreToLoad) {
                                return 0;
                            }
                        }
                    }
                }
                var targetTime = Math.max(startTime + exports.SKIP_BUFFER_RANGE_START, currentTime + exports.SKIP_BUFFER_HOLE_STEP_SECONDS);
                logger_1.logger.warn("skipping hole, adjusting currentTime from ".concat(currentTime, " to ").concat(targetTime));
                this.moved = true;
                this.stalled = null;
                media.currentTime = targetTime;
                if (partial && !partial.gap) {
                    var error = new Error("fragment loaded with buffer holes, seeking from ".concat(currentTime, " to ").concat(targetTime));
                    hls.trigger(events_1.Events.ERROR, {
                        type: errors_1.ErrorTypes.MEDIA_ERROR,
                        details: errors_1.ErrorDetails.BUFFER_SEEK_OVER_HOLE,
                        fatal: false,
                        error: error,
                        reason: error.message,
                        frag: partial,
                    });
                }
                return targetTime;
            }
        }
        return 0;
    };
    /**
     * Attempts to fix buffer stalls by advancing the mediaElement's current time by a small amount.
     * @private
     */
    GapController.prototype._tryNudgeBuffer = function () {
        var _a = this, config = _a.config, hls = _a.hls, media = _a.media, nudgeRetry = _a.nudgeRetry;
        if (media === null) {
            return;
        }
        var currentTime = media.currentTime;
        this.nudgeRetry++;
        if (nudgeRetry < config.nudgeMaxRetry) {
            var targetTime = currentTime + (nudgeRetry + 1) * config.nudgeOffset;
            // playback stalled in buffered area ... let's nudge currentTime to try to overcome this
            var error = new Error("Nudging 'currentTime' from ".concat(currentTime, " to ").concat(targetTime));
            logger_1.logger.warn(error.message);
            media.currentTime = targetTime;
            hls.trigger(events_1.Events.ERROR, {
                type: errors_1.ErrorTypes.MEDIA_ERROR,
                details: errors_1.ErrorDetails.BUFFER_NUDGE_ON_STALL,
                error: error,
                fatal: false,
            });
        }
        else {
            var error = new Error("Playhead still not moving while enough data buffered @".concat(currentTime, " after ").concat(config.nudgeMaxRetry, " nudges"));
            logger_1.logger.error(error.message);
            hls.trigger(events_1.Events.ERROR, {
                type: errors_1.ErrorTypes.MEDIA_ERROR,
                details: errors_1.ErrorDetails.BUFFER_STALLED_ERROR,
                error: error,
                fatal: true,
            });
        }
    };
    return GapController;
}());
exports.default = GapController;
