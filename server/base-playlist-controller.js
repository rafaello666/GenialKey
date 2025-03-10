"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var level_1 = require("../types/level");
var level_helper_1 = require("../utils/level-helper");
var error_helper_1 = require("../utils/error-helper");
var logger_1 = require("../utils/logger");
var BasePlaylistController = /** @class */ (function () {
    function BasePlaylistController(hls, logPrefix) {
        this.timer = -1;
        this.requestScheduled = -1;
        this.canLoad = false;
        this.log = logger_1.logger.log.bind(logger_1.logger, "".concat(logPrefix, ":"));
        this.warn = logger_1.logger.warn.bind(logger_1.logger, "".concat(logPrefix, ":"));
        this.hls = hls;
    }
    BasePlaylistController.prototype.destroy = function () {
        this.clearTimer();
        // @ts-ignore
        this.hls = this.log = this.warn = null;
    };
    BasePlaylistController.prototype.clearTimer = function () {
        if (this.timer !== -1) {
            self.clearTimeout(this.timer);
            this.timer = -1;
        }
    };
    BasePlaylistController.prototype.startLoad = function () {
        this.canLoad = true;
        this.requestScheduled = -1;
        this.loadPlaylist();
    };
    BasePlaylistController.prototype.stopLoad = function () {
        this.canLoad = false;
        this.clearTimer();
    };
    BasePlaylistController.prototype.switchParams = function (playlistUri, previous, current) {
        var renditionReports = previous === null || previous === void 0 ? void 0 : previous.renditionReports;
        if (renditionReports) {
            var foundIndex = -1;
            for (var i = 0; i < renditionReports.length; i++) {
                var attr = renditionReports[i];
                var uri = void 0;
                try {
                    uri = new self.URL(attr.URI, previous.url).href;
                }
                catch (error) {
                    logger_1.logger.warn("Could not construct new URL for Rendition Report: ".concat(error));
                    uri = attr.URI || '';
                }
                // Use exact match. Otherwise, the last partial match, if any, will be used
                // (Playlist URI includes a query string that the Rendition Report does not)
                if (uri === playlistUri) {
                    foundIndex = i;
                    break;
                }
                else if (uri === playlistUri.substring(0, uri.length)) {
                    foundIndex = i;
                }
            }
            if (foundIndex !== -1) {
                var attr = renditionReports[foundIndex];
                var msn = parseInt(attr['LAST-MSN']) || (previous === null || previous === void 0 ? void 0 : previous.lastPartSn);
                var part = parseInt(attr['LAST-PART']) || (previous === null || previous === void 0 ? void 0 : previous.lastPartIndex);
                if (this.hls.config.lowLatencyMode) {
                    var currentGoal = Math.min(previous.age - previous.partTarget, previous.targetduration);
                    if (part >= 0 && currentGoal > previous.partTarget) {
                        part += 1;
                    }
                }
                var skip = current && (0, level_1.getSkipValue)(current);
                return new level_1.HlsUrlParameters(msn, part >= 0 ? part : undefined, skip);
            }
        }
    };
    BasePlaylistController.prototype.loadPlaylist = function (hlsUrlParameters) {
        if (this.requestScheduled === -1) {
            this.requestScheduled = self.performance.now();
        }
        // Loading is handled by the subclasses
    };
    BasePlaylistController.prototype.shouldLoadPlaylist = function (playlist) {
        return (this.canLoad &&
            !!playlist &&
            !!playlist.url &&
            (!playlist.details || playlist.details.live));
    };
    BasePlaylistController.prototype.shouldReloadPlaylist = function (playlist) {
        return (this.timer === -1 &&
            this.requestScheduled === -1 &&
            this.shouldLoadPlaylist(playlist));
    };
    BasePlaylistController.prototype.playlistLoaded = function (index, data, previousDetails) {
        var _this = this;
        var details = data.details, stats = data.stats;
        // Set last updated date-time
        var now = self.performance.now();
        var elapsed = stats.loading.first
            ? Math.max(0, now - stats.loading.first)
            : 0;
        details.advancedDateTime = Date.now() - elapsed;
        // if current playlist is a live playlist, arm a timer to reload it
        if (details.live || (previousDetails === null || previousDetails === void 0 ? void 0 : previousDetails.live)) {
            details.reloaded(previousDetails);
            if (previousDetails) {
                this.log("live playlist ".concat(index, " ").concat(details.advanced
                    ? 'REFRESHED ' + details.lastPartSn + '-' + details.lastPartIndex
                    : details.updated
                        ? 'UPDATED'
                        : 'MISSED'));
            }
            // Merge live playlists to adjust fragment starts and fill in delta playlist skipped segments
            if (previousDetails && details.fragments.length > 0) {
                (0, level_helper_1.mergeDetails)(previousDetails, details);
            }
            if (!this.canLoad || !details.live) {
                return;
            }
            var deliveryDirectives_1;
            var msn = undefined;
            var part = undefined;
            if (details.canBlockReload && details.endSN && details.advanced) {
                // Load level with LL-HLS delivery directives
                var lowLatencyMode = this.hls.config.lowLatencyMode;
                var lastPartSn = details.lastPartSn;
                var endSn = details.endSN;
                var lastPartIndex = details.lastPartIndex;
                var hasParts = lastPartIndex !== -1;
                var lastPart = lastPartSn === endSn;
                // When low latency mode is disabled, we'll skip part requests once the last part index is found
                var nextSnStartIndex = lowLatencyMode ? 0 : lastPartIndex;
                if (hasParts) {
                    msn = lastPart ? endSn + 1 : lastPartSn;
                    part = lastPart ? nextSnStartIndex : lastPartIndex + 1;
                }
                else {
                    msn = endSn + 1;
                }
                // Low-Latency CDN Tune-in: "age" header and time since load indicates we're behind by more than one part
                // Update directives to obtain the Playlist that has the estimated additional duration of media
                var lastAdvanced = details.age;
                var cdnAge = lastAdvanced + details.ageHeader;
                var currentGoal = Math.min(cdnAge - details.partTarget, details.targetduration * 1.5);
                if (currentGoal > 0) {
                    if (previousDetails && currentGoal > previousDetails.tuneInGoal) {
                        // If we attempted to get the next or latest playlist update, but currentGoal increased,
                        // then we either can't catchup, or the "age" header cannot be trusted.
                        this.warn("CDN Tune-in goal increased from: ".concat(previousDetails.tuneInGoal, " to: ").concat(currentGoal, " with playlist age: ").concat(details.age));
                        currentGoal = 0;
                    }
                    else {
                        var segments = Math.floor(currentGoal / details.targetduration);
                        msn += segments;
                        if (part !== undefined) {
                            var parts = Math.round((currentGoal % details.targetduration) / details.partTarget);
                            part += parts;
                        }
                        this.log("CDN Tune-in age: ".concat(details.ageHeader, "s last advanced ").concat(lastAdvanced.toFixed(2), "s goal: ").concat(currentGoal, " skip sn ").concat(segments, " to part ").concat(part));
                    }
                    details.tuneInGoal = currentGoal;
                }
                deliveryDirectives_1 = this.getDeliveryDirectives(details, data.deliveryDirectives, msn, part);
                if (lowLatencyMode || !lastPart) {
                    this.loadPlaylist(deliveryDirectives_1);
                    return;
                }
            }
            else if (details.canBlockReload || details.canSkipUntil) {
                deliveryDirectives_1 = this.getDeliveryDirectives(details, data.deliveryDirectives, msn, part);
            }
            var bufferInfo = this.hls.mainForwardBufferInfo;
            var position = bufferInfo ? bufferInfo.end - bufferInfo.len : 0;
            var distanceToLiveEdgeMs = (details.edge - position) * 1000;
            var reloadInterval = (0, level_helper_1.computeReloadInterval)(details, distanceToLiveEdgeMs);
            if (details.updated && now > this.requestScheduled + reloadInterval) {
                this.requestScheduled = stats.loading.start;
            }
            if (msn !== undefined && details.canBlockReload) {
                this.requestScheduled =
                    stats.loading.first +
                        reloadInterval -
                        (details.partTarget * 1000 || 1000);
            }
            else if (this.requestScheduled === -1 ||
                this.requestScheduled + reloadInterval < now) {
                this.requestScheduled = now;
            }
            else if (this.requestScheduled - now <= 0) {
                this.requestScheduled += reloadInterval;
            }
            var estimatedTimeUntilUpdate = this.requestScheduled - now;
            estimatedTimeUntilUpdate = Math.max(0, estimatedTimeUntilUpdate);
            this.log("reload live playlist ".concat(index, " in ").concat(Math.round(estimatedTimeUntilUpdate), " ms"));
            // this.log(
            //   `live reload ${details.updated ? 'REFRESHED' : 'MISSED'}
            // reload in ${estimatedTimeUntilUpdate / 1000}
            // round trip ${(stats.loading.end - stats.loading.start) / 1000}
            // diff ${
            //   (reloadInterval -
            //     (estimatedTimeUntilUpdate +
            //       stats.loading.end -
            //       stats.loading.start)) /
            //   1000
            // }
            // reload interval ${reloadInterval / 1000}
            // target duration ${details.targetduration}
            // distance to edge ${distanceToLiveEdgeMs / 1000}`
            // );
            this.timer = self.setTimeout(function () { return _this.loadPlaylist(deliveryDirectives_1); }, estimatedTimeUntilUpdate);
        }
        else {
            this.clearTimer();
        }
    };
    BasePlaylistController.prototype.getDeliveryDirectives = function (details, previousDeliveryDirectives, msn, part) {
        var skip = (0, level_1.getSkipValue)(details);
        if ((previousDeliveryDirectives === null || previousDeliveryDirectives === void 0 ? void 0 : previousDeliveryDirectives.skip) && details.deltaUpdateFailed) {
            msn = previousDeliveryDirectives.msn;
            part = previousDeliveryDirectives.part;
            skip = level_1.HlsSkip.No;
        }
        return new level_1.HlsUrlParameters(msn, part, skip);
    };
    BasePlaylistController.prototype.checkRetry = function (errorEvent) {
        var _this = this;
        var _a;
        var errorDetails = errorEvent.details;
        var isTimeout = (0, error_helper_1.isTimeoutError)(errorEvent);
        var errorAction = errorEvent.errorAction;
        var _b = errorAction || {}, action = _b.action, _c = _b.retryCount, retryCount = _c === void 0 ? 0 : _c, retryConfig = _b.retryConfig;
        var retry = !!errorAction &&
            !!retryConfig &&
            (action === 5 /* NetworkErrorAction.RetryRequest */ ||
                (!errorAction.resolved &&
                    action === 2 /* NetworkErrorAction.SendAlternateToPenaltyBox */));
        if (retry) {
            this.requestScheduled = -1;
            if (retryCount >= retryConfig.maxNumRetry) {
                return false;
            }
            if (isTimeout && ((_a = errorEvent.context) === null || _a === void 0 ? void 0 : _a.deliveryDirectives)) {
                // The LL-HLS request already timed out so retry immediately
                this.warn("Retrying playlist loading ".concat(retryCount + 1, "/").concat(retryConfig.maxNumRetry, " after \"").concat(errorDetails, "\" without delivery-directives"));
                this.loadPlaylist();
            }
            else {
                var delay = (0, error_helper_1.getRetryDelay)(retryConfig, retryCount);
                // Schedule level/track reload
                this.timer = self.setTimeout(function () { return _this.loadPlaylist(); }, delay);
                this.warn("Retrying playlist loading ".concat(retryCount + 1, "/").concat(retryConfig.maxNumRetry, " after \"").concat(errorDetails, "\" in ").concat(delay, "ms"));
            }
            // `levelRetry = true` used to inform other controllers that a retry is happening
            errorEvent.levelRetry = true;
            errorAction.resolved = true;
        }
        return retry;
    };
    return BasePlaylistController;
}());
exports.default = BasePlaylistController;
