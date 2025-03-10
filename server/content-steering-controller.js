"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("../events");
var level_1 = require("../types/level");
var level_helper_1 = require("../utils/level-helper");
var attr_list_1 = require("../utils/attr-list");
var logger_1 = require("../utils/logger");
var loader_1 = require("../types/loader");
var PATHWAY_PENALTY_DURATION_MS = 300000;
var ContentSteeringController = /** @class */ (function () {
    function ContentSteeringController(hls) {
        this.loader = null;
        this.uri = null;
        this.pathwayId = '.';
        this.pathwayPriority = null;
        this.timeToLoad = 300;
        this.reloadTimer = -1;
        this.updated = 0;
        this.started = false;
        this.enabled = true;
        this.levels = null;
        this.audioTracks = null;
        this.subtitleTracks = null;
        this.penalizedPathways = {};
        this.hls = hls;
        this.log = logger_1.logger.log.bind(logger_1.logger, "[content-steering]:");
        this.registerListeners();
    }
    ContentSteeringController.prototype.registerListeners = function () {
        var hls = this.hls;
        hls.on(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.on(events_1.Events.MANIFEST_LOADED, this.onManifestLoaded, this);
        hls.on(events_1.Events.MANIFEST_PARSED, this.onManifestParsed, this);
        hls.on(events_1.Events.ERROR, this.onError, this);
    };
    ContentSteeringController.prototype.unregisterListeners = function () {
        var hls = this.hls;
        if (!hls) {
            return;
        }
        hls.off(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.off(events_1.Events.MANIFEST_LOADED, this.onManifestLoaded, this);
        hls.off(events_1.Events.MANIFEST_PARSED, this.onManifestParsed, this);
        hls.off(events_1.Events.ERROR, this.onError, this);
    };
    ContentSteeringController.prototype.startLoad = function () {
        this.started = true;
        this.clearTimeout();
        if (this.enabled && this.uri) {
            if (this.updated) {
                var ttl = this.timeToLoad * 1000 - (performance.now() - this.updated);
                if (ttl > 0) {
                    this.scheduleRefresh(this.uri, ttl);
                    return;
                }
            }
            this.loadSteeringManifest(this.uri);
        }
    };
    ContentSteeringController.prototype.stopLoad = function () {
        this.started = false;
        if (this.loader) {
            this.loader.destroy();
            this.loader = null;
        }
        this.clearTimeout();
    };
    ContentSteeringController.prototype.clearTimeout = function () {
        if (this.reloadTimer !== -1) {
            self.clearTimeout(this.reloadTimer);
            this.reloadTimer = -1;
        }
    };
    ContentSteeringController.prototype.destroy = function () {
        this.unregisterListeners();
        this.stopLoad();
        // @ts-ignore
        this.hls = null;
        this.levels = this.audioTracks = this.subtitleTracks = null;
    };
    ContentSteeringController.prototype.removeLevel = function (levelToRemove) {
        var levels = this.levels;
        if (levels) {
            this.levels = levels.filter(function (level) { return level !== levelToRemove; });
        }
    };
    ContentSteeringController.prototype.onManifestLoading = function () {
        this.stopLoad();
        this.enabled = true;
        this.timeToLoad = 300;
        this.updated = 0;
        this.uri = null;
        this.pathwayId = '.';
        this.levels = this.audioTracks = this.subtitleTracks = null;
    };
    ContentSteeringController.prototype.onManifestLoaded = function (event, data) {
        var contentSteering = data.contentSteering;
        if (contentSteering === null) {
            return;
        }
        this.pathwayId = contentSteering.pathwayId;
        this.uri = contentSteering.uri;
        if (this.started) {
            this.startLoad();
        }
    };
    ContentSteeringController.prototype.onManifestParsed = function (event, data) {
        this.audioTracks = data.audioTracks;
        this.subtitleTracks = data.subtitleTracks;
    };
    ContentSteeringController.prototype.onError = function (event, data) {
        var errorAction = data.errorAction;
        if ((errorAction === null || errorAction === void 0 ? void 0 : errorAction.action) === 2 /* NetworkErrorAction.SendAlternateToPenaltyBox */ &&
            errorAction.flags === 1 /* ErrorActionFlags.MoveAllAlternatesMatchingHost */) {
            var levels = this.levels;
            var pathwayPriority = this.pathwayPriority;
            var errorPathway = this.pathwayId;
            if (data.context) {
                var _a = data.context, groupId = _a.groupId, pathwayId = _a.pathwayId, type = _a.type;
                if (groupId && levels) {
                    errorPathway = this.getPathwayForGroupId(groupId, type, errorPathway);
                }
                else if (pathwayId) {
                    errorPathway = pathwayId;
                }
            }
            if (!(errorPathway in this.penalizedPathways)) {
                this.penalizedPathways[errorPathway] = performance.now();
            }
            if (!pathwayPriority && levels) {
                // If PATHWAY-PRIORITY was not provided, list pathways for error handling
                pathwayPriority = levels.reduce(function (pathways, level) {
                    if (pathways.indexOf(level.pathwayId) === -1) {
                        pathways.push(level.pathwayId);
                    }
                    return pathways;
                }, []);
            }
            if (pathwayPriority && pathwayPriority.length > 1) {
                this.updatePathwayPriority(pathwayPriority);
                errorAction.resolved = this.pathwayId !== errorPathway;
            }
            if (!errorAction.resolved) {
                logger_1.logger.warn("Could not resolve ".concat(data.details, " (\"").concat(data.error.message, "\") with content-steering for Pathway: ").concat(errorPathway, " levels: ").concat(levels ? levels.length : levels, " priorities: ").concat(JSON.stringify(pathwayPriority), " penalized: ").concat(JSON.stringify(this.penalizedPathways)));
            }
        }
    };
    ContentSteeringController.prototype.filterParsedLevels = function (levels) {
        // Filter levels to only include those that are in the initial pathway
        this.levels = levels;
        var pathwayLevels = this.getLevelsForPathway(this.pathwayId);
        if (pathwayLevels.length === 0) {
            var pathwayId = levels[0].pathwayId;
            this.log("No levels found in Pathway ".concat(this.pathwayId, ". Setting initial Pathway to \"").concat(pathwayId, "\""));
            pathwayLevels = this.getLevelsForPathway(pathwayId);
            this.pathwayId = pathwayId;
        }
        if (pathwayLevels.length !== levels.length) {
            this.log("Found ".concat(pathwayLevels.length, "/").concat(levels.length, " levels in Pathway \"").concat(this.pathwayId, "\""));
        }
        return pathwayLevels;
    };
    ContentSteeringController.prototype.getLevelsForPathway = function (pathwayId) {
        if (this.levels === null) {
            return [];
        }
        return this.levels.filter(function (level) { return pathwayId === level.pathwayId; });
    };
    ContentSteeringController.prototype.updatePathwayPriority = function (pathwayPriority) {
        this.pathwayPriority = pathwayPriority;
        var levels;
        // Evaluate if we should remove the pathway from the penalized list
        var penalizedPathways = this.penalizedPathways;
        var now = performance.now();
        Object.keys(penalizedPathways).forEach(function (pathwayId) {
            if (now - penalizedPathways[pathwayId] > PATHWAY_PENALTY_DURATION_MS) {
                delete penalizedPathways[pathwayId];
            }
        });
        for (var i = 0; i < pathwayPriority.length; i++) {
            var pathwayId = pathwayPriority[i];
            if (pathwayId in penalizedPathways) {
                continue;
            }
            if (pathwayId === this.pathwayId) {
                return;
            }
            var selectedIndex = this.hls.nextLoadLevel;
            var selectedLevel = this.hls.levels[selectedIndex];
            levels = this.getLevelsForPathway(pathwayId);
            if (levels.length > 0) {
                this.log("Setting Pathway to \"".concat(pathwayId, "\""));
                this.pathwayId = pathwayId;
                (0, level_helper_1.reassignFragmentLevelIndexes)(levels);
                this.hls.trigger(events_1.Events.LEVELS_UPDATED, { levels: levels });
                // Set LevelController's level to trigger LEVEL_SWITCHING which loads playlist if needed
                var levelAfterChange = this.hls.levels[selectedIndex];
                if (selectedLevel && levelAfterChange && this.levels) {
                    if (levelAfterChange.attrs['STABLE-VARIANT-ID'] !==
                        selectedLevel.attrs['STABLE-VARIANT-ID'] &&
                        levelAfterChange.bitrate !== selectedLevel.bitrate) {
                        this.log("Unstable Pathways change from bitrate ".concat(selectedLevel.bitrate, " to ").concat(levelAfterChange.bitrate));
                    }
                    this.hls.nextLoadLevel = selectedIndex;
                }
                break;
            }
        }
    };
    ContentSteeringController.prototype.getPathwayForGroupId = function (groupId, type, defaultPathway) {
        var levels = this.getLevelsForPathway(defaultPathway).concat(this.levels || []);
        for (var i = 0; i < levels.length; i++) {
            if ((type === loader_1.PlaylistContextType.AUDIO_TRACK &&
                levels[i].hasAudioGroup(groupId)) ||
                (type === loader_1.PlaylistContextType.SUBTITLE_TRACK &&
                    levels[i].hasSubtitleGroup(groupId))) {
                return levels[i].pathwayId;
            }
        }
        return defaultPathway;
    };
    ContentSteeringController.prototype.clonePathways = function (pathwayClones) {
        var _this = this;
        var levels = this.levels;
        if (!levels) {
            return;
        }
        var audioGroupCloneMap = {};
        var subtitleGroupCloneMap = {};
        pathwayClones.forEach(function (pathwayClone) {
            var cloneId = pathwayClone.ID, baseId = pathwayClone["BASE-ID"], uriReplacement = pathwayClone["URI-REPLACEMENT"];
            if (levels.some(function (level) { return level.pathwayId === cloneId; })) {
                return;
            }
            var clonedVariants = _this.getLevelsForPathway(baseId).map(function (baseLevel) {
                var attributes = new attr_list_1.AttrList(baseLevel.attrs);
                attributes['PATHWAY-ID'] = cloneId;
                var clonedAudioGroupId = attributes.AUDIO && "".concat(attributes.AUDIO, "_clone_").concat(cloneId);
                var clonedSubtitleGroupId = attributes.SUBTITLES && "".concat(attributes.SUBTITLES, "_clone_").concat(cloneId);
                if (clonedAudioGroupId) {
                    audioGroupCloneMap[attributes.AUDIO] = clonedAudioGroupId;
                    attributes.AUDIO = clonedAudioGroupId;
                }
                if (clonedSubtitleGroupId) {
                    subtitleGroupCloneMap[attributes.SUBTITLES] = clonedSubtitleGroupId;
                    attributes.SUBTITLES = clonedSubtitleGroupId;
                }
                var url = performUriReplacement(baseLevel.uri, attributes['STABLE-VARIANT-ID'], 'PER-VARIANT-URIS', uriReplacement);
                var clonedLevel = new level_1.Level({
                    attrs: attributes,
                    audioCodec: baseLevel.audioCodec,
                    bitrate: baseLevel.bitrate,
                    height: baseLevel.height,
                    name: baseLevel.name,
                    url: url,
                    videoCodec: baseLevel.videoCodec,
                    width: baseLevel.width,
                });
                if (baseLevel.audioGroups) {
                    for (var i = 1; i < baseLevel.audioGroups.length; i++) {
                        clonedLevel.addGroupId('audio', "".concat(baseLevel.audioGroups[i], "_clone_").concat(cloneId));
                    }
                }
                if (baseLevel.subtitleGroups) {
                    for (var i = 1; i < baseLevel.subtitleGroups.length; i++) {
                        clonedLevel.addGroupId('text', "".concat(baseLevel.subtitleGroups[i], "_clone_").concat(cloneId));
                    }
                }
                return clonedLevel;
            });
            levels.push.apply(levels, clonedVariants);
            cloneRenditionGroups(_this.audioTracks, audioGroupCloneMap, uriReplacement, cloneId);
            cloneRenditionGroups(_this.subtitleTracks, subtitleGroupCloneMap, uriReplacement, cloneId);
        });
    };
    ContentSteeringController.prototype.loadSteeringManifest = function (uri) {
        var _this = this;
        var config = this.hls.config;
        var Loader = config.loader;
        if (this.loader) {
            this.loader.destroy();
        }
        this.loader = new Loader(config);
        var url;
        try {
            url = new self.URL(uri);
        }
        catch (error) {
            this.enabled = false;
            this.log("Failed to parse Steering Manifest URI: ".concat(uri));
            return;
        }
        if (url.protocol !== 'data:') {
            var throughput = (this.hls.bandwidthEstimate || config.abrEwmaDefaultEstimate) | 0;
            url.searchParams.set('_HLS_pathway', this.pathwayId);
            url.searchParams.set('_HLS_throughput', '' + throughput);
        }
        var context = {
            responseType: 'json',
            url: url.href,
        };
        var loadPolicy = config.steeringManifestLoadPolicy.default;
        var legacyRetryCompatibility = loadPolicy.errorRetry || loadPolicy.timeoutRetry || {};
        var loaderConfig = {
            loadPolicy: loadPolicy,
            timeout: loadPolicy.maxLoadTimeMs,
            maxRetry: legacyRetryCompatibility.maxNumRetry || 0,
            retryDelay: legacyRetryCompatibility.retryDelayMs || 0,
            maxRetryDelay: legacyRetryCompatibility.maxRetryDelayMs || 0,
        };
        var callbacks = {
            onSuccess: function (response, stats, context, networkDetails) {
                _this.log("Loaded steering manifest: \"".concat(url, "\""));
                var steeringData = response.data;
                if (steeringData.VERSION !== 1) {
                    _this.log("Steering VERSION ".concat(steeringData.VERSION, " not supported!"));
                    return;
                }
                _this.updated = performance.now();
                _this.timeToLoad = steeringData.TTL;
                var reloadUri = steeringData["RELOAD-URI"], pathwayClones = steeringData["PATHWAY-CLONES"], pathwayPriority = steeringData["PATHWAY-PRIORITY"];
                if (reloadUri) {
                    try {
                        _this.uri = new self.URL(reloadUri, url).href;
                    }
                    catch (error) {
                        _this.enabled = false;
                        _this.log("Failed to parse Steering Manifest RELOAD-URI: ".concat(reloadUri));
                        return;
                    }
                }
                _this.scheduleRefresh(_this.uri || context.url);
                if (pathwayClones) {
                    _this.clonePathways(pathwayClones);
                }
                var loadedSteeringData = {
                    steeringManifest: steeringData,
                    url: url.toString(),
                };
                _this.hls.trigger(events_1.Events.STEERING_MANIFEST_LOADED, loadedSteeringData);
                if (pathwayPriority) {
                    _this.updatePathwayPriority(pathwayPriority);
                }
            },
            onError: function (error, context, networkDetails, stats) {
                _this.log("Error loading steering manifest: ".concat(error.code, " ").concat(error.text, " (").concat(context.url, ")"));
                _this.stopLoad();
                if (error.code === 410) {
                    _this.enabled = false;
                    _this.log("Steering manifest ".concat(context.url, " no longer available"));
                    return;
                }
                var ttl = _this.timeToLoad * 1000;
                if (error.code === 429) {
                    var loader = _this.loader;
                    if (typeof (loader === null || loader === void 0 ? void 0 : loader.getResponseHeader) === 'function') {
                        var retryAfter = loader.getResponseHeader('Retry-After');
                        if (retryAfter) {
                            ttl = parseFloat(retryAfter) * 1000;
                        }
                    }
                    _this.log("Steering manifest ".concat(context.url, " rate limited"));
                    return;
                }
                _this.scheduleRefresh(_this.uri || context.url, ttl);
            },
            onTimeout: function (stats, context, networkDetails) {
                _this.log("Timeout loading steering manifest (".concat(context.url, ")"));
                _this.scheduleRefresh(_this.uri || context.url);
            },
        };
        this.log("Requesting steering manifest: ".concat(url));
        this.loader.load(context, loaderConfig, callbacks);
    };
    ContentSteeringController.prototype.scheduleRefresh = function (uri, ttlMs) {
        var _this = this;
        if (ttlMs === void 0) { ttlMs = this.timeToLoad * 1000; }
        this.clearTimeout();
        this.reloadTimer = self.setTimeout(function () {
            var _a;
            var media = (_a = _this.hls) === null || _a === void 0 ? void 0 : _a.media;
            if (media && !media.ended) {
                _this.loadSteeringManifest(uri);
                return;
            }
            _this.scheduleRefresh(uri, _this.timeToLoad * 1000);
        }, ttlMs);
    };
    return ContentSteeringController;
}());
exports.default = ContentSteeringController;
function cloneRenditionGroups(tracks, groupCloneMap, uriReplacement, cloneId) {
    if (!tracks) {
        return;
    }
    Object.keys(groupCloneMap).forEach(function (audioGroupId) {
        var clonedTracks = tracks
            .filter(function (track) { return track.groupId === audioGroupId; })
            .map(function (track) {
            var clonedTrack = Object.assign({}, track);
            clonedTrack.details = undefined;
            clonedTrack.attrs = new attr_list_1.AttrList(clonedTrack.attrs);
            clonedTrack.url = clonedTrack.attrs.URI = performUriReplacement(track.url, track.attrs['STABLE-RENDITION-ID'], 'PER-RENDITION-URIS', uriReplacement);
            clonedTrack.groupId = clonedTrack.attrs['GROUP-ID'] =
                groupCloneMap[audioGroupId];
            clonedTrack.attrs['PATHWAY-ID'] = cloneId;
            return clonedTrack;
        });
        tracks.push.apply(tracks, clonedTracks);
    });
}
function performUriReplacement(uri, stableId, perOptionKey, uriReplacement) {
    var _a = uriReplacement, host = _a.HOST, params = _a.PARAMS, _b = perOptionKey, perOptionUris = _a[_b];
    var perVariantUri;
    if (stableId) {
        perVariantUri = perOptionUris === null || perOptionUris === void 0 ? void 0 : perOptionUris[stableId];
        if (perVariantUri) {
            uri = perVariantUri;
        }
    }
    var url = new self.URL(uri);
    if (host && !perVariantUri) {
        url.host = host;
    }
    if (params) {
        Object.keys(params)
            .sort()
            .forEach(function (key) {
            if (key) {
                url.searchParams.set(key, params[key]);
            }
        });
    }
    return url.href;
}
