"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var level_1 = require("../types/level");
var events_1 = require("../events");
var errors_1 = require("../errors");
var codecs_1 = require("../utils/codecs");
var base_playlist_controller_1 = require("./base-playlist-controller");
var loader_1 = require("../types/loader");
var level_helper_1 = require("../utils/level-helper");
var config_1 = require("../config");
var chromeOrFirefox;
var LevelController = /** @class */ (function (_super) {
    __extends(LevelController, _super);
    function LevelController(hls, contentSteeringController) {
        var _this = _super.call(this, hls, '[level-controller]') || this;
        _this._levels = [];
        _this._firstLevel = -1;
        _this._maxAutoLevel = -1;
        _this.currentLevel = null;
        _this.currentLevelIndex = -1;
        _this.manualLevelIndex = -1;
        _this.steering = contentSteeringController;
        _this._registerListeners();
        return _this;
    }
    LevelController.prototype._registerListeners = function () {
        var hls = this.hls;
        hls.on(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.on(events_1.Events.MANIFEST_LOADED, this.onManifestLoaded, this);
        hls.on(events_1.Events.LEVEL_LOADED, this.onLevelLoaded, this);
        hls.on(events_1.Events.LEVELS_UPDATED, this.onLevelsUpdated, this);
        hls.on(events_1.Events.FRAG_BUFFERED, this.onFragBuffered, this);
        hls.on(events_1.Events.ERROR, this.onError, this);
    };
    LevelController.prototype._unregisterListeners = function () {
        var hls = this.hls;
        hls.off(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.off(events_1.Events.MANIFEST_LOADED, this.onManifestLoaded, this);
        hls.off(events_1.Events.LEVEL_LOADED, this.onLevelLoaded, this);
        hls.off(events_1.Events.LEVELS_UPDATED, this.onLevelsUpdated, this);
        hls.off(events_1.Events.FRAG_BUFFERED, this.onFragBuffered, this);
        hls.off(events_1.Events.ERROR, this.onError, this);
    };
    LevelController.prototype.destroy = function () {
        this._unregisterListeners();
        this.steering = null;
        this.resetLevels();
        _super.prototype.destroy.call(this);
    };
    LevelController.prototype.stopLoad = function () {
        var levels = this._levels;
        // clean up live level details to force reload them, and reset load errors
        levels.forEach(function (level) {
            level.loadError = 0;
            level.fragmentError = 0;
        });
        _super.prototype.stopLoad.call(this);
    };
    LevelController.prototype.resetLevels = function () {
        this._startLevel = undefined;
        this.manualLevelIndex = -1;
        this.currentLevelIndex = -1;
        this.currentLevel = null;
        this._levels = [];
        this._maxAutoLevel = -1;
    };
    LevelController.prototype.onManifestLoading = function (event, data) {
        this.resetLevels();
    };
    LevelController.prototype.onManifestLoaded = function (event, data) {
        var preferManagedMediaSource = this.hls.config.preferManagedMediaSource;
        var levels = [];
        var redundantSet = {};
        var generatePathwaySet = {};
        var resolutionFound = false;
        var videoCodecFound = false;
        var audioCodecFound = false;
        data.levels.forEach(function (levelParsed) {
            var attributes = levelParsed.attrs;
            // erase audio codec info if browser does not support mp4a.40.34.
            // demuxer will autodetect codec and fallback to mpeg/audio
            var audioCodec = levelParsed.audioCodec, videoCodec = levelParsed.videoCodec;
            if ((audioCodec === null || audioCodec === void 0 ? void 0 : audioCodec.indexOf('mp4a.40.34')) !== -1) {
                chromeOrFirefox || (chromeOrFirefox = /chrome|firefox/i.test(navigator.userAgent));
                if (chromeOrFirefox) {
                    levelParsed.audioCodec = audioCodec = undefined;
                }
            }
            if (audioCodec) {
                levelParsed.audioCodec = audioCodec = (0, codecs_1.getCodecCompatibleName)(audioCodec, preferManagedMediaSource);
            }
            if ((videoCodec === null || videoCodec === void 0 ? void 0 : videoCodec.indexOf('avc1')) === 0) {
                videoCodec = levelParsed.videoCodec = (0, codecs_1.convertAVC1ToAVCOTI)(videoCodec);
            }
            // only keep levels with supported audio/video codecs
            var width = levelParsed.width, height = levelParsed.height, unknownCodecs = levelParsed.unknownCodecs;
            resolutionFound || (resolutionFound = !!(width && height));
            videoCodecFound || (videoCodecFound = !!videoCodec);
            audioCodecFound || (audioCodecFound = !!audioCodec);
            if ((unknownCodecs === null || unknownCodecs === void 0 ? void 0 : unknownCodecs.length) ||
                (audioCodec &&
                    !(0, codecs_1.areCodecsMediaSourceSupported)(audioCodec, 'audio', preferManagedMediaSource)) ||
                (videoCodec &&
                    !(0, codecs_1.areCodecsMediaSourceSupported)(videoCodec, 'video', preferManagedMediaSource))) {
                return;
            }
            var CODECS = attributes.CODECS, FRAMERATE = attributes["FRAME-RATE"], HDCP = attributes["HDCP-LEVEL"], PATHWAY = attributes["PATHWAY-ID"], RESOLUTION = attributes.RESOLUTION, VIDEO_RANGE = attributes["VIDEO-RANGE"];
            var contentSteeringPrefix = "".concat(PATHWAY || '.', "-");
            var levelKey = "".concat(contentSteeringPrefix).concat(levelParsed.bitrate, "-").concat(RESOLUTION, "-").concat(FRAMERATE, "-").concat(CODECS, "-").concat(VIDEO_RANGE, "-").concat(HDCP);
            if (!redundantSet[levelKey]) {
                var level = new level_1.Level(levelParsed);
                redundantSet[levelKey] = level;
                generatePathwaySet[levelKey] = 1;
                levels.push(level);
            }
            else if (redundantSet[levelKey].uri !== levelParsed.url &&
                !levelParsed.attrs['PATHWAY-ID']) {
                // Assign Pathway IDs to Redundant Streams (default Pathways is ".". Redundant Streams "..", "...", and so on.)
                // Content Steering controller to handles Pathway fallback on error
                var pathwayCount = (generatePathwaySet[levelKey] += 1);
                levelParsed.attrs['PATHWAY-ID'] = new Array(pathwayCount + 1).join('.');
                var level = new level_1.Level(levelParsed);
                redundantSet[levelKey] = level;
                levels.push(level);
            }
            else {
                redundantSet[levelKey].addGroupId('audio', attributes.AUDIO);
                redundantSet[levelKey].addGroupId('text', attributes.SUBTITLES);
            }
        });
        this.filterAndSortMediaOptions(levels, data, resolutionFound, videoCodecFound, audioCodecFound);
    };
    LevelController.prototype.filterAndSortMediaOptions = function (filteredLevels, data, resolutionFound, videoCodecFound, audioCodecFound) {
        var _this = this;
        var _a;
        var audioTracks = [];
        var subtitleTracks = [];
        var levels = filteredLevels;
        // remove audio-only and invalid video-range levels if we also have levels with video codecs or RESOLUTION signalled
        if ((resolutionFound || videoCodecFound) && audioCodecFound) {
            levels = levels.filter(function (_a) {
                var videoCodec = _a.videoCodec, videoRange = _a.videoRange, width = _a.width, height = _a.height;
                return (!!videoCodec || !!(width && height)) && (0, level_1.isVideoRange)(videoRange);
            });
        }
        if (levels.length === 0) {
            // Dispatch error after MANIFEST_LOADED is done propagating
            Promise.resolve().then(function () {
                if (_this.hls) {
                    if (data.levels.length) {
                        _this.warn("One or more CODECS in variant not supported: ".concat(JSON.stringify(data.levels[0].attrs)));
                    }
                    var error = new Error('no level with compatible codecs found in manifest');
                    _this.hls.trigger(events_1.Events.ERROR, {
                        type: errors_1.ErrorTypes.MEDIA_ERROR,
                        details: errors_1.ErrorDetails.MANIFEST_INCOMPATIBLE_CODECS_ERROR,
                        fatal: true,
                        url: data.url,
                        error: error,
                        reason: error.message,
                    });
                }
            });
            return;
        }
        if (data.audioTracks) {
            var preferManagedMediaSource_1 = this.hls.config.preferManagedMediaSource;
            audioTracks = data.audioTracks.filter(function (track) {
                return !track.audioCodec ||
                    (0, codecs_1.areCodecsMediaSourceSupported)(track.audioCodec, 'audio', preferManagedMediaSource_1);
            });
            // Assign ids after filtering as array indices by group-id
            assignTrackIdsByGroup(audioTracks);
        }
        if (data.subtitles) {
            subtitleTracks = data.subtitles;
            assignTrackIdsByGroup(subtitleTracks);
        }
        // start bitrate is the first bitrate of the manifest
        var unsortedLevels = levels.slice(0);
        // sort levels from lowest to highest
        levels.sort(function (a, b) {
            if (a.attrs['HDCP-LEVEL'] !== b.attrs['HDCP-LEVEL']) {
                return (a.attrs['HDCP-LEVEL'] || '') > (b.attrs['HDCP-LEVEL'] || '')
                    ? 1
                    : -1;
            }
            // sort on height before bitrate for cap-level-controller
            if (resolutionFound && a.height !== b.height) {
                return a.height - b.height;
            }
            if (a.frameRate !== b.frameRate) {
                return a.frameRate - b.frameRate;
            }
            if (a.videoRange !== b.videoRange) {
                return (level_1.VideoRangeValues.indexOf(a.videoRange) -
                    level_1.VideoRangeValues.indexOf(b.videoRange));
            }
            if (a.videoCodec !== b.videoCodec) {
                var valueA = (0, codecs_1.videoCodecPreferenceValue)(a.videoCodec);
                var valueB = (0, codecs_1.videoCodecPreferenceValue)(b.videoCodec);
                if (valueA !== valueB) {
                    return valueB - valueA;
                }
            }
            if (a.uri === b.uri && a.codecSet !== b.codecSet) {
                var valueA = (0, codecs_1.codecsSetSelectionPreferenceValue)(a.codecSet);
                var valueB = (0, codecs_1.codecsSetSelectionPreferenceValue)(b.codecSet);
                if (valueA !== valueB) {
                    return valueB - valueA;
                }
            }
            if (a.averageBitrate !== b.averageBitrate) {
                return a.averageBitrate - b.averageBitrate;
            }
            return 0;
        });
        var firstLevelInPlaylist = unsortedLevels[0];
        if (this.steering) {
            levels = this.steering.filterParsedLevels(levels);
            if (levels.length !== unsortedLevels.length) {
                for (var i = 0; i < unsortedLevels.length; i++) {
                    if (unsortedLevels[i].pathwayId === levels[0].pathwayId) {
                        firstLevelInPlaylist = unsortedLevels[i];
                        break;
                    }
                }
            }
        }
        this._levels = levels;
        // find index of first level in sorted levels
        for (var i = 0; i < levels.length; i++) {
            if (levels[i] === firstLevelInPlaylist) {
                this._firstLevel = i;
                var firstLevelBitrate = firstLevelInPlaylist.bitrate;
                var bandwidthEstimate = this.hls.bandwidthEstimate;
                this.log("manifest loaded, ".concat(levels.length, " level(s) found, first bitrate: ").concat(firstLevelBitrate));
                // Update default bwe to first variant bitrate as long it has not been configured or set
                if (((_a = this.hls.userConfig) === null || _a === void 0 ? void 0 : _a.abrEwmaDefaultEstimate) === undefined) {
                    var startingBwEstimate = Math.min(firstLevelBitrate, this.hls.config.abrEwmaDefaultEstimateMax);
                    if (startingBwEstimate > bandwidthEstimate &&
                        bandwidthEstimate === config_1.hlsDefaultConfig.abrEwmaDefaultEstimate) {
                        this.hls.bandwidthEstimate = startingBwEstimate;
                    }
                }
                break;
            }
        }
        // Audio is only alternate if manifest include a URI along with the audio group tag,
        // and this is not an audio-only stream where levels contain audio-only
        var audioOnly = audioCodecFound && !videoCodecFound;
        var edata = {
            levels: levels,
            audioTracks: audioTracks,
            subtitleTracks: subtitleTracks,
            sessionData: data.sessionData,
            sessionKeys: data.sessionKeys,
            firstLevel: this._firstLevel,
            stats: data.stats,
            audio: audioCodecFound,
            video: videoCodecFound,
            altAudio: !audioOnly && audioTracks.some(function (t) { return !!t.url; }),
        };
        this.hls.trigger(events_1.Events.MANIFEST_PARSED, edata);
        // Initiate loading after all controllers have received MANIFEST_PARSED
        if (this.hls.config.autoStartLoad || this.hls.forceStartLoad) {
            this.hls.startLoad(this.hls.config.startPosition);
        }
    };
    Object.defineProperty(LevelController.prototype, "levels", {
        get: function () {
            if (this._levels.length === 0) {
                return null;
            }
            return this._levels;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LevelController.prototype, "level", {
        get: function () {
            return this.currentLevelIndex;
        },
        set: function (newLevel) {
            var levels = this._levels;
            if (levels.length === 0) {
                return;
            }
            // check if level idx is valid
            if (newLevel < 0 || newLevel >= levels.length) {
                // invalid level id given, trigger error
                var error = new Error('invalid level idx');
                var fatal = newLevel < 0;
                this.hls.trigger(events_1.Events.ERROR, {
                    type: errors_1.ErrorTypes.OTHER_ERROR,
                    details: errors_1.ErrorDetails.LEVEL_SWITCH_ERROR,
                    level: newLevel,
                    fatal: fatal,
                    error: error,
                    reason: error.message,
                });
                if (fatal) {
                    return;
                }
                newLevel = Math.min(newLevel, levels.length - 1);
            }
            var lastLevelIndex = this.currentLevelIndex;
            var lastLevel = this.currentLevel;
            var lastPathwayId = lastLevel ? lastLevel.attrs['PATHWAY-ID'] : undefined;
            var level = levels[newLevel];
            var pathwayId = level.attrs['PATHWAY-ID'];
            this.currentLevelIndex = newLevel;
            this.currentLevel = level;
            if (lastLevelIndex === newLevel &&
                level.details &&
                lastLevel &&
                lastPathwayId === pathwayId) {
                return;
            }
            this.log("Switching to level ".concat(newLevel, " (").concat(level.height ? level.height + 'p ' : '').concat(level.videoRange ? level.videoRange + ' ' : '').concat(level.codecSet ? level.codecSet + ' ' : '', "@").concat(level.bitrate, ")").concat(pathwayId ? ' with Pathway ' + pathwayId : '', " from level ").concat(lastLevelIndex).concat(lastPathwayId ? ' with Pathway ' + lastPathwayId : ''));
            var levelSwitchingData = {
                level: newLevel,
                attrs: level.attrs,
                details: level.details,
                bitrate: level.bitrate,
                averageBitrate: level.averageBitrate,
                maxBitrate: level.maxBitrate,
                realBitrate: level.realBitrate,
                width: level.width,
                height: level.height,
                codecSet: level.codecSet,
                audioCodec: level.audioCodec,
                videoCodec: level.videoCodec,
                audioGroups: level.audioGroups,
                subtitleGroups: level.subtitleGroups,
                loaded: level.loaded,
                loadError: level.loadError,
                fragmentError: level.fragmentError,
                name: level.name,
                id: level.id,
                uri: level.uri,
                url: level.url,
                urlId: 0,
                audioGroupIds: level.audioGroupIds,
                textGroupIds: level.textGroupIds,
            };
            this.hls.trigger(events_1.Events.LEVEL_SWITCHING, levelSwitchingData);
            // check if we need to load playlist for this level
            var levelDetails = level.details;
            if (!levelDetails || levelDetails.live) {
                // level not retrieved yet, or live playlist we need to (re)load it
                var hlsUrlParameters = this.switchParams(level.uri, lastLevel === null || lastLevel === void 0 ? void 0 : lastLevel.details, levelDetails);
                this.loadPlaylist(hlsUrlParameters);
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LevelController.prototype, "manualLevel", {
        get: function () {
            return this.manualLevelIndex;
        },
        set: function (newLevel) {
            this.manualLevelIndex = newLevel;
            if (this._startLevel === undefined) {
                this._startLevel = newLevel;
            }
            if (newLevel !== -1) {
                this.level = newLevel;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LevelController.prototype, "firstLevel", {
        get: function () {
            return this._firstLevel;
        },
        set: function (newLevel) {
            this._firstLevel = newLevel;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LevelController.prototype, "startLevel", {
        get: function () {
            // Setting hls.startLevel (this._startLevel) overrides config.startLevel
            if (this._startLevel === undefined) {
                var configStartLevel = this.hls.config.startLevel;
                if (configStartLevel !== undefined) {
                    return configStartLevel;
                }
                return this.hls.firstAutoLevel;
            }
            return this._startLevel;
        },
        set: function (newLevel) {
            this._startLevel = newLevel;
        },
        enumerable: false,
        configurable: true
    });
    LevelController.prototype.onError = function (event, data) {
        if (data.fatal || !data.context) {
            return;
        }
        if (data.context.type === loader_1.PlaylistContextType.LEVEL &&
            data.context.level === this.level) {
            this.checkRetry(data);
        }
    };
    // reset errors on the successful load of a fragment
    LevelController.prototype.onFragBuffered = function (event, _a) {
        var frag = _a.frag;
        if (frag !== undefined && frag.type === loader_1.PlaylistLevelType.MAIN) {
            var el_1 = frag.elementaryStreams;
            if (!Object.keys(el_1).some(function (type) { return !!el_1[type]; })) {
                return;
            }
            var level = this._levels[frag.level];
            if (level === null || level === void 0 ? void 0 : level.loadError) {
                this.log("Resetting level error count of ".concat(level.loadError, " on frag buffered"));
                level.loadError = 0;
            }
        }
    };
    LevelController.prototype.onLevelLoaded = function (event, data) {
        var _a, _b;
        var level = data.level, details = data.details;
        var curLevel = this._levels[level];
        if (!curLevel) {
            this.warn("Invalid level index ".concat(level));
            if ((_a = data.deliveryDirectives) === null || _a === void 0 ? void 0 : _a.skip) {
                details.deltaUpdateFailed = true;
            }
            return;
        }
        // only process level loaded events matching with expected level
        if (level === this.currentLevelIndex) {
            // reset level load error counter on successful level loaded only if there is no issues with fragments
            if (curLevel.fragmentError === 0) {
                curLevel.loadError = 0;
            }
            this.playlistLoaded(level, data, curLevel.details);
        }
        else if ((_b = data.deliveryDirectives) === null || _b === void 0 ? void 0 : _b.skip) {
            // received a delta playlist update that cannot be merged
            details.deltaUpdateFailed = true;
        }
    };
    LevelController.prototype.loadPlaylist = function (hlsUrlParameters) {
        _super.prototype.loadPlaylist.call(this);
        var currentLevelIndex = this.currentLevelIndex;
        var currentLevel = this.currentLevel;
        if (currentLevel && this.shouldLoadPlaylist(currentLevel)) {
            var url = currentLevel.uri;
            if (hlsUrlParameters) {
                try {
                    url = hlsUrlParameters.addDirectives(url);
                }
                catch (error) {
                    this.warn("Could not construct new URL with HLS Delivery Directives: ".concat(error));
                }
            }
            var pathwayId = currentLevel.attrs['PATHWAY-ID'];
            this.log("Loading level index ".concat(currentLevelIndex).concat((hlsUrlParameters === null || hlsUrlParameters === void 0 ? void 0 : hlsUrlParameters.msn) !== undefined
                ? ' at sn ' +
                    hlsUrlParameters.msn +
                    ' part ' +
                    hlsUrlParameters.part
                : '', " with").concat(pathwayId ? ' Pathway ' + pathwayId : '', " ").concat(url));
            // console.log('Current audio track group ID:', this.hls.audioTracks[this.hls.audioTrack].groupId);
            // console.log('New video quality level audio group id:', levelObject.attrs.AUDIO, level);
            this.clearTimer();
            this.hls.trigger(events_1.Events.LEVEL_LOADING, {
                url: url,
                level: currentLevelIndex,
                pathwayId: currentLevel.attrs['PATHWAY-ID'],
                id: 0, // Deprecated Level urlId
                deliveryDirectives: hlsUrlParameters || null,
            });
        }
    };
    Object.defineProperty(LevelController.prototype, "nextLoadLevel", {
        get: function () {
            if (this.manualLevelIndex !== -1) {
                return this.manualLevelIndex;
            }
            else {
                return this.hls.nextAutoLevel;
            }
        },
        set: function (nextLevel) {
            this.level = nextLevel;
            if (this.manualLevelIndex === -1) {
                this.hls.nextAutoLevel = nextLevel;
            }
        },
        enumerable: false,
        configurable: true
    });
    LevelController.prototype.removeLevel = function (levelIndex) {
        var _this = this;
        var _a;
        var levels = this._levels.filter(function (level, index) {
            if (index !== levelIndex) {
                return true;
            }
            if (_this.steering) {
                _this.steering.removeLevel(level);
            }
            if (level === _this.currentLevel) {
                _this.currentLevel = null;
                _this.currentLevelIndex = -1;
                if (level.details) {
                    level.details.fragments.forEach(function (f) { return (f.level = -1); });
                }
            }
            return false;
        });
        (0, level_helper_1.reassignFragmentLevelIndexes)(levels);
        this._levels = levels;
        if (this.currentLevelIndex > -1 && ((_a = this.currentLevel) === null || _a === void 0 ? void 0 : _a.details)) {
            this.currentLevelIndex = this.currentLevel.details.fragments[0].level;
        }
        this.hls.trigger(events_1.Events.LEVELS_UPDATED, { levels: levels });
    };
    LevelController.prototype.onLevelsUpdated = function (event, _a) {
        var levels = _a.levels;
        this._levels = levels;
    };
    LevelController.prototype.checkMaxAutoUpdated = function () {
        var _a = this.hls, autoLevelCapping = _a.autoLevelCapping, maxAutoLevel = _a.maxAutoLevel, maxHdcpLevel = _a.maxHdcpLevel;
        if (this._maxAutoLevel !== maxAutoLevel) {
            this._maxAutoLevel = maxAutoLevel;
            this.hls.trigger(events_1.Events.MAX_AUTO_LEVEL_UPDATED, {
                autoLevelCapping: autoLevelCapping,
                levels: this.levels,
                maxAutoLevel: maxAutoLevel,
                minAutoLevel: this.hls.minAutoLevel,
                maxHdcpLevel: maxHdcpLevel,
            });
        }
    };
    return LevelController;
}(base_playlist_controller_1.default));
exports.default = LevelController;
function assignTrackIdsByGroup(tracks) {
    var groups = {};
    tracks.forEach(function (track) {
        var groupId = track.groupId || '';
        track.id = groups[groupId] = groups[groupId] || 0;
        groups[groupId]++;
    });
}
