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
exports.SubtitleStreamController = void 0;
var events_1 = require("../events");
var buffer_helper_1 = require("../utils/buffer-helper");
var fragment_finders_1 = require("./fragment-finders");
var discontinuities_1 = require("../utils/discontinuities");
var level_helper_1 = require("../utils/level-helper");
var fragment_tracker_1 = require("./fragment-tracker");
var base_stream_controller_1 = require("./base-stream-controller");
var loader_1 = require("../types/loader");
var level_1 = require("../types/level");
var media_option_attributes_1 = require("../utils/media-option-attributes");
var errors_1 = require("../errors");
var TICK_INTERVAL = 500; // how often to tick in ms
var SubtitleStreamController = /** @class */ (function (_super) {
    __extends(SubtitleStreamController, _super);
    function SubtitleStreamController(hls, fragmentTracker, keyLoader) {
        var _this = _super.call(this, hls, fragmentTracker, keyLoader, '[subtitle-stream-controller]', loader_1.PlaylistLevelType.SUBTITLE) || this;
        _this.currentTrackId = -1;
        _this.tracksBuffered = [];
        _this.mainDetails = null;
        _this._registerListeners();
        return _this;
    }
    SubtitleStreamController.prototype.onHandlerDestroying = function () {
        this._unregisterListeners();
        _super.prototype.onHandlerDestroying.call(this);
        this.mainDetails = null;
    };
    SubtitleStreamController.prototype._registerListeners = function () {
        var hls = this.hls;
        hls.on(events_1.Events.MEDIA_ATTACHED, this.onMediaAttached, this);
        hls.on(events_1.Events.MEDIA_DETACHING, this.onMediaDetaching, this);
        hls.on(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.on(events_1.Events.LEVEL_LOADED, this.onLevelLoaded, this);
        hls.on(events_1.Events.ERROR, this.onError, this);
        hls.on(events_1.Events.SUBTITLE_TRACKS_UPDATED, this.onSubtitleTracksUpdated, this);
        hls.on(events_1.Events.SUBTITLE_TRACK_SWITCH, this.onSubtitleTrackSwitch, this);
        hls.on(events_1.Events.SUBTITLE_TRACK_LOADED, this.onSubtitleTrackLoaded, this);
        hls.on(events_1.Events.SUBTITLE_FRAG_PROCESSED, this.onSubtitleFragProcessed, this);
        hls.on(events_1.Events.BUFFER_FLUSHING, this.onBufferFlushing, this);
        hls.on(events_1.Events.FRAG_BUFFERED, this.onFragBuffered, this);
    };
    SubtitleStreamController.prototype._unregisterListeners = function () {
        var hls = this.hls;
        hls.off(events_1.Events.MEDIA_ATTACHED, this.onMediaAttached, this);
        hls.off(events_1.Events.MEDIA_DETACHING, this.onMediaDetaching, this);
        hls.off(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.off(events_1.Events.LEVEL_LOADED, this.onLevelLoaded, this);
        hls.off(events_1.Events.ERROR, this.onError, this);
        hls.off(events_1.Events.SUBTITLE_TRACKS_UPDATED, this.onSubtitleTracksUpdated, this);
        hls.off(events_1.Events.SUBTITLE_TRACK_SWITCH, this.onSubtitleTrackSwitch, this);
        hls.off(events_1.Events.SUBTITLE_TRACK_LOADED, this.onSubtitleTrackLoaded, this);
        hls.off(events_1.Events.SUBTITLE_FRAG_PROCESSED, this.onSubtitleFragProcessed, this);
        hls.off(events_1.Events.BUFFER_FLUSHING, this.onBufferFlushing, this);
        hls.off(events_1.Events.FRAG_BUFFERED, this.onFragBuffered, this);
    };
    SubtitleStreamController.prototype.startLoad = function (startPosition) {
        this.stopLoad();
        this.state = base_stream_controller_1.State.IDLE;
        this.setInterval(TICK_INTERVAL);
        this.nextLoadPosition =
            this.startPosition =
                this.lastCurrentTime =
                    startPosition;
        this.tick();
    };
    SubtitleStreamController.prototype.onManifestLoading = function () {
        this.mainDetails = null;
        this.fragmentTracker.removeAllFragments();
    };
    SubtitleStreamController.prototype.onMediaDetaching = function () {
        this.tracksBuffered = [];
        _super.prototype.onMediaDetaching.call(this);
    };
    SubtitleStreamController.prototype.onLevelLoaded = function (event, data) {
        this.mainDetails = data.details;
    };
    SubtitleStreamController.prototype.onSubtitleFragProcessed = function (event, data) {
        var frag = data.frag, success = data.success;
        this.fragPrevious = frag;
        this.state = base_stream_controller_1.State.IDLE;
        if (!success) {
            return;
        }
        var buffered = this.tracksBuffered[this.currentTrackId];
        if (!buffered) {
            return;
        }
        // Create/update a buffered array matching the interface used by BufferHelper.bufferedInfo
        // so we can re-use the logic used to detect how much has been buffered
        var timeRange;
        var fragStart = frag.start;
        for (var i = 0; i < buffered.length; i++) {
            if (fragStart >= buffered[i].start && fragStart <= buffered[i].end) {
                timeRange = buffered[i];
                break;
            }
        }
        var fragEnd = frag.start + frag.duration;
        if (timeRange) {
            timeRange.end = fragEnd;
        }
        else {
            timeRange = {
                start: fragStart,
                end: fragEnd,
            };
            buffered.push(timeRange);
        }
        this.fragmentTracker.fragBuffered(frag);
        this.fragBufferedComplete(frag, null);
    };
    SubtitleStreamController.prototype.onBufferFlushing = function (event, data) {
        var startOffset = data.startOffset, endOffset = data.endOffset;
        if (startOffset === 0 && endOffset !== Number.POSITIVE_INFINITY) {
            var endOffsetSubtitles_1 = endOffset - 1;
            if (endOffsetSubtitles_1 <= 0) {
                return;
            }
            data.endOffsetSubtitles = Math.max(0, endOffsetSubtitles_1);
            this.tracksBuffered.forEach(function (buffered) {
                for (var i = 0; i < buffered.length;) {
                    if (buffered[i].end <= endOffsetSubtitles_1) {
                        buffered.shift();
                        continue;
                    }
                    else if (buffered[i].start < endOffsetSubtitles_1) {
                        buffered[i].start = endOffsetSubtitles_1;
                    }
                    else {
                        break;
                    }
                    i++;
                }
            });
            this.fragmentTracker.removeFragmentsInRange(startOffset, endOffsetSubtitles_1, loader_1.PlaylistLevelType.SUBTITLE);
        }
    };
    SubtitleStreamController.prototype.onFragBuffered = function (event, data) {
        var _a;
        if (!this.loadedmetadata && data.frag.type === loader_1.PlaylistLevelType.MAIN) {
            if ((_a = this.media) === null || _a === void 0 ? void 0 : _a.buffered.length) {
                this.loadedmetadata = true;
            }
        }
    };
    // If something goes wrong, proceed to next frag, if we were processing one.
    SubtitleStreamController.prototype.onError = function (event, data) {
        var frag = data.frag;
        if ((frag === null || frag === void 0 ? void 0 : frag.type) === loader_1.PlaylistLevelType.SUBTITLE) {
            if (data.details === errors_1.ErrorDetails.FRAG_GAP) {
                this.fragmentTracker.fragBuffered(frag, true);
            }
            if (this.fragCurrent) {
                this.fragCurrent.abortRequests();
            }
            if (this.state !== base_stream_controller_1.State.STOPPED) {
                this.state = base_stream_controller_1.State.IDLE;
            }
        }
    };
    // Got all new subtitle levels.
    SubtitleStreamController.prototype.onSubtitleTracksUpdated = function (event, _a) {
        var _this = this;
        var subtitleTracks = _a.subtitleTracks;
        if (this.levels && (0, media_option_attributes_1.subtitleOptionsIdentical)(this.levels, subtitleTracks)) {
            this.levels = subtitleTracks.map(function (mediaPlaylist) { return new level_1.Level(mediaPlaylist); });
            return;
        }
        this.tracksBuffered = [];
        this.levels = subtitleTracks.map(function (mediaPlaylist) {
            var level = new level_1.Level(mediaPlaylist);
            _this.tracksBuffered[level.id] = [];
            return level;
        });
        this.fragmentTracker.removeFragmentsInRange(0, Number.POSITIVE_INFINITY, loader_1.PlaylistLevelType.SUBTITLE);
        this.fragPrevious = null;
        this.mediaBuffer = null;
    };
    SubtitleStreamController.prototype.onSubtitleTrackSwitch = function (event, data) {
        var _a;
        this.currentTrackId = data.id;
        if (!((_a = this.levels) === null || _a === void 0 ? void 0 : _a.length) || this.currentTrackId === -1) {
            this.clearInterval();
            return;
        }
        // Check if track has the necessary details to load fragments
        var currentTrack = this.levels[this.currentTrackId];
        if (currentTrack === null || currentTrack === void 0 ? void 0 : currentTrack.details) {
            this.mediaBuffer = this.mediaBufferTimeRanges;
        }
        else {
            this.mediaBuffer = null;
        }
        if (currentTrack) {
            this.setInterval(TICK_INTERVAL);
        }
    };
    // Got a new set of subtitle fragments.
    SubtitleStreamController.prototype.onSubtitleTrackLoaded = function (event, data) {
        var _a, _b;
        var _c = this, currentTrackId = _c.currentTrackId, levels = _c.levels;
        var newDetails = data.details, trackId = data.id;
        if (!levels) {
            this.warn("Subtitle tracks were reset while loading level ".concat(trackId));
            return;
        }
        var track = levels[trackId];
        if (trackId >= levels.length || !track) {
            return;
        }
        this.log("Subtitle track ".concat(trackId, " loaded [").concat(newDetails.startSN, ",").concat(newDetails.endSN, "]").concat(newDetails.lastPartSn
            ? "[part-".concat(newDetails.lastPartSn, "-").concat(newDetails.lastPartIndex, "]")
            : '', ",duration:").concat(newDetails.totalduration));
        this.mediaBuffer = this.mediaBufferTimeRanges;
        var sliding = 0;
        if (newDetails.live || ((_a = track.details) === null || _a === void 0 ? void 0 : _a.live)) {
            var mainDetails = this.mainDetails;
            if (newDetails.deltaUpdateFailed || !mainDetails) {
                return;
            }
            var mainSlidingStartFragment = mainDetails.fragments[0];
            if (!track.details) {
                if (newDetails.hasProgramDateTime && mainDetails.hasProgramDateTime) {
                    (0, discontinuities_1.alignMediaPlaylistByPDT)(newDetails, mainDetails);
                    sliding = newDetails.fragments[0].start;
                }
                else if (mainSlidingStartFragment) {
                    // line up live playlist with main so that fragments in range are loaded
                    sliding = mainSlidingStartFragment.start;
                    (0, level_helper_1.addSliding)(newDetails, sliding);
                }
            }
            else {
                sliding = this.alignPlaylists(newDetails, track.details, (_b = this.levelLastLoaded) === null || _b === void 0 ? void 0 : _b.details);
                if (sliding === 0 && mainSlidingStartFragment) {
                    // realign with main when there is no overlap with last refresh
                    sliding = mainSlidingStartFragment.start;
                    (0, level_helper_1.addSliding)(newDetails, sliding);
                }
            }
        }
        track.details = newDetails;
        this.levelLastLoaded = track;
        if (trackId !== currentTrackId) {
            return;
        }
        if (!this.startFragRequested && (this.mainDetails || !newDetails.live)) {
            this.setStartPosition(this.mainDetails || newDetails, sliding);
        }
        // trigger handler right now
        this.tick();
        // If playlist is misaligned because of bad PDT or drift, delete details to resync with main on reload
        if (newDetails.live &&
            !this.fragCurrent &&
            this.media &&
            this.state === base_stream_controller_1.State.IDLE) {
            var foundFrag = (0, fragment_finders_1.findFragmentByPTS)(null, newDetails.fragments, this.media.currentTime, 0);
            if (!foundFrag) {
                this.warn('Subtitle playlist not aligned with playback');
                track.details = undefined;
            }
        }
    };
    SubtitleStreamController.prototype._handleFragmentLoadComplete = function (fragLoadedData) {
        var _this = this;
        var frag = fragLoadedData.frag, payload = fragLoadedData.payload;
        var decryptData = frag.decryptdata;
        var hls = this.hls;
        if (this.fragContextChanged(frag)) {
            return;
        }
        // check to see if the payload needs to be decrypted
        if (payload &&
            payload.byteLength > 0 &&
            (decryptData === null || decryptData === void 0 ? void 0 : decryptData.key) &&
            decryptData.iv &&
            decryptData.method === 'AES-128') {
            var startTime_1 = performance.now();
            // decrypt the subtitles
            this.decrypter
                .decrypt(new Uint8Array(payload), decryptData.key.buffer, decryptData.iv.buffer)
                .catch(function (err) {
                hls.trigger(events_1.Events.ERROR, {
                    type: errors_1.ErrorTypes.MEDIA_ERROR,
                    details: errors_1.ErrorDetails.FRAG_DECRYPT_ERROR,
                    fatal: false,
                    error: err,
                    reason: err.message,
                    frag: frag,
                });
                throw err;
            })
                .then(function (decryptedData) {
                var endTime = performance.now();
                hls.trigger(events_1.Events.FRAG_DECRYPTED, {
                    frag: frag,
                    payload: decryptedData,
                    stats: {
                        tstart: startTime_1,
                        tdecrypt: endTime,
                    },
                });
            })
                .catch(function (err) {
                _this.warn("".concat(err.name, ": ").concat(err.message));
                _this.state = base_stream_controller_1.State.IDLE;
            });
        }
    };
    SubtitleStreamController.prototype.doTick = function () {
        if (!this.media) {
            this.state = base_stream_controller_1.State.IDLE;
            return;
        }
        if (this.state === base_stream_controller_1.State.IDLE) {
            var _a = this, currentTrackId = _a.currentTrackId, levels = _a.levels;
            var track = levels === null || levels === void 0 ? void 0 : levels[currentTrackId];
            if (!track || !levels.length || !track.details) {
                return;
            }
            var config = this.config;
            var currentTime = this.getLoadPosition();
            var bufferedInfo = buffer_helper_1.BufferHelper.bufferedInfo(this.tracksBuffered[this.currentTrackId] || [], currentTime, config.maxBufferHole);
            var targetBufferTime = bufferedInfo.end, bufferLen = bufferedInfo.len;
            var mainBufferInfo = this.getFwdBufferInfo(this.media, loader_1.PlaylistLevelType.MAIN);
            var trackDetails = track.details;
            var maxBufLen = this.getMaxBufferLength(mainBufferInfo === null || mainBufferInfo === void 0 ? void 0 : mainBufferInfo.len) +
                trackDetails.levelTargetDuration;
            if (bufferLen > maxBufLen) {
                return;
            }
            var fragments = trackDetails.fragments;
            var fragLen = fragments.length;
            var end = trackDetails.edge;
            var foundFrag = null;
            var fragPrevious = this.fragPrevious;
            if (targetBufferTime < end) {
                var tolerance = config.maxFragLookUpTolerance;
                var lookupTolerance = targetBufferTime > end - tolerance ? 0 : tolerance;
                foundFrag = (0, fragment_finders_1.findFragmentByPTS)(fragPrevious, fragments, Math.max(fragments[0].start, targetBufferTime), lookupTolerance);
                if (!foundFrag &&
                    fragPrevious &&
                    fragPrevious.start < fragments[0].start) {
                    foundFrag = fragments[0];
                }
            }
            else {
                foundFrag = fragments[fragLen - 1];
            }
            if (!foundFrag) {
                return;
            }
            foundFrag = this.mapToInitFragWhenRequired(foundFrag);
            if (foundFrag.sn !== 'initSegment') {
                // Load earlier fragment in same discontinuity to make up for misaligned playlists and cues that extend beyond end of segment
                var curSNIdx = foundFrag.sn - trackDetails.startSN;
                var prevFrag = fragments[curSNIdx - 1];
                if (prevFrag &&
                    prevFrag.cc === foundFrag.cc &&
                    this.fragmentTracker.getState(prevFrag) === fragment_tracker_1.FragmentState.NOT_LOADED) {
                    foundFrag = prevFrag;
                }
            }
            if (this.fragmentTracker.getState(foundFrag) === fragment_tracker_1.FragmentState.NOT_LOADED) {
                // only load if fragment is not loaded
                this.loadFragment(foundFrag, track, targetBufferTime);
            }
        }
    };
    SubtitleStreamController.prototype.getMaxBufferLength = function (mainBufferLength) {
        var maxConfigBuffer = _super.prototype.getMaxBufferLength.call(this);
        if (!mainBufferLength) {
            return maxConfigBuffer;
        }
        return Math.max(maxConfigBuffer, mainBufferLength);
    };
    SubtitleStreamController.prototype.loadFragment = function (frag, level, targetBufferTime) {
        this.fragCurrent = frag;
        if (frag.sn === 'initSegment') {
            this._loadInitSegment(frag, level);
        }
        else {
            this.startFragRequested = true;
            _super.prototype.loadFragment.call(this, frag, level, targetBufferTime);
        }
    };
    Object.defineProperty(SubtitleStreamController.prototype, "mediaBufferTimeRanges", {
        get: function () {
            return new BufferableInstance(this.tracksBuffered[this.currentTrackId] || []);
        },
        enumerable: false,
        configurable: true
    });
    return SubtitleStreamController;
}(base_stream_controller_1.default));
exports.SubtitleStreamController = SubtitleStreamController;
var BufferableInstance = /** @class */ (function () {
    function BufferableInstance(timeranges) {
        var getRange = function (name, index, length) {
            index = index >>> 0;
            if (index > length - 1) {
                throw new DOMException("Failed to execute '".concat(name, "' on 'TimeRanges': The index provided (").concat(index, ") is greater than the maximum bound (").concat(length, ")"));
            }
            return timeranges[index][name];
        };
        this.buffered = {
            get length() {
                return timeranges.length;
            },
            end: function (index) {
                return getRange('end', index, timeranges.length);
            },
            start: function (index) {
                return getRange('start', index, timeranges.length);
            },
        };
    }
    return BufferableInstance;
}());
