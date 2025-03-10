"use strict";
/**
 * PlaylistLoader - delegate for media manifest/playlist loading tasks. Takes care of parsing media to internal data-models.
 *
 * Once loaded, dispatches events with parsed data-models of manifest/levels/audio/subtitle tracks.
 *
 * Uses loader(s) set in config to do actual internal loading of resource tasks.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("../events");
var errors_1 = require("../errors");
var logger_1 = require("../utils/logger");
var m3u8_parser_1 = require("./m3u8-parser");
var loader_1 = require("../types/loader");
var attr_list_1 = require("../utils/attr-list");
function mapContextToLevelType(context) {
    var type = context.type;
    switch (type) {
        case loader_1.PlaylistContextType.AUDIO_TRACK:
            return loader_1.PlaylistLevelType.AUDIO;
        case loader_1.PlaylistContextType.SUBTITLE_TRACK:
            return loader_1.PlaylistLevelType.SUBTITLE;
        default:
            return loader_1.PlaylistLevelType.MAIN;
    }
}
function getResponseUrl(response, context) {
    var url = response.url;
    // responseURL not supported on some browsers (it is used to detect URL redirection)
    // data-uri mode also not supported (but no need to detect redirection)
    if (url === undefined || url.indexOf('data:') === 0) {
        // fallback to initial URL
        url = context.url;
    }
    return url;
}
var PlaylistLoader = /** @class */ (function () {
    function PlaylistLoader(hls) {
        this.loaders = Object.create(null);
        this.variableList = null;
        this.hls = hls;
        this.registerListeners();
    }
    PlaylistLoader.prototype.startLoad = function (startPosition) { };
    PlaylistLoader.prototype.stopLoad = function () {
        this.destroyInternalLoaders();
    };
    PlaylistLoader.prototype.registerListeners = function () {
        var hls = this.hls;
        hls.on(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.on(events_1.Events.LEVEL_LOADING, this.onLevelLoading, this);
        hls.on(events_1.Events.AUDIO_TRACK_LOADING, this.onAudioTrackLoading, this);
        hls.on(events_1.Events.SUBTITLE_TRACK_LOADING, this.onSubtitleTrackLoading, this);
    };
    PlaylistLoader.prototype.unregisterListeners = function () {
        var hls = this.hls;
        hls.off(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.off(events_1.Events.LEVEL_LOADING, this.onLevelLoading, this);
        hls.off(events_1.Events.AUDIO_TRACK_LOADING, this.onAudioTrackLoading, this);
        hls.off(events_1.Events.SUBTITLE_TRACK_LOADING, this.onSubtitleTrackLoading, this);
    };
    /**
     * Returns defaults or configured loader-type overloads (pLoader and loader config params)
     */
    PlaylistLoader.prototype.createInternalLoader = function (context) {
        var config = this.hls.config;
        var PLoader = config.pLoader;
        var Loader = config.loader;
        var InternalLoader = PLoader || Loader;
        var loader = new InternalLoader(config);
        this.loaders[context.type] = loader;
        return loader;
    };
    PlaylistLoader.prototype.getInternalLoader = function (context) {
        return this.loaders[context.type];
    };
    PlaylistLoader.prototype.resetInternalLoader = function (contextType) {
        if (this.loaders[contextType]) {
            delete this.loaders[contextType];
        }
    };
    /**
     * Call `destroy` on all internal loader instances mapped (one per context type)
     */
    PlaylistLoader.prototype.destroyInternalLoaders = function () {
        for (var contextType in this.loaders) {
            var loader = this.loaders[contextType];
            if (loader) {
                loader.destroy();
            }
            this.resetInternalLoader(contextType);
        }
    };
    PlaylistLoader.prototype.destroy = function () {
        this.variableList = null;
        this.unregisterListeners();
        this.destroyInternalLoaders();
    };
    PlaylistLoader.prototype.onManifestLoading = function (event, data) {
        var url = data.url;
        this.variableList = null;
        this.load({
            id: null,
            level: 0,
            responseType: 'text',
            type: loader_1.PlaylistContextType.MANIFEST,
            url: url,
            deliveryDirectives: null,
        });
    };
    PlaylistLoader.prototype.onLevelLoading = function (event, data) {
        var id = data.id, level = data.level, pathwayId = data.pathwayId, url = data.url, deliveryDirectives = data.deliveryDirectives;
        this.load({
            id: id,
            level: level,
            pathwayId: pathwayId,
            responseType: 'text',
            type: loader_1.PlaylistContextType.LEVEL,
            url: url,
            deliveryDirectives: deliveryDirectives,
        });
    };
    PlaylistLoader.prototype.onAudioTrackLoading = function (event, data) {
        var id = data.id, groupId = data.groupId, url = data.url, deliveryDirectives = data.deliveryDirectives;
        this.load({
            id: id,
            groupId: groupId,
            level: null,
            responseType: 'text',
            type: loader_1.PlaylistContextType.AUDIO_TRACK,
            url: url,
            deliveryDirectives: deliveryDirectives,
        });
    };
    PlaylistLoader.prototype.onSubtitleTrackLoading = function (event, data) {
        var id = data.id, groupId = data.groupId, url = data.url, deliveryDirectives = data.deliveryDirectives;
        this.load({
            id: id,
            groupId: groupId,
            level: null,
            responseType: 'text',
            type: loader_1.PlaylistContextType.SUBTITLE_TRACK,
            url: url,
            deliveryDirectives: deliveryDirectives,
        });
    };
    PlaylistLoader.prototype.load = function (context) {
        var _this = this;
        var _a;
        var config = this.hls.config;
        // logger.debug(`[playlist-loader]: Loading playlist of type ${context.type}, level: ${context.level}, id: ${context.id}`);
        // Check if a loader for this context already exists
        var loader = this.getInternalLoader(context);
        if (loader) {
            var loaderContext = loader.context;
            if (loaderContext &&
                loaderContext.url === context.url &&
                loaderContext.level === context.level) {
                // same URL can't overlap
                logger_1.logger.trace('[playlist-loader]: playlist request ongoing');
                return;
            }
            logger_1.logger.log("[playlist-loader]: aborting previous loader for type: ".concat(context.type));
            loader.abort();
        }
        // apply different configs for retries depending on
        // context (manifest, level, audio/subs playlist)
        var loadPolicy;
        if (context.type === loader_1.PlaylistContextType.MANIFEST) {
            loadPolicy = config.manifestLoadPolicy.default;
        }
        else {
            loadPolicy = Object.assign({}, config.playlistLoadPolicy.default, {
                timeoutRetry: null,
                errorRetry: null,
            });
        }
        loader = this.createInternalLoader(context);
        // Override level/track timeout for LL-HLS requests
        // (the default of 10000ms is counter productive to blocking playlist reload requests)
        if (Number.isFinite((_a = context.deliveryDirectives) === null || _a === void 0 ? void 0 : _a.part)) {
            var levelDetails = void 0;
            if (context.type === loader_1.PlaylistContextType.LEVEL &&
                context.level !== null) {
                levelDetails = this.hls.levels[context.level].details;
            }
            else if (context.type === loader_1.PlaylistContextType.AUDIO_TRACK &&
                context.id !== null) {
                levelDetails = this.hls.audioTracks[context.id].details;
            }
            else if (context.type === loader_1.PlaylistContextType.SUBTITLE_TRACK &&
                context.id !== null) {
                levelDetails = this.hls.subtitleTracks[context.id].details;
            }
            if (levelDetails) {
                var partTarget = levelDetails.partTarget;
                var targetDuration = levelDetails.targetduration;
                if (partTarget && targetDuration) {
                    var maxLowLatencyPlaylistRefresh = Math.max(partTarget * 3, targetDuration * 0.8) * 1000;
                    loadPolicy = Object.assign({}, loadPolicy, {
                        maxTimeToFirstByteMs: Math.min(maxLowLatencyPlaylistRefresh, loadPolicy.maxTimeToFirstByteMs),
                        maxLoadTimeMs: Math.min(maxLowLatencyPlaylistRefresh, loadPolicy.maxTimeToFirstByteMs),
                    });
                }
            }
        }
        var legacyRetryCompatibility = loadPolicy.errorRetry || loadPolicy.timeoutRetry || {};
        var loaderConfig = {
            loadPolicy: loadPolicy,
            timeout: loadPolicy.maxLoadTimeMs,
            maxRetry: legacyRetryCompatibility.maxNumRetry || 0,
            retryDelay: legacyRetryCompatibility.retryDelayMs || 0,
            maxRetryDelay: legacyRetryCompatibility.maxRetryDelayMs || 0,
        };
        var loaderCallbacks = {
            onSuccess: function (response, stats, context, networkDetails) {
                var loader = _this.getInternalLoader(context);
                _this.resetInternalLoader(context.type);
                var string = response.data;
                // Validate if it is an M3U8 at all
                if (string.indexOf('#EXTM3U') !== 0) {
                    _this.handleManifestParsingError(response, context, new Error('no EXTM3U delimiter'), networkDetails || null, stats);
                    return;
                }
                stats.parsing.start = performance.now();
                if (m3u8_parser_1.default.isMediaPlaylist(string)) {
                    _this.handleTrackOrLevelPlaylist(response, stats, context, networkDetails || null, loader);
                }
                else {
                    _this.handleMasterPlaylist(response, stats, context, networkDetails);
                }
            },
            onError: function (response, context, networkDetails, stats) {
                _this.handleNetworkError(context, networkDetails, false, response, stats);
            },
            onTimeout: function (stats, context, networkDetails) {
                _this.handleNetworkError(context, networkDetails, true, undefined, stats);
            },
        };
        // logger.debug(`[playlist-loader]: Calling internal loader delegate for URL: ${context.url}`);
        loader.load(context, loaderConfig, loaderCallbacks);
    };
    PlaylistLoader.prototype.handleMasterPlaylist = function (response, stats, context, networkDetails) {
        var hls = this.hls;
        var string = response.data;
        var url = getResponseUrl(response, context);
        var parsedResult = m3u8_parser_1.default.parseMasterPlaylist(string, url);
        if (parsedResult.playlistParsingError) {
            this.handleManifestParsingError(response, context, parsedResult.playlistParsingError, networkDetails, stats);
            return;
        }
        var contentSteering = parsedResult.contentSteering, levels = parsedResult.levels, sessionData = parsedResult.sessionData, sessionKeys = parsedResult.sessionKeys, startTimeOffset = parsedResult.startTimeOffset, variableList = parsedResult.variableList;
        this.variableList = variableList;
        var _a = m3u8_parser_1.default.parseMasterPlaylistMedia(string, url, parsedResult), _b = _a.AUDIO, audioTracks = _b === void 0 ? [] : _b, subtitles = _a.SUBTITLES, captions = _a["CLOSED-CAPTIONS"];
        if (audioTracks.length) {
            // check if we have found an audio track embedded in main playlist (audio track without URI attribute)
            var embeddedAudioFound = audioTracks.some(function (audioTrack) { return !audioTrack.url; });
            // if no embedded audio track defined, but audio codec signaled in quality level,
            // we need to signal this main audio track this could happen with playlists with
            // alt audio rendition in which quality levels (main)
            // contains both audio+video. but with mixed audio track not signaled
            if (!embeddedAudioFound &&
                levels[0].audioCodec &&
                !levels[0].attrs.AUDIO) {
                logger_1.logger.log('[playlist-loader]: audio codec signaled in quality level, but no embedded audio track signaled, create one');
                audioTracks.unshift({
                    type: 'main',
                    name: 'main',
                    groupId: 'main',
                    default: false,
                    autoselect: false,
                    forced: false,
                    id: -1,
                    attrs: new attr_list_1.AttrList({}),
                    bitrate: 0,
                    url: '',
                });
            }
        }
        hls.trigger(events_1.Events.MANIFEST_LOADED, {
            levels: levels,
            audioTracks: audioTracks,
            subtitles: subtitles,
            captions: captions,
            contentSteering: contentSteering,
            url: url,
            stats: stats,
            networkDetails: networkDetails,
            sessionData: sessionData,
            sessionKeys: sessionKeys,
            startTimeOffset: startTimeOffset,
            variableList: variableList,
        });
    };
    PlaylistLoader.prototype.handleTrackOrLevelPlaylist = function (response, stats, context, networkDetails, loader) {
        var hls = this.hls;
        var id = context.id, level = context.level, type = context.type;
        var url = getResponseUrl(response, context);
        var levelUrlId = 0;
        var levelId = Number.isFinite(level)
            ? level
            : Number.isFinite(id)
                ? id
                : 0;
        var levelType = mapContextToLevelType(context);
        var levelDetails = m3u8_parser_1.default.parseLevelPlaylist(response.data, url, levelId, levelType, levelUrlId, this.variableList);
        // We have done our first request (Manifest-type) and receive
        // not a master playlist but a chunk-list (track/level)
        // We fire the manifest-loaded event anyway with the parsed level-details
        // by creating a single-level structure for it.
        if (type === loader_1.PlaylistContextType.MANIFEST) {
            var singleLevel = {
                attrs: new attr_list_1.AttrList({}),
                bitrate: 0,
                details: levelDetails,
                name: '',
                url: url,
            };
            hls.trigger(events_1.Events.MANIFEST_LOADED, {
                levels: [singleLevel],
                audioTracks: [],
                url: url,
                stats: stats,
                networkDetails: networkDetails,
                sessionData: null,
                sessionKeys: null,
                contentSteering: null,
                startTimeOffset: null,
                variableList: null,
            });
        }
        // save parsing time
        stats.parsing.end = performance.now();
        // extend the context with the new levelDetails property
        context.levelDetails = levelDetails;
        this.handlePlaylistLoaded(levelDetails, response, stats, context, networkDetails, loader);
    };
    PlaylistLoader.prototype.handleManifestParsingError = function (response, context, error, networkDetails, stats) {
        this.hls.trigger(events_1.Events.ERROR, {
            type: errors_1.ErrorTypes.NETWORK_ERROR,
            details: errors_1.ErrorDetails.MANIFEST_PARSING_ERROR,
            fatal: context.type === loader_1.PlaylistContextType.MANIFEST,
            url: response.url,
            err: error,
            error: error,
            reason: error.message,
            response: response,
            context: context,
            networkDetails: networkDetails,
            stats: stats,
        });
    };
    PlaylistLoader.prototype.handleNetworkError = function (context, networkDetails, timeout, response, stats) {
        if (timeout === void 0) { timeout = false; }
        var message = "A network ".concat(timeout
            ? 'timeout'
            : 'error' + (response ? ' (status ' + response.code + ')' : ''), " occurred while loading ").concat(context.type);
        if (context.type === loader_1.PlaylistContextType.LEVEL) {
            message += ": ".concat(context.level, " id: ").concat(context.id);
        }
        else if (context.type === loader_1.PlaylistContextType.AUDIO_TRACK ||
            context.type === loader_1.PlaylistContextType.SUBTITLE_TRACK) {
            message += " id: ".concat(context.id, " group-id: \"").concat(context.groupId, "\"");
        }
        var error = new Error(message);
        logger_1.logger.warn("[playlist-loader]: ".concat(message));
        var details = errors_1.ErrorDetails.UNKNOWN;
        var fatal = false;
        var loader = this.getInternalLoader(context);
        switch (context.type) {
            case loader_1.PlaylistContextType.MANIFEST:
                details = timeout
                    ? errors_1.ErrorDetails.MANIFEST_LOAD_TIMEOUT
                    : errors_1.ErrorDetails.MANIFEST_LOAD_ERROR;
                fatal = true;
                break;
            case loader_1.PlaylistContextType.LEVEL:
                details = timeout
                    ? errors_1.ErrorDetails.LEVEL_LOAD_TIMEOUT
                    : errors_1.ErrorDetails.LEVEL_LOAD_ERROR;
                fatal = false;
                break;
            case loader_1.PlaylistContextType.AUDIO_TRACK:
                details = timeout
                    ? errors_1.ErrorDetails.AUDIO_TRACK_LOAD_TIMEOUT
                    : errors_1.ErrorDetails.AUDIO_TRACK_LOAD_ERROR;
                fatal = false;
                break;
            case loader_1.PlaylistContextType.SUBTITLE_TRACK:
                details = timeout
                    ? errors_1.ErrorDetails.SUBTITLE_TRACK_LOAD_TIMEOUT
                    : errors_1.ErrorDetails.SUBTITLE_LOAD_ERROR;
                fatal = false;
                break;
        }
        if (loader) {
            this.resetInternalLoader(context.type);
        }
        var errorData = {
            type: errors_1.ErrorTypes.NETWORK_ERROR,
            details: details,
            fatal: fatal,
            url: context.url,
            loader: loader,
            context: context,
            error: error,
            networkDetails: networkDetails,
            stats: stats,
        };
        if (response) {
            var url = (networkDetails === null || networkDetails === void 0 ? void 0 : networkDetails.url) || context.url;
            errorData.response = __assign({ url: url, data: undefined }, response);
        }
        this.hls.trigger(events_1.Events.ERROR, errorData);
    };
    PlaylistLoader.prototype.handlePlaylistLoaded = function (levelDetails, response, stats, context, networkDetails, loader) {
        var hls = this.hls;
        var type = context.type, level = context.level, id = context.id, groupId = context.groupId, deliveryDirectives = context.deliveryDirectives;
        var url = getResponseUrl(response, context);
        var parent = mapContextToLevelType(context);
        var levelIndex = typeof context.level === 'number' && parent === loader_1.PlaylistLevelType.MAIN
            ? level
            : undefined;
        if (!levelDetails.fragments.length) {
            var error_1 = new Error('No Segments found in Playlist');
            hls.trigger(events_1.Events.ERROR, {
                type: errors_1.ErrorTypes.NETWORK_ERROR,
                details: errors_1.ErrorDetails.LEVEL_EMPTY_ERROR,
                fatal: false,
                url: url,
                error: error_1,
                reason: error_1.message,
                response: response,
                context: context,
                level: levelIndex,
                parent: parent,
                networkDetails: networkDetails,
                stats: stats,
            });
            return;
        }
        if (!levelDetails.targetduration) {
            levelDetails.playlistParsingError = new Error('Missing Target Duration');
        }
        var error = levelDetails.playlistParsingError;
        if (error) {
            hls.trigger(events_1.Events.ERROR, {
                type: errors_1.ErrorTypes.NETWORK_ERROR,
                details: errors_1.ErrorDetails.LEVEL_PARSING_ERROR,
                fatal: false,
                url: url,
                error: error,
                reason: error.message,
                response: response,
                context: context,
                level: levelIndex,
                parent: parent,
                networkDetails: networkDetails,
                stats: stats,
            });
            return;
        }
        if (levelDetails.live && loader) {
            if (loader.getCacheAge) {
                levelDetails.ageHeader = loader.getCacheAge() || 0;
            }
            if (!loader.getCacheAge || isNaN(levelDetails.ageHeader)) {
                levelDetails.ageHeader = 0;
            }
        }
        switch (type) {
            case loader_1.PlaylistContextType.MANIFEST:
            case loader_1.PlaylistContextType.LEVEL:
                hls.trigger(events_1.Events.LEVEL_LOADED, {
                    details: levelDetails,
                    level: levelIndex || 0,
                    id: id || 0,
                    stats: stats,
                    networkDetails: networkDetails,
                    deliveryDirectives: deliveryDirectives,
                });
                break;
            case loader_1.PlaylistContextType.AUDIO_TRACK:
                hls.trigger(events_1.Events.AUDIO_TRACK_LOADED, {
                    details: levelDetails,
                    id: id || 0,
                    groupId: groupId || '',
                    stats: stats,
                    networkDetails: networkDetails,
                    deliveryDirectives: deliveryDirectives,
                });
                break;
            case loader_1.PlaylistContextType.SUBTITLE_TRACK:
                hls.trigger(events_1.Events.SUBTITLE_TRACK_LOADED, {
                    details: levelDetails,
                    id: id || 0,
                    groupId: groupId || '',
                    stats: stats,
                    networkDetails: networkDetails,
                    deliveryDirectives: deliveryDirectives,
                });
                break;
        }
    };
    return PlaylistLoader;
}());
exports.default = PlaylistLoader;
