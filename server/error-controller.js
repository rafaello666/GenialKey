"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("../events");
var errors_1 = require("../errors");
var loader_1 = require("../types/loader");
var error_helper_1 = require("../utils/error-helper");
var fragment_finders_1 = require("./fragment-finders");
var level_1 = require("../types/level");
var logger_1 = require("../utils/logger");
var ErrorController = /** @class */ (function () {
    function ErrorController(hls) {
        this.playlistError = 0;
        this.penalizedRenditions = {};
        this.hls = hls;
        this.log = logger_1.logger.log.bind(logger_1.logger, "[info]:");
        this.warn = logger_1.logger.warn.bind(logger_1.logger, "[warning]:");
        this.error = logger_1.logger.error.bind(logger_1.logger, "[error]:");
        this.registerListeners();
    }
    ErrorController.prototype.registerListeners = function () {
        var hls = this.hls;
        hls.on(events_1.Events.ERROR, this.onError, this);
        hls.on(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.on(events_1.Events.LEVEL_UPDATED, this.onLevelUpdated, this);
    };
    ErrorController.prototype.unregisterListeners = function () {
        var hls = this.hls;
        if (!hls) {
            return;
        }
        hls.off(events_1.Events.ERROR, this.onError, this);
        hls.off(events_1.Events.ERROR, this.onErrorOut, this);
        hls.off(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.off(events_1.Events.LEVEL_UPDATED, this.onLevelUpdated, this);
    };
    ErrorController.prototype.destroy = function () {
        this.unregisterListeners();
        // @ts-ignore
        this.hls = null;
        this.penalizedRenditions = {};
    };
    ErrorController.prototype.startLoad = function (startPosition) { };
    ErrorController.prototype.stopLoad = function () {
        this.playlistError = 0;
    };
    ErrorController.prototype.getVariantLevelIndex = function (frag) {
        return (frag === null || frag === void 0 ? void 0 : frag.type) === loader_1.PlaylistLevelType.MAIN
            ? frag.level
            : this.hls.loadLevel;
    };
    ErrorController.prototype.onManifestLoading = function () {
        this.playlistError = 0;
        this.penalizedRenditions = {};
    };
    ErrorController.prototype.onLevelUpdated = function () {
        this.playlistError = 0;
    };
    ErrorController.prototype.onError = function (event, data) {
        var _a, _b, _c, _d;
        if (data.fatal) {
            return;
        }
        var hls = this.hls;
        var context = data.context;
        switch (data.details) {
            case errors_1.ErrorDetails.FRAG_LOAD_ERROR:
            case errors_1.ErrorDetails.FRAG_LOAD_TIMEOUT:
            case errors_1.ErrorDetails.KEY_LOAD_ERROR:
            case errors_1.ErrorDetails.KEY_LOAD_TIMEOUT:
                data.errorAction = this.getFragRetryOrSwitchAction(data);
                return;
            case errors_1.ErrorDetails.FRAG_PARSING_ERROR:
                // ignore empty segment errors marked as gap
                if ((_a = data.frag) === null || _a === void 0 ? void 0 : _a.gap) {
                    data.errorAction = {
                        action: 0 /* NetworkErrorAction.DoNothing */,
                        flags: 0 /* ErrorActionFlags.None */,
                    };
                    return;
                }
            // falls through
            case errors_1.ErrorDetails.FRAG_GAP:
            case errors_1.ErrorDetails.FRAG_DECRYPT_ERROR: {
                // Switch level if possible, otherwise allow retry count to reach max error retries
                data.errorAction = this.getFragRetryOrSwitchAction(data);
                data.errorAction.action = 2 /* NetworkErrorAction.SendAlternateToPenaltyBox */;
                return;
            }
            case errors_1.ErrorDetails.LEVEL_EMPTY_ERROR:
            case errors_1.ErrorDetails.LEVEL_PARSING_ERROR:
                {
                    // Only retry when empty and live
                    var levelIndex = data.parent === loader_1.PlaylistLevelType.MAIN
                        ? data.level
                        : hls.loadLevel;
                    if (data.details === errors_1.ErrorDetails.LEVEL_EMPTY_ERROR &&
                        !!((_c = (_b = data.context) === null || _b === void 0 ? void 0 : _b.levelDetails) === null || _c === void 0 ? void 0 : _c.live)) {
                        data.errorAction = this.getPlaylistRetryOrSwitchAction(data, levelIndex);
                    }
                    else {
                        // Escalate to fatal if not retrying or switching
                        data.levelRetry = false;
                        data.errorAction = this.getLevelSwitchAction(data, levelIndex);
                    }
                }
                return;
            case errors_1.ErrorDetails.LEVEL_LOAD_ERROR:
            case errors_1.ErrorDetails.LEVEL_LOAD_TIMEOUT:
                if (typeof (context === null || context === void 0 ? void 0 : context.level) === 'number') {
                    data.errorAction = this.getPlaylistRetryOrSwitchAction(data, context.level);
                }
                return;
            case errors_1.ErrorDetails.AUDIO_TRACK_LOAD_ERROR:
            case errors_1.ErrorDetails.AUDIO_TRACK_LOAD_TIMEOUT:
            case errors_1.ErrorDetails.SUBTITLE_LOAD_ERROR:
            case errors_1.ErrorDetails.SUBTITLE_TRACK_LOAD_TIMEOUT:
                if (context) {
                    var level = hls.levels[hls.loadLevel];
                    if (level &&
                        ((context.type === loader_1.PlaylistContextType.AUDIO_TRACK &&
                            level.hasAudioGroup(context.groupId)) ||
                            (context.type === loader_1.PlaylistContextType.SUBTITLE_TRACK &&
                                level.hasSubtitleGroup(context.groupId)))) {
                        // Perform Pathway switch or Redundant failover if possible for fastest recovery
                        // otherwise allow playlist retry count to reach max error retries
                        data.errorAction = this.getPlaylistRetryOrSwitchAction(data, hls.loadLevel);
                        data.errorAction.action =
                            2 /* NetworkErrorAction.SendAlternateToPenaltyBox */;
                        data.errorAction.flags =
                            1 /* ErrorActionFlags.MoveAllAlternatesMatchingHost */;
                        return;
                    }
                }
                return;
            case errors_1.ErrorDetails.KEY_SYSTEM_STATUS_OUTPUT_RESTRICTED:
                {
                    var level = hls.levels[hls.loadLevel];
                    var restrictedHdcpLevel = level === null || level === void 0 ? void 0 : level.attrs['HDCP-LEVEL'];
                    if (restrictedHdcpLevel) {
                        data.errorAction = {
                            action: 2 /* NetworkErrorAction.SendAlternateToPenaltyBox */,
                            flags: 2 /* ErrorActionFlags.MoveAllAlternatesMatchingHDCP */,
                            hdcpLevel: restrictedHdcpLevel,
                        };
                    }
                    else {
                        this.keySystemError(data);
                    }
                }
                return;
            case errors_1.ErrorDetails.BUFFER_ADD_CODEC_ERROR:
            case errors_1.ErrorDetails.REMUX_ALLOC_ERROR:
            case errors_1.ErrorDetails.BUFFER_APPEND_ERROR:
                data.errorAction = this.getLevelSwitchAction(data, (_d = data.level) !== null && _d !== void 0 ? _d : hls.loadLevel);
                return;
            case errors_1.ErrorDetails.INTERNAL_EXCEPTION:
            case errors_1.ErrorDetails.BUFFER_APPENDING_ERROR:
            case errors_1.ErrorDetails.BUFFER_FULL_ERROR:
            case errors_1.ErrorDetails.LEVEL_SWITCH_ERROR:
            case errors_1.ErrorDetails.BUFFER_STALLED_ERROR:
            case errors_1.ErrorDetails.BUFFER_SEEK_OVER_HOLE:
            case errors_1.ErrorDetails.BUFFER_NUDGE_ON_STALL:
                data.errorAction = {
                    action: 0 /* NetworkErrorAction.DoNothing */,
                    flags: 0 /* ErrorActionFlags.None */,
                };
                return;
        }
        if (data.type === errors_1.ErrorTypes.KEY_SYSTEM_ERROR) {
            this.keySystemError(data);
        }
    };
    ErrorController.prototype.keySystemError = function (data) {
        var levelIndex = this.getVariantLevelIndex(data.frag);
        // Do not retry level. Escalate to fatal if switching levels fails.
        data.levelRetry = false;
        data.errorAction = this.getLevelSwitchAction(data, levelIndex);
    };
    ErrorController.prototype.getPlaylistRetryOrSwitchAction = function (data, levelIndex) {
        var hls = this.hls;
        var retryConfig = (0, error_helper_1.getRetryConfig)(hls.config.playlistLoadPolicy, data);
        var retryCount = this.playlistError++;
        var retry = (0, error_helper_1.shouldRetry)(retryConfig, retryCount, (0, error_helper_1.isTimeoutError)(data), data.response);
        if (retry) {
            return {
                action: 5 /* NetworkErrorAction.RetryRequest */,
                flags: 0 /* ErrorActionFlags.None */,
                retryConfig: retryConfig,
                retryCount: retryCount,
            };
        }
        var errorAction = this.getLevelSwitchAction(data, levelIndex);
        if (retryConfig) {
            errorAction.retryConfig = retryConfig;
            errorAction.retryCount = retryCount;
        }
        return errorAction;
    };
    ErrorController.prototype.getFragRetryOrSwitchAction = function (data) {
        var hls = this.hls;
        // Share fragment error count accross media options (main, audio, subs)
        // This allows for level based rendition switching when media option assets fail
        var variantLevelIndex = this.getVariantLevelIndex(data.frag);
        var level = hls.levels[variantLevelIndex];
        var _a = hls.config, fragLoadPolicy = _a.fragLoadPolicy, keyLoadPolicy = _a.keyLoadPolicy;
        var retryConfig = (0, error_helper_1.getRetryConfig)(data.details.startsWith('key') ? keyLoadPolicy : fragLoadPolicy, data);
        var fragmentErrors = hls.levels.reduce(function (acc, level) { return acc + level.fragmentError; }, 0);
        // Switch levels when out of retried or level index out of bounds
        if (level) {
            if (data.details !== errors_1.ErrorDetails.FRAG_GAP) {
                level.fragmentError++;
            }
            var retry = (0, error_helper_1.shouldRetry)(retryConfig, fragmentErrors, (0, error_helper_1.isTimeoutError)(data), data.response);
            if (retry) {
                return {
                    action: 5 /* NetworkErrorAction.RetryRequest */,
                    flags: 0 /* ErrorActionFlags.None */,
                    retryConfig: retryConfig,
                    retryCount: fragmentErrors,
                };
            }
        }
        // Reach max retry count, or Missing level reference
        // Switch to valid index
        var errorAction = this.getLevelSwitchAction(data, variantLevelIndex);
        // Add retry details to allow skipping of FRAG_PARSING_ERROR
        if (retryConfig) {
            errorAction.retryConfig = retryConfig;
            errorAction.retryCount = fragmentErrors;
        }
        return errorAction;
    };
    ErrorController.prototype.getLevelSwitchAction = function (data, levelIndex) {
        var _a, _b, _c, _d;
        var hls = this.hls;
        if (levelIndex === null || levelIndex === undefined) {
            levelIndex = hls.loadLevel;
        }
        var level = this.hls.levels[levelIndex];
        if (level) {
            var errorDetails = data.details;
            level.loadError++;
            if (errorDetails === errors_1.ErrorDetails.BUFFER_APPEND_ERROR) {
                level.fragmentError++;
            }
            // Search for next level to retry
            var nextLevel = -1;
            var levels = hls.levels, loadLevel = hls.loadLevel, minAutoLevel = hls.minAutoLevel, maxAutoLevel = hls.maxAutoLevel;
            if (!hls.autoLevelEnabled) {
                hls.loadLevel = -1;
            }
            var fragErrorType = (_a = data.frag) === null || _a === void 0 ? void 0 : _a.type;
            // Find alternate audio codec if available on audio codec error
            var isAudioCodecError = (fragErrorType === loader_1.PlaylistLevelType.AUDIO &&
                errorDetails === errors_1.ErrorDetails.FRAG_PARSING_ERROR) ||
                (data.sourceBufferName === 'audio' &&
                    (errorDetails === errors_1.ErrorDetails.BUFFER_ADD_CODEC_ERROR ||
                        errorDetails === errors_1.ErrorDetails.BUFFER_APPEND_ERROR));
            var findAudioCodecAlternate = isAudioCodecError &&
                levels.some(function (_a) {
                    var audioCodec = _a.audioCodec;
                    return level.audioCodec !== audioCodec;
                });
            // Find alternate video codec if available on video codec error
            var isVideoCodecError = data.sourceBufferName === 'video' &&
                (errorDetails === errors_1.ErrorDetails.BUFFER_ADD_CODEC_ERROR ||
                    errorDetails === errors_1.ErrorDetails.BUFFER_APPEND_ERROR);
            var findVideoCodecAlternate = isVideoCodecError &&
                levels.some(function (_a) {
                    var codecSet = _a.codecSet, audioCodec = _a.audioCodec;
                    return level.codecSet !== codecSet && level.audioCodec === audioCodec;
                });
            var _e = (_b = data.context) !== null && _b !== void 0 ? _b : {}, playlistErrorType = _e.type, playlistErrorGroupId = _e.groupId;
            var _loop_1 = function (i) {
                var candidate = (i + loadLevel) % levels.length;
                if (candidate !== loadLevel &&
                    candidate >= minAutoLevel &&
                    candidate <= maxAutoLevel &&
                    levels[candidate].loadError === 0) {
                    var levelCandidate_1 = levels[candidate];
                    // Skip level switch if GAP tag is found in next level at same position
                    if (errorDetails === errors_1.ErrorDetails.FRAG_GAP &&
                        fragErrorType === loader_1.PlaylistLevelType.MAIN &&
                        data.frag) {
                        var levelDetails = levels[candidate].details;
                        if (levelDetails) {
                            var fragCandidate = (0, fragment_finders_1.findFragmentByPTS)(data.frag, levelDetails.fragments, data.frag.start);
                            if (fragCandidate === null || fragCandidate === void 0 ? void 0 : fragCandidate.gap) {
                                return "continue";
                            }
                        }
                    }
                    else if ((playlistErrorType === loader_1.PlaylistContextType.AUDIO_TRACK &&
                        levelCandidate_1.hasAudioGroup(playlistErrorGroupId)) ||
                        (playlistErrorType === loader_1.PlaylistContextType.SUBTITLE_TRACK &&
                            levelCandidate_1.hasSubtitleGroup(playlistErrorGroupId))) {
                        return "continue";
                    }
                    else if ((fragErrorType === loader_1.PlaylistLevelType.AUDIO &&
                        ((_c = level.audioGroups) === null || _c === void 0 ? void 0 : _c.some(function (groupId) {
                            return levelCandidate_1.hasAudioGroup(groupId);
                        }))) ||
                        (fragErrorType === loader_1.PlaylistLevelType.SUBTITLE &&
                            ((_d = level.subtitleGroups) === null || _d === void 0 ? void 0 : _d.some(function (groupId) {
                                return levelCandidate_1.hasSubtitleGroup(groupId);
                            }))) ||
                        (findAudioCodecAlternate &&
                            level.audioCodec === levelCandidate_1.audioCodec) ||
                        (!findAudioCodecAlternate &&
                            level.audioCodec !== levelCandidate_1.audioCodec) ||
                        (findVideoCodecAlternate &&
                            level.codecSet === levelCandidate_1.codecSet)) {
                        return "continue";
                    }
                    nextLevel = candidate;
                    return "break";
                }
            };
            for (var i = levels.length; i--;) {
                var state_1 = _loop_1(i);
                if (state_1 === "break")
                    break;
            }
            if (nextLevel > -1 && hls.loadLevel !== nextLevel) {
                data.levelRetry = true;
                this.playlistError = 0;
                return {
                    action: 2 /* NetworkErrorAction.SendAlternateToPenaltyBox */,
                    flags: 0 /* ErrorActionFlags.None */,
                    nextAutoLevel: nextLevel,
                };
            }
        }
        // No levels to switch / Manual level selection / Level not found
        // Resolve with Pathway switch, Redundant fail-over, or stay on lowest Level
        return {
            action: 2 /* NetworkErrorAction.SendAlternateToPenaltyBox */,
            flags: 1 /* ErrorActionFlags.MoveAllAlternatesMatchingHost */,
        };
    };
    ErrorController.prototype.onErrorOut = function (event, data) {
        var _a;
        switch ((_a = data.errorAction) === null || _a === void 0 ? void 0 : _a.action) {
            case 0 /* NetworkErrorAction.DoNothing */:
                break;
            case 2 /* NetworkErrorAction.SendAlternateToPenaltyBox */:
                this.sendAlternateToPenaltyBox(data);
                if (!data.errorAction.resolved &&
                    data.details !== errors_1.ErrorDetails.FRAG_GAP) {
                    data.fatal = true;
                }
                else if (/MediaSource readyState: ended/.test(data.error.message)) {
                    this.warn("MediaSource ended after \"".concat(data.sourceBufferName, "\" sourceBuffer append error. Attempting to recover from media error."));
                    this.hls.recoverMediaError();
                }
                break;
            case 5 /* NetworkErrorAction.RetryRequest */:
                // handled by stream and playlist/level controllers
                break;
        }
        if (data.fatal) {
            this.hls.stopLoad();
            return;
        }
    };
    ErrorController.prototype.sendAlternateToPenaltyBox = function (data) {
        var hls = this.hls;
        var errorAction = data.errorAction;
        if (!errorAction) {
            return;
        }
        var flags = errorAction.flags, hdcpLevel = errorAction.hdcpLevel, nextAutoLevel = errorAction.nextAutoLevel;
        switch (flags) {
            case 0 /* ErrorActionFlags.None */:
                this.switchLevel(data, nextAutoLevel);
                break;
            case 2 /* ErrorActionFlags.MoveAllAlternatesMatchingHDCP */:
                if (hdcpLevel) {
                    hls.maxHdcpLevel = level_1.HdcpLevels[level_1.HdcpLevels.indexOf(hdcpLevel) - 1];
                    errorAction.resolved = true;
                }
                this.warn("Restricting playback to HDCP-LEVEL of \"".concat(hls.maxHdcpLevel, "\" or lower"));
                break;
        }
        // If not resolved by previous actions try to switch to next level
        if (!errorAction.resolved) {
            this.switchLevel(data, nextAutoLevel);
        }
    };
    ErrorController.prototype.switchLevel = function (data, levelIndex) {
        if (levelIndex !== undefined && data.errorAction) {
            this.warn("switching to level ".concat(levelIndex, " after ").concat(data.details));
            this.hls.nextAutoLevel = levelIndex;
            data.errorAction.resolved = true;
            // Stream controller is responsible for this but won't switch on false start
            this.hls.nextLoadLevel = this.hls.nextAutoLevel;
        }
    };
    return ErrorController;
}());
exports.default = ErrorController;
