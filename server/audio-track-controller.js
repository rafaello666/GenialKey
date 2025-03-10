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
var base_playlist_controller_1 = require("./base-playlist-controller");
var events_1 = require("../events");
var errors_1 = require("../errors");
var loader_1 = require("../types/loader");
var media_option_attributes_1 = require("../utils/media-option-attributes");
var rendition_helper_1 = require("../utils/rendition-helper");
var AudioTrackController = /** @class */ (function (_super) {
    __extends(AudioTrackController, _super);
    function AudioTrackController(hls) {
        var _this = _super.call(this, hls, '[audio-track-controller]') || this;
        _this.tracks = [];
        _this.groupIds = null;
        _this.tracksInGroup = [];
        _this.trackId = -1;
        _this.currentTrack = null;
        _this.selectDefaultTrack = true;
        _this.registerListeners();
        return _this;
    }
    AudioTrackController.prototype.registerListeners = function () {
        var hls = this.hls;
        hls.on(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.on(events_1.Events.MANIFEST_PARSED, this.onManifestParsed, this);
        hls.on(events_1.Events.LEVEL_LOADING, this.onLevelLoading, this);
        hls.on(events_1.Events.LEVEL_SWITCHING, this.onLevelSwitching, this);
        hls.on(events_1.Events.AUDIO_TRACK_LOADED, this.onAudioTrackLoaded, this);
        hls.on(events_1.Events.ERROR, this.onError, this);
    };
    AudioTrackController.prototype.unregisterListeners = function () {
        var hls = this.hls;
        hls.off(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.off(events_1.Events.MANIFEST_PARSED, this.onManifestParsed, this);
        hls.off(events_1.Events.LEVEL_LOADING, this.onLevelLoading, this);
        hls.off(events_1.Events.LEVEL_SWITCHING, this.onLevelSwitching, this);
        hls.off(events_1.Events.AUDIO_TRACK_LOADED, this.onAudioTrackLoaded, this);
        hls.off(events_1.Events.ERROR, this.onError, this);
    };
    AudioTrackController.prototype.destroy = function () {
        this.unregisterListeners();
        this.tracks.length = 0;
        this.tracksInGroup.length = 0;
        this.currentTrack = null;
        _super.prototype.destroy.call(this);
    };
    AudioTrackController.prototype.onManifestLoading = function () {
        this.tracks = [];
        this.tracksInGroup = [];
        this.groupIds = null;
        this.currentTrack = null;
        this.trackId = -1;
        this.selectDefaultTrack = true;
    };
    AudioTrackController.prototype.onManifestParsed = function (event, data) {
        this.tracks = data.audioTracks || [];
    };
    AudioTrackController.prototype.onAudioTrackLoaded = function (event, data) {
        var id = data.id, groupId = data.groupId, details = data.details;
        var trackInActiveGroup = this.tracksInGroup[id];
        if (!trackInActiveGroup || trackInActiveGroup.groupId !== groupId) {
            this.warn("Audio track with id:".concat(id, " and group:").concat(groupId, " not found in active group ").concat(trackInActiveGroup === null || trackInActiveGroup === void 0 ? void 0 : trackInActiveGroup.groupId));
            return;
        }
        var curDetails = trackInActiveGroup.details;
        trackInActiveGroup.details = data.details;
        this.log("Audio track ".concat(id, " \"").concat(trackInActiveGroup.name, "\" lang:").concat(trackInActiveGroup.lang, " group:").concat(groupId, " loaded [").concat(details.startSN, "-").concat(details.endSN, "]"));
        if (id === this.trackId) {
            this.playlistLoaded(id, data, curDetails);
        }
    };
    AudioTrackController.prototype.onLevelLoading = function (event, data) {
        this.switchLevel(data.level);
    };
    AudioTrackController.prototype.onLevelSwitching = function (event, data) {
        this.switchLevel(data.level);
    };
    AudioTrackController.prototype.switchLevel = function (levelIndex) {
        var _a;
        var levelInfo = this.hls.levels[levelIndex];
        if (!levelInfo) {
            return;
        }
        var audioGroups = levelInfo.audioGroups || null;
        var currentGroups = this.groupIds;
        var currentTrack = this.currentTrack;
        if (!audioGroups ||
            (currentGroups === null || currentGroups === void 0 ? void 0 : currentGroups.length) !== (audioGroups === null || audioGroups === void 0 ? void 0 : audioGroups.length) ||
            (audioGroups === null || audioGroups === void 0 ? void 0 : audioGroups.some(function (groupId) { return (currentGroups === null || currentGroups === void 0 ? void 0 : currentGroups.indexOf(groupId)) === -1; }))) {
            this.groupIds = audioGroups;
            this.trackId = -1;
            this.currentTrack = null;
            var audioTracks = this.tracks.filter(function (track) {
                return !audioGroups || audioGroups.indexOf(track.groupId) !== -1;
            });
            if (audioTracks.length) {
                // Disable selectDefaultTrack if there are no default tracks
                if (this.selectDefaultTrack &&
                    !audioTracks.some(function (track) { return track.default; })) {
                    this.selectDefaultTrack = false;
                }
                // track.id should match hls.audioTracks index
                audioTracks.forEach(function (track, i) {
                    track.id = i;
                });
            }
            else if (!currentTrack && !this.tracksInGroup.length) {
                // Do not dispatch AUDIO_TRACKS_UPDATED when there were and are no tracks
                return;
            }
            this.tracksInGroup = audioTracks;
            // Find preferred track
            var audioPreference = this.hls.config.audioPreference;
            if (!currentTrack && audioPreference) {
                var groupIndex = (0, rendition_helper_1.findMatchingOption)(audioPreference, audioTracks, rendition_helper_1.audioMatchPredicate);
                if (groupIndex > -1) {
                    currentTrack = audioTracks[groupIndex];
                }
                else {
                    var allIndex = (0, rendition_helper_1.findMatchingOption)(audioPreference, this.tracks);
                    currentTrack = this.tracks[allIndex];
                }
            }
            // Select initial track
            var trackId = this.findTrackId(currentTrack);
            if (trackId === -1 && currentTrack) {
                trackId = this.findTrackId(null);
            }
            // Dispatch events and load track if needed
            var audioTracksUpdated = { audioTracks: audioTracks };
            this.log("Updating audio tracks, ".concat(audioTracks.length, " track(s) found in group(s): ").concat(audioGroups === null || audioGroups === void 0 ? void 0 : audioGroups.join(',')));
            this.hls.trigger(events_1.Events.AUDIO_TRACKS_UPDATED, audioTracksUpdated);
            var selectedTrackId = this.trackId;
            if (trackId !== -1 && selectedTrackId === -1) {
                this.setAudioTrack(trackId);
            }
            else if (audioTracks.length && selectedTrackId === -1) {
                var error = new Error("No audio track selected for current audio group-ID(s): ".concat((_a = this.groupIds) === null || _a === void 0 ? void 0 : _a.join(','), " track count: ").concat(audioTracks.length));
                this.warn(error.message);
                this.hls.trigger(events_1.Events.ERROR, {
                    type: errors_1.ErrorTypes.MEDIA_ERROR,
                    details: errors_1.ErrorDetails.AUDIO_TRACK_LOAD_ERROR,
                    fatal: true,
                    error: error,
                });
            }
        }
        else if (this.shouldReloadPlaylist(currentTrack)) {
            // Retry playlist loading if no playlist is or has been loaded yet
            this.setAudioTrack(this.trackId);
        }
    };
    AudioTrackController.prototype.onError = function (event, data) {
        if (data.fatal || !data.context) {
            return;
        }
        if (data.context.type === loader_1.PlaylistContextType.AUDIO_TRACK &&
            data.context.id === this.trackId &&
            (!this.groupIds || this.groupIds.indexOf(data.context.groupId) !== -1)) {
            this.requestScheduled = -1;
            this.checkRetry(data);
        }
    };
    Object.defineProperty(AudioTrackController.prototype, "allAudioTracks", {
        get: function () {
            return this.tracks;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AudioTrackController.prototype, "audioTracks", {
        get: function () {
            return this.tracksInGroup;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AudioTrackController.prototype, "audioTrack", {
        get: function () {
            return this.trackId;
        },
        set: function (newId) {
            // If audio track is selected from API then don't choose from the manifest default track
            this.selectDefaultTrack = false;
            this.setAudioTrack(newId);
        },
        enumerable: false,
        configurable: true
    });
    AudioTrackController.prototype.setAudioOption = function (audioOption) {
        var hls = this.hls;
        hls.config.audioPreference = audioOption;
        if (audioOption) {
            var allAudioTracks = this.allAudioTracks;
            this.selectDefaultTrack = false;
            if (allAudioTracks.length) {
                // First see if current option matches (no switch op)
                var currentTrack = this.currentTrack;
                if (currentTrack &&
                    (0, rendition_helper_1.matchesOption)(audioOption, currentTrack, rendition_helper_1.audioMatchPredicate)) {
                    return currentTrack;
                }
                // Find option in available tracks (tracksInGroup)
                var groupIndex = (0, rendition_helper_1.findMatchingOption)(audioOption, this.tracksInGroup, rendition_helper_1.audioMatchPredicate);
                if (groupIndex > -1) {
                    var track = this.tracksInGroup[groupIndex];
                    this.setAudioTrack(groupIndex);
                    return track;
                }
                else if (currentTrack) {
                    // Find option in nearest level audio group
                    var searchIndex = hls.loadLevel;
                    if (searchIndex === -1) {
                        searchIndex = hls.firstAutoLevel;
                    }
                    var switchIndex = (0, rendition_helper_1.findClosestLevelWithAudioGroup)(audioOption, hls.levels, allAudioTracks, searchIndex, rendition_helper_1.audioMatchPredicate);
                    if (switchIndex === -1) {
                        // could not find matching variant
                        return null;
                    }
                    // and switch level to acheive the audio group switch
                    hls.nextLoadLevel = switchIndex;
                }
                if (audioOption.channels || audioOption.audioCodec) {
                    // Could not find a match with codec / channels predicate
                    // Find a match without channels or codec
                    var withoutCodecAndChannelsMatch = (0, rendition_helper_1.findMatchingOption)(audioOption, allAudioTracks);
                    if (withoutCodecAndChannelsMatch > -1) {
                        return allAudioTracks[withoutCodecAndChannelsMatch];
                    }
                }
            }
        }
        return null;
    };
    AudioTrackController.prototype.setAudioTrack = function (newId) {
        var tracks = this.tracksInGroup;
        // check if level idx is valid
        if (newId < 0 || newId >= tracks.length) {
            this.warn("Invalid audio track id: ".concat(newId));
            return;
        }
        // stopping live reloading timer if any
        this.clearTimer();
        this.selectDefaultTrack = false;
        var lastTrack = this.currentTrack;
        var track = tracks[newId];
        var trackLoaded = track.details && !track.details.live;
        if (newId === this.trackId && track === lastTrack && trackLoaded) {
            return;
        }
        this.log("Switching to audio-track ".concat(newId, " \"").concat(track.name, "\" lang:").concat(track.lang, " group:").concat(track.groupId, " channels:").concat(track.channels));
        this.trackId = newId;
        this.currentTrack = track;
        this.hls.trigger(events_1.Events.AUDIO_TRACK_SWITCHING, __assign({}, track));
        // Do not reload track unless live
        if (trackLoaded) {
            return;
        }
        var hlsUrlParameters = this.switchParams(track.url, lastTrack === null || lastTrack === void 0 ? void 0 : lastTrack.details, track.details);
        this.loadPlaylist(hlsUrlParameters);
    };
    AudioTrackController.prototype.findTrackId = function (currentTrack) {
        var audioTracks = this.tracksInGroup;
        for (var i = 0; i < audioTracks.length; i++) {
            var track = audioTracks[i];
            if (this.selectDefaultTrack && !track.default) {
                continue;
            }
            if (!currentTrack ||
                (0, rendition_helper_1.matchesOption)(currentTrack, track, rendition_helper_1.audioMatchPredicate)) {
                return i;
            }
        }
        if (currentTrack) {
            var name_1 = currentTrack.name, lang = currentTrack.lang, assocLang = currentTrack.assocLang, characteristics = currentTrack.characteristics, audioCodec = currentTrack.audioCodec, channels = currentTrack.channels;
            for (var i = 0; i < audioTracks.length; i++) {
                var track = audioTracks[i];
                if ((0, rendition_helper_1.matchesOption)({ name: name_1, lang: lang, assocLang: assocLang, characteristics: characteristics, audioCodec: audioCodec, channels: channels }, track, rendition_helper_1.audioMatchPredicate)) {
                    return i;
                }
            }
            for (var i = 0; i < audioTracks.length; i++) {
                var track = audioTracks[i];
                if ((0, media_option_attributes_1.mediaAttributesIdentical)(currentTrack.attrs, track.attrs, [
                    'LANGUAGE',
                    'ASSOC-LANGUAGE',
                    'CHARACTERISTICS',
                ])) {
                    return i;
                }
            }
            for (var i = 0; i < audioTracks.length; i++) {
                var track = audioTracks[i];
                if ((0, media_option_attributes_1.mediaAttributesIdentical)(currentTrack.attrs, track.attrs, [
                    'LANGUAGE',
                ])) {
                    return i;
                }
            }
        }
        return -1;
    };
    AudioTrackController.prototype.loadPlaylist = function (hlsUrlParameters) {
        var audioTrack = this.currentTrack;
        if (this.shouldLoadPlaylist(audioTrack) && audioTrack) {
            _super.prototype.loadPlaylist.call(this);
            var id = audioTrack.id;
            var groupId = audioTrack.groupId;
            var url = audioTrack.url;
            if (hlsUrlParameters) {
                try {
                    url = hlsUrlParameters.addDirectives(url);
                }
                catch (error) {
                    this.warn("Could not construct new URL with HLS Delivery Directives: ".concat(error));
                }
            }
            // track not retrieved yet, or live playlist we need to (re)load it
            this.log("loading audio-track playlist ".concat(id, " \"").concat(audioTrack.name, "\" lang:").concat(audioTrack.lang, " group:").concat(groupId));
            this.clearTimer();
            this.hls.trigger(events_1.Events.AUDIO_TRACK_LOADING, {
                url: url,
                id: id,
                groupId: groupId,
                deliveryDirectives: hlsUrlParameters || null,
            });
        }
    };
    return AudioTrackController;
}(base_playlist_controller_1.default));
exports.default = AudioTrackController;
