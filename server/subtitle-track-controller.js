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
var base_playlist_controller_1 = require("./base-playlist-controller");
var events_1 = require("../events");
var texttrack_utils_1 = require("../utils/texttrack-utils");
var loader_1 = require("../types/loader");
var media_option_attributes_1 = require("../utils/media-option-attributes");
var rendition_helper_1 = require("../utils/rendition-helper");
var SubtitleTrackController = /** @class */ (function (_super) {
    __extends(SubtitleTrackController, _super);
    function SubtitleTrackController(hls) {
        var _this = _super.call(this, hls, '[subtitle-track-controller]') || this;
        _this.media = null;
        _this.tracks = [];
        _this.groupIds = null;
        _this.tracksInGroup = [];
        _this.trackId = -1;
        _this.currentTrack = null;
        _this.selectDefaultTrack = true;
        _this.queuedDefaultTrack = -1;
        _this.asyncPollTrackChange = function () { return _this.pollTrackChange(0); };
        _this.useTextTrackPolling = false;
        _this.subtitlePollingInterval = -1;
        _this._subtitleDisplay = true;
        _this.onTextTracksChanged = function () {
            if (!_this.useTextTrackPolling) {
                self.clearInterval(_this.subtitlePollingInterval);
            }
            // Media is undefined when switching streams via loadSource()
            if (!_this.media || !_this.hls.config.renderTextTracksNatively) {
                return;
            }
            var textTrack = null;
            var tracks = (0, texttrack_utils_1.filterSubtitleTracks)(_this.media.textTracks);
            for (var i = 0; i < tracks.length; i++) {
                if (tracks[i].mode === 'hidden') {
                    // Do not break in case there is a following track with showing.
                    textTrack = tracks[i];
                }
                else if (tracks[i].mode === 'showing') {
                    textTrack = tracks[i];
                    break;
                }
            }
            // Find internal track index for TextTrack
            var trackId = _this.findTrackForTextTrack(textTrack);
            if (_this.subtitleTrack !== trackId) {
                _this.setSubtitleTrack(trackId);
            }
        };
        _this.registerListeners();
        return _this;
    }
    SubtitleTrackController.prototype.destroy = function () {
        this.unregisterListeners();
        this.tracks.length = 0;
        this.tracksInGroup.length = 0;
        this.currentTrack = null;
        this.onTextTracksChanged = this.asyncPollTrackChange = null;
        _super.prototype.destroy.call(this);
    };
    Object.defineProperty(SubtitleTrackController.prototype, "subtitleDisplay", {
        get: function () {
            return this._subtitleDisplay;
        },
        set: function (value) {
            this._subtitleDisplay = value;
            if (this.trackId > -1) {
                this.toggleTrackModes();
            }
        },
        enumerable: false,
        configurable: true
    });
    SubtitleTrackController.prototype.registerListeners = function () {
        var hls = this.hls;
        hls.on(events_1.Events.MEDIA_ATTACHED, this.onMediaAttached, this);
        hls.on(events_1.Events.MEDIA_DETACHING, this.onMediaDetaching, this);
        hls.on(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.on(events_1.Events.MANIFEST_PARSED, this.onManifestParsed, this);
        hls.on(events_1.Events.LEVEL_LOADING, this.onLevelLoading, this);
        hls.on(events_1.Events.LEVEL_SWITCHING, this.onLevelSwitching, this);
        hls.on(events_1.Events.SUBTITLE_TRACK_LOADED, this.onSubtitleTrackLoaded, this);
        hls.on(events_1.Events.ERROR, this.onError, this);
    };
    SubtitleTrackController.prototype.unregisterListeners = function () {
        var hls = this.hls;
        hls.off(events_1.Events.MEDIA_ATTACHED, this.onMediaAttached, this);
        hls.off(events_1.Events.MEDIA_DETACHING, this.onMediaDetaching, this);
        hls.off(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.off(events_1.Events.MANIFEST_PARSED, this.onManifestParsed, this);
        hls.off(events_1.Events.LEVEL_LOADING, this.onLevelLoading, this);
        hls.off(events_1.Events.LEVEL_SWITCHING, this.onLevelSwitching, this);
        hls.off(events_1.Events.SUBTITLE_TRACK_LOADED, this.onSubtitleTrackLoaded, this);
        hls.off(events_1.Events.ERROR, this.onError, this);
    };
    // Listen for subtitle track change, then extract the current track ID.
    SubtitleTrackController.prototype.onMediaAttached = function (event, data) {
        this.media = data.media;
        if (!this.media) {
            return;
        }
        if (this.queuedDefaultTrack > -1) {
            this.subtitleTrack = this.queuedDefaultTrack;
            this.queuedDefaultTrack = -1;
        }
        this.useTextTrackPolling = !(this.media.textTracks && 'onchange' in this.media.textTracks);
        if (this.useTextTrackPolling) {
            this.pollTrackChange(500);
        }
        else {
            this.media.textTracks.addEventListener('change', this.asyncPollTrackChange);
        }
    };
    SubtitleTrackController.prototype.pollTrackChange = function (timeout) {
        self.clearInterval(this.subtitlePollingInterval);
        this.subtitlePollingInterval = self.setInterval(this.onTextTracksChanged, timeout);
    };
    SubtitleTrackController.prototype.onMediaDetaching = function () {
        if (!this.media) {
            return;
        }
        self.clearInterval(this.subtitlePollingInterval);
        if (!this.useTextTrackPolling) {
            this.media.textTracks.removeEventListener('change', this.asyncPollTrackChange);
        }
        if (this.trackId > -1) {
            this.queuedDefaultTrack = this.trackId;
        }
        var textTracks = (0, texttrack_utils_1.filterSubtitleTracks)(this.media.textTracks);
        // Clear loaded cues on media detachment from tracks
        textTracks.forEach(function (track) {
            (0, texttrack_utils_1.clearCurrentCues)(track);
        });
        // Disable all subtitle tracks before detachment so when reattached only tracks in that content are enabled.
        this.subtitleTrack = -1;
        this.media = null;
    };
    SubtitleTrackController.prototype.onManifestLoading = function () {
        this.tracks = [];
        this.groupIds = null;
        this.tracksInGroup = [];
        this.trackId = -1;
        this.currentTrack = null;
        this.selectDefaultTrack = true;
    };
    // Fired whenever a new manifest is loaded.
    SubtitleTrackController.prototype.onManifestParsed = function (event, data) {
        this.tracks = data.subtitleTracks;
    };
    SubtitleTrackController.prototype.onSubtitleTrackLoaded = function (event, data) {
        var id = data.id, groupId = data.groupId, details = data.details;
        var trackInActiveGroup = this.tracksInGroup[id];
        if (!trackInActiveGroup || trackInActiveGroup.groupId !== groupId) {
            this.warn("Subtitle track with id:".concat(id, " and group:").concat(groupId, " not found in active group ").concat(trackInActiveGroup === null || trackInActiveGroup === void 0 ? void 0 : trackInActiveGroup.groupId));
            return;
        }
        var curDetails = trackInActiveGroup.details;
        trackInActiveGroup.details = data.details;
        this.log("Subtitle track ".concat(id, " \"").concat(trackInActiveGroup.name, "\" lang:").concat(trackInActiveGroup.lang, " group:").concat(groupId, " loaded [").concat(details.startSN, "-").concat(details.endSN, "]"));
        if (id === this.trackId) {
            this.playlistLoaded(id, data, curDetails);
        }
    };
    SubtitleTrackController.prototype.onLevelLoading = function (event, data) {
        this.switchLevel(data.level);
    };
    SubtitleTrackController.prototype.onLevelSwitching = function (event, data) {
        this.switchLevel(data.level);
    };
    SubtitleTrackController.prototype.switchLevel = function (levelIndex) {
        var levelInfo = this.hls.levels[levelIndex];
        if (!levelInfo) {
            return;
        }
        var subtitleGroups = levelInfo.subtitleGroups || null;
        var currentGroups = this.groupIds;
        var currentTrack = this.currentTrack;
        if (!subtitleGroups ||
            (currentGroups === null || currentGroups === void 0 ? void 0 : currentGroups.length) !== (subtitleGroups === null || subtitleGroups === void 0 ? void 0 : subtitleGroups.length) ||
            (subtitleGroups === null || subtitleGroups === void 0 ? void 0 : subtitleGroups.some(function (groupId) { return (currentGroups === null || currentGroups === void 0 ? void 0 : currentGroups.indexOf(groupId)) === -1; }))) {
            this.groupIds = subtitleGroups;
            this.trackId = -1;
            this.currentTrack = null;
            var subtitleTracks = this.tracks.filter(function (track) {
                return !subtitleGroups || subtitleGroups.indexOf(track.groupId) !== -1;
            });
            if (subtitleTracks.length) {
                // Disable selectDefaultTrack if there are no default tracks
                if (this.selectDefaultTrack &&
                    !subtitleTracks.some(function (track) { return track.default; })) {
                    this.selectDefaultTrack = false;
                }
                // track.id should match hls.audioTracks index
                subtitleTracks.forEach(function (track, i) {
                    track.id = i;
                });
            }
            else if (!currentTrack && !this.tracksInGroup.length) {
                // Do not dispatch SUBTITLE_TRACKS_UPDATED when there were and are no tracks
                return;
            }
            this.tracksInGroup = subtitleTracks;
            // Find preferred track
            var subtitlePreference = this.hls.config.subtitlePreference;
            if (!currentTrack && subtitlePreference) {
                this.selectDefaultTrack = false;
                var groupIndex = (0, rendition_helper_1.findMatchingOption)(subtitlePreference, subtitleTracks);
                if (groupIndex > -1) {
                    currentTrack = subtitleTracks[groupIndex];
                }
                else {
                    var allIndex = (0, rendition_helper_1.findMatchingOption)(subtitlePreference, this.tracks);
                    currentTrack = this.tracks[allIndex];
                }
            }
            // Select initial track
            var trackId = this.findTrackId(currentTrack);
            if (trackId === -1 && currentTrack) {
                trackId = this.findTrackId(null);
            }
            // Dispatch events and load track if needed
            var subtitleTracksUpdated = {
                subtitleTracks: subtitleTracks,
            };
            this.log("Updating subtitle tracks, ".concat(subtitleTracks.length, " track(s) found in \"").concat(subtitleGroups === null || subtitleGroups === void 0 ? void 0 : subtitleGroups.join(','), "\" group-id"));
            this.hls.trigger(events_1.Events.SUBTITLE_TRACKS_UPDATED, subtitleTracksUpdated);
            if (trackId !== -1 && this.trackId === -1) {
                this.setSubtitleTrack(trackId);
            }
        }
        else if (this.shouldReloadPlaylist(currentTrack)) {
            // Retry playlist loading if no playlist is or has been loaded yet
            this.setSubtitleTrack(this.trackId);
        }
    };
    SubtitleTrackController.prototype.findTrackId = function (currentTrack) {
        var tracks = this.tracksInGroup;
        var selectDefault = this.selectDefaultTrack;
        for (var i = 0; i < tracks.length; i++) {
            var track = tracks[i];
            if ((selectDefault && !track.default) ||
                (!selectDefault && !currentTrack)) {
                continue;
            }
            if (!currentTrack || (0, rendition_helper_1.matchesOption)(track, currentTrack)) {
                return i;
            }
        }
        if (currentTrack) {
            for (var i = 0; i < tracks.length; i++) {
                var track = tracks[i];
                if ((0, media_option_attributes_1.mediaAttributesIdentical)(currentTrack.attrs, track.attrs, [
                    'LANGUAGE',
                    'ASSOC-LANGUAGE',
                    'CHARACTERISTICS',
                ])) {
                    return i;
                }
            }
            for (var i = 0; i < tracks.length; i++) {
                var track = tracks[i];
                if ((0, media_option_attributes_1.mediaAttributesIdentical)(currentTrack.attrs, track.attrs, [
                    'LANGUAGE',
                ])) {
                    return i;
                }
            }
        }
        return -1;
    };
    SubtitleTrackController.prototype.findTrackForTextTrack = function (textTrack) {
        if (textTrack) {
            var tracks = this.tracksInGroup;
            for (var i = 0; i < tracks.length; i++) {
                var track = tracks[i];
                if ((0, media_option_attributes_1.subtitleTrackMatchesTextTrack)(track, textTrack)) {
                    return i;
                }
            }
        }
        return -1;
    };
    SubtitleTrackController.prototype.onError = function (event, data) {
        if (data.fatal || !data.context) {
            return;
        }
        if (data.context.type === loader_1.PlaylistContextType.SUBTITLE_TRACK &&
            data.context.id === this.trackId &&
            (!this.groupIds || this.groupIds.indexOf(data.context.groupId) !== -1)) {
            this.checkRetry(data);
        }
    };
    Object.defineProperty(SubtitleTrackController.prototype, "allSubtitleTracks", {
        get: function () {
            return this.tracks;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SubtitleTrackController.prototype, "subtitleTracks", {
        /** get alternate subtitle tracks list from playlist **/
        get: function () {
            return this.tracksInGroup;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SubtitleTrackController.prototype, "subtitleTrack", {
        /** get/set index of the selected subtitle track (based on index in subtitle track lists) **/
        get: function () {
            return this.trackId;
        },
        set: function (newId) {
            this.selectDefaultTrack = false;
            this.setSubtitleTrack(newId);
        },
        enumerable: false,
        configurable: true
    });
    SubtitleTrackController.prototype.setSubtitleOption = function (subtitleOption) {
        this.hls.config.subtitlePreference = subtitleOption;
        if (subtitleOption) {
            var allSubtitleTracks = this.allSubtitleTracks;
            this.selectDefaultTrack = false;
            if (allSubtitleTracks.length) {
                // First see if current option matches (no switch op)
                var currentTrack = this.currentTrack;
                if (currentTrack && (0, rendition_helper_1.matchesOption)(subtitleOption, currentTrack)) {
                    return currentTrack;
                }
                // Find option in current group
                var groupIndex = (0, rendition_helper_1.findMatchingOption)(subtitleOption, this.tracksInGroup);
                if (groupIndex > -1) {
                    var track = this.tracksInGroup[groupIndex];
                    this.setSubtitleTrack(groupIndex);
                    return track;
                }
                else if (currentTrack) {
                    // If this is not the initial selection return null
                    // option should have matched one in active group
                    return null;
                }
                else {
                    // Find the option in all tracks for initial selection
                    var allIndex = (0, rendition_helper_1.findMatchingOption)(subtitleOption, allSubtitleTracks);
                    if (allIndex > -1) {
                        return allSubtitleTracks[allIndex];
                    }
                }
            }
        }
        return null;
    };
    SubtitleTrackController.prototype.loadPlaylist = function (hlsUrlParameters) {
        _super.prototype.loadPlaylist.call(this);
        var currentTrack = this.currentTrack;
        if (this.shouldLoadPlaylist(currentTrack) && currentTrack) {
            var id = currentTrack.id;
            var groupId = currentTrack.groupId;
            var url = currentTrack.url;
            if (hlsUrlParameters) {
                try {
                    url = hlsUrlParameters.addDirectives(url);
                }
                catch (error) {
                    this.warn("Could not construct new URL with HLS Delivery Directives: ".concat(error));
                }
            }
            this.log("Loading subtitle playlist for id ".concat(id));
            this.hls.trigger(events_1.Events.SUBTITLE_TRACK_LOADING, {
                url: url,
                id: id,
                groupId: groupId,
                deliveryDirectives: hlsUrlParameters || null,
            });
        }
    };
    /**
     * Disables the old subtitleTrack and sets current mode on the next subtitleTrack.
     * This operates on the DOM textTracks.
     * A value of -1 will disable all subtitle tracks.
     */
    SubtitleTrackController.prototype.toggleTrackModes = function () {
        var media = this.media;
        if (!media) {
            return;
        }
        var textTracks = (0, texttrack_utils_1.filterSubtitleTracks)(media.textTracks);
        var currentTrack = this.currentTrack;
        var nextTrack;
        if (currentTrack) {
            nextTrack = textTracks.filter(function (textTrack) {
                return (0, media_option_attributes_1.subtitleTrackMatchesTextTrack)(currentTrack, textTrack);
            })[0];
            if (!nextTrack) {
                this.warn("Unable to find subtitle TextTrack with name \"".concat(currentTrack.name, "\" and language \"").concat(currentTrack.lang, "\""));
            }
        }
        [].slice.call(textTracks).forEach(function (track) {
            if (track.mode !== 'disabled' && track !== nextTrack) {
                track.mode = 'disabled';
            }
        });
        if (nextTrack) {
            var mode = this.subtitleDisplay ? 'showing' : 'hidden';
            if (nextTrack.mode !== mode) {
                nextTrack.mode = mode;
            }
        }
    };
    /**
     * This method is responsible for validating the subtitle index and periodically reloading if live.
     * Dispatches the SUBTITLE_TRACK_SWITCH event, which instructs the subtitle-stream-controller to load the selected track.
     */
    SubtitleTrackController.prototype.setSubtitleTrack = function (newId) {
        var tracks = this.tracksInGroup;
        // setting this.subtitleTrack will trigger internal logic
        // if media has not been attached yet, it will fail
        // we keep a reference to the default track id
        // and we'll set subtitleTrack when onMediaAttached is triggered
        if (!this.media) {
            this.queuedDefaultTrack = newId;
            return;
        }
        // exit if track id as already set or invalid
        if (newId < -1 || newId >= tracks.length || !Number.isFinite(newId)) {
            this.warn("Invalid subtitle track id: ".concat(newId));
            return;
        }
        // stopping live reloading timer if any
        this.clearTimer();
        this.selectDefaultTrack = false;
        var lastTrack = this.currentTrack;
        var track = tracks[newId] || null;
        this.trackId = newId;
        this.currentTrack = track;
        this.toggleTrackModes();
        if (!track) {
            // switch to -1
            this.hls.trigger(events_1.Events.SUBTITLE_TRACK_SWITCH, { id: newId });
            return;
        }
        var trackLoaded = !!track.details && !track.details.live;
        if (newId === this.trackId && track === lastTrack && trackLoaded) {
            return;
        }
        this.log("Switching to subtitle-track ".concat(newId) +
            (track
                ? " \"".concat(track.name, "\" lang:").concat(track.lang, " group:").concat(track.groupId)
                : ''));
        var id = track.id, _a = track.groupId, groupId = _a === void 0 ? '' : _a, name = track.name, type = track.type, url = track.url;
        this.hls.trigger(events_1.Events.SUBTITLE_TRACK_SWITCH, {
            id: id,
            groupId: groupId,
            name: name,
            type: type,
            url: url,
        });
        var hlsUrlParameters = this.switchParams(track.url, lastTrack === null || lastTrack === void 0 ? void 0 : lastTrack.details, track.details);
        this.loadPlaylist(hlsUrlParameters);
    };
    return SubtitleTrackController;
}(base_playlist_controller_1.default));
exports.default = SubtitleTrackController;
