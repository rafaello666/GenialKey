"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimelineController = void 0;
var events_1 = require("../events");
var cea_608_parser_1 = require("../utils/cea-608-parser");
var output_filter_1 = require("../utils/output-filter");
var webvtt_parser_1 = require("../utils/webvtt-parser");
var texttrack_utils_1 = require("../utils/texttrack-utils");
var media_option_attributes_1 = require("../utils/media-option-attributes");
var imsc1_ttml_parser_1 = require("../utils/imsc1-ttml-parser");
var mp4_tools_1 = require("../utils/mp4-tools");
var loader_1 = require("../types/loader");
var logger_1 = require("../utils/logger");
var TimelineController = /** @class */ (function () {
    function TimelineController(hls) {
        this.media = null;
        this.enabled = true;
        this.textTracks = [];
        this.tracks = [];
        this.initPTS = [];
        this.unparsedVttFrags = [];
        this.captionsTracks = {};
        this.nonNativeCaptionsTracks = {};
        this.lastCc = -1; // Last video (CEA-608) fragment CC
        this.lastSn = -1; // Last video (CEA-608) fragment MSN
        this.lastPartIndex = -1; // Last video (CEA-608) fragment Part Index
        this.prevCC = -1; // Last subtitle fragment CC
        this.vttCCs = newVTTCCs();
        this.hls = hls;
        this.config = hls.config;
        this.Cues = hls.config.cueHandler;
        this.captionsProperties = {
            textTrack1: {
                label: this.config.captionsTextTrack1Label,
                languageCode: this.config.captionsTextTrack1LanguageCode,
            },
            textTrack2: {
                label: this.config.captionsTextTrack2Label,
                languageCode: this.config.captionsTextTrack2LanguageCode,
            },
            textTrack3: {
                label: this.config.captionsTextTrack3Label,
                languageCode: this.config.captionsTextTrack3LanguageCode,
            },
            textTrack4: {
                label: this.config.captionsTextTrack4Label,
                languageCode: this.config.captionsTextTrack4LanguageCode,
            },
        };
        hls.on(events_1.Events.MEDIA_ATTACHING, this.onMediaAttaching, this);
        hls.on(events_1.Events.MEDIA_DETACHING, this.onMediaDetaching, this);
        hls.on(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.on(events_1.Events.MANIFEST_LOADED, this.onManifestLoaded, this);
        hls.on(events_1.Events.SUBTITLE_TRACKS_UPDATED, this.onSubtitleTracksUpdated, this);
        hls.on(events_1.Events.FRAG_LOADING, this.onFragLoading, this);
        hls.on(events_1.Events.FRAG_LOADED, this.onFragLoaded, this);
        hls.on(events_1.Events.FRAG_PARSING_USERDATA, this.onFragParsingUserdata, this);
        hls.on(events_1.Events.FRAG_DECRYPTED, this.onFragDecrypted, this);
        hls.on(events_1.Events.INIT_PTS_FOUND, this.onInitPtsFound, this);
        hls.on(events_1.Events.SUBTITLE_TRACKS_CLEARED, this.onSubtitleTracksCleared, this);
        hls.on(events_1.Events.BUFFER_FLUSHING, this.onBufferFlushing, this);
    }
    TimelineController.prototype.destroy = function () {
        var hls = this.hls;
        hls.off(events_1.Events.MEDIA_ATTACHING, this.onMediaAttaching, this);
        hls.off(events_1.Events.MEDIA_DETACHING, this.onMediaDetaching, this);
        hls.off(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.off(events_1.Events.MANIFEST_LOADED, this.onManifestLoaded, this);
        hls.off(events_1.Events.SUBTITLE_TRACKS_UPDATED, this.onSubtitleTracksUpdated, this);
        hls.off(events_1.Events.FRAG_LOADING, this.onFragLoading, this);
        hls.off(events_1.Events.FRAG_LOADED, this.onFragLoaded, this);
        hls.off(events_1.Events.FRAG_PARSING_USERDATA, this.onFragParsingUserdata, this);
        hls.off(events_1.Events.FRAG_DECRYPTED, this.onFragDecrypted, this);
        hls.off(events_1.Events.INIT_PTS_FOUND, this.onInitPtsFound, this);
        hls.off(events_1.Events.SUBTITLE_TRACKS_CLEARED, this.onSubtitleTracksCleared, this);
        hls.off(events_1.Events.BUFFER_FLUSHING, this.onBufferFlushing, this);
        // @ts-ignore
        this.hls = this.config = null;
        this.cea608Parser1 = this.cea608Parser2 = undefined;
    };
    TimelineController.prototype.initCea608Parsers = function () {
        if (this.config.enableCEA708Captions &&
            (!this.cea608Parser1 || !this.cea608Parser2)) {
            var channel1 = new output_filter_1.default(this, 'textTrack1');
            var channel2 = new output_filter_1.default(this, 'textTrack2');
            var channel3 = new output_filter_1.default(this, 'textTrack3');
            var channel4 = new output_filter_1.default(this, 'textTrack4');
            this.cea608Parser1 = new cea_608_parser_1.default(1, channel1, channel2);
            this.cea608Parser2 = new cea_608_parser_1.default(3, channel3, channel4);
        }
    };
    TimelineController.prototype.addCues = function (trackName, startTime, endTime, screen, cueRanges) {
        // skip cues which overlap more than 50% with previously parsed time ranges
        var merged = false;
        for (var i = cueRanges.length; i--;) {
            var cueRange = cueRanges[i];
            var overlap = intersection(cueRange[0], cueRange[1], startTime, endTime);
            if (overlap >= 0) {
                cueRange[0] = Math.min(cueRange[0], startTime);
                cueRange[1] = Math.max(cueRange[1], endTime);
                merged = true;
                if (overlap / (endTime - startTime) > 0.5) {
                    return;
                }
            }
        }
        if (!merged) {
            cueRanges.push([startTime, endTime]);
        }
        if (this.config.renderTextTracksNatively) {
            var track = this.captionsTracks[trackName];
            this.Cues.newCue(track, startTime, endTime, screen);
        }
        else {
            var cues = this.Cues.newCue(null, startTime, endTime, screen);
            this.hls.trigger(events_1.Events.CUES_PARSED, {
                type: 'captions',
                cues: cues,
                track: trackName,
            });
        }
    };
    // Triggered when an initial PTS is found; used for synchronisation of WebVTT.
    TimelineController.prototype.onInitPtsFound = function (event, _a) {
        var _this = this;
        var frag = _a.frag, id = _a.id, initPTS = _a.initPTS, timescale = _a.timescale;
        var unparsedVttFrags = this.unparsedVttFrags;
        if (id === 'main') {
            this.initPTS[frag.cc] = { baseTime: initPTS, timescale: timescale };
        }
        // Due to asynchronous processing, initial PTS may arrive later than the first VTT fragments are loaded.
        // Parse any unparsed fragments upon receiving the initial PTS.
        if (unparsedVttFrags.length) {
            this.unparsedVttFrags = [];
            unparsedVttFrags.forEach(function (frag) {
                _this.onFragLoaded(events_1.Events.FRAG_LOADED, frag);
            });
        }
    };
    TimelineController.prototype.getExistingTrack = function (label, language) {
        var media = this.media;
        if (media) {
            for (var i = 0; i < media.textTracks.length; i++) {
                var textTrack = media.textTracks[i];
                if (canReuseVttTextTrack(textTrack, {
                    name: label,
                    lang: language,
                    attrs: {},
                })) {
                    return textTrack;
                }
            }
        }
        return null;
    };
    TimelineController.prototype.createCaptionsTrack = function (trackName) {
        if (this.config.renderTextTracksNatively) {
            this.createNativeTrack(trackName);
        }
        else {
            this.createNonNativeTrack(trackName);
        }
    };
    TimelineController.prototype.createNativeTrack = function (trackName) {
        if (this.captionsTracks[trackName]) {
            return;
        }
        var _a = this, captionsProperties = _a.captionsProperties, captionsTracks = _a.captionsTracks, media = _a.media;
        var _b = captionsProperties[trackName], label = _b.label, languageCode = _b.languageCode;
        // Enable reuse of existing text track.
        var existingTrack = this.getExistingTrack(label, languageCode);
        if (!existingTrack) {
            var textTrack = this.createTextTrack('captions', label, languageCode);
            if (textTrack) {
                // Set a special property on the track so we know it's managed by Hls.js
                textTrack[trackName] = true;
                captionsTracks[trackName] = textTrack;
            }
        }
        else {
            captionsTracks[trackName] = existingTrack;
            (0, texttrack_utils_1.clearCurrentCues)(captionsTracks[trackName]);
            (0, texttrack_utils_1.sendAddTrackEvent)(captionsTracks[trackName], media);
        }
    };
    TimelineController.prototype.createNonNativeTrack = function (trackName) {
        if (this.nonNativeCaptionsTracks[trackName]) {
            return;
        }
        // Create a list of a single track for the provider to consume
        var trackProperties = this.captionsProperties[trackName];
        if (!trackProperties) {
            return;
        }
        var label = trackProperties.label;
        var track = {
            _id: trackName,
            label: label,
            kind: 'captions',
            default: trackProperties.media ? !!trackProperties.media.default : false,
            closedCaptions: trackProperties.media,
        };
        this.nonNativeCaptionsTracks[trackName] = track;
        this.hls.trigger(events_1.Events.NON_NATIVE_TEXT_TRACKS_FOUND, { tracks: [track] });
    };
    TimelineController.prototype.createTextTrack = function (kind, label, lang) {
        var media = this.media;
        if (!media) {
            return;
        }
        return media.addTextTrack(kind, label, lang);
    };
    TimelineController.prototype.onMediaAttaching = function (event, data) {
        this.media = data.media;
        this._cleanTracks();
    };
    TimelineController.prototype.onMediaDetaching = function () {
        var captionsTracks = this.captionsTracks;
        Object.keys(captionsTracks).forEach(function (trackName) {
            (0, texttrack_utils_1.clearCurrentCues)(captionsTracks[trackName]);
            delete captionsTracks[trackName];
        });
        this.nonNativeCaptionsTracks = {};
    };
    TimelineController.prototype.onManifestLoading = function () {
        // Detect discontinuity in video fragment (CEA-608) parsing
        this.lastCc = -1;
        this.lastSn = -1;
        this.lastPartIndex = -1;
        // Detect discontinuity in subtitle manifests
        this.prevCC = -1;
        this.vttCCs = newVTTCCs();
        // Reset tracks
        this._cleanTracks();
        this.tracks = [];
        this.captionsTracks = {};
        this.nonNativeCaptionsTracks = {};
        this.textTracks = [];
        this.unparsedVttFrags = [];
        this.initPTS = [];
        if (this.cea608Parser1 && this.cea608Parser2) {
            this.cea608Parser1.reset();
            this.cea608Parser2.reset();
        }
    };
    TimelineController.prototype._cleanTracks = function () {
        // clear outdated subtitles
        var media = this.media;
        if (!media) {
            return;
        }
        var textTracks = media.textTracks;
        if (textTracks) {
            for (var i = 0; i < textTracks.length; i++) {
                (0, texttrack_utils_1.clearCurrentCues)(textTracks[i]);
            }
        }
    };
    TimelineController.prototype.onSubtitleTracksUpdated = function (event, data) {
        var _this = this;
        var tracks = data.subtitleTracks || [];
        var hasIMSC1 = tracks.some(function (track) { return track.textCodec === imsc1_ttml_parser_1.IMSC1_CODEC; });
        if (this.config.enableWebVTT || (hasIMSC1 && this.config.enableIMSC1)) {
            var listIsIdentical = (0, media_option_attributes_1.subtitleOptionsIdentical)(this.tracks, tracks);
            if (listIsIdentical) {
                this.tracks = tracks;
                return;
            }
            this.textTracks = [];
            this.tracks = tracks;
            if (this.config.renderTextTracksNatively) {
                var media = this.media;
                var inUseTracks_1 = media
                    ? (0, texttrack_utils_1.filterSubtitleTracks)(media.textTracks)
                    : null;
                this.tracks.forEach(function (track, index) {
                    // Reuse tracks with the same label and lang, but do not reuse 608/708 tracks
                    var textTrack;
                    if (inUseTracks_1) {
                        var inUseTrack = null;
                        for (var i = 0; i < inUseTracks_1.length; i++) {
                            if (inUseTracks_1[i] &&
                                canReuseVttTextTrack(inUseTracks_1[i], track)) {
                                inUseTrack = inUseTracks_1[i];
                                inUseTracks_1[i] = null;
                                break;
                            }
                        }
                        if (inUseTrack) {
                            textTrack = inUseTrack;
                        }
                    }
                    if (textTrack) {
                        (0, texttrack_utils_1.clearCurrentCues)(textTrack);
                    }
                    else {
                        var textTrackKind = captionsOrSubtitlesFromCharacteristics(track);
                        textTrack = _this.createTextTrack(textTrackKind, track.name, track.lang);
                        if (textTrack) {
                            textTrack.mode = 'disabled';
                        }
                    }
                    if (textTrack) {
                        _this.textTracks.push(textTrack);
                    }
                });
                // Warn when video element has captions or subtitle TextTracks carried over from another source
                if (inUseTracks_1 === null || inUseTracks_1 === void 0 ? void 0 : inUseTracks_1.length) {
                    var unusedTextTracks = inUseTracks_1
                        .filter(function (t) { return t !== null; })
                        .map(function (t) { return t.label; });
                    if (unusedTextTracks.length) {
                        logger_1.logger.warn("Media element contains unused subtitle tracks: ".concat(unusedTextTracks.join(', '), ". Replace media element for each source to clear TextTracks and captions menu."));
                    }
                }
            }
            else if (this.tracks.length) {
                // Create a list of tracks for the provider to consume
                var tracksList = this.tracks.map(function (track) {
                    return {
                        label: track.name,
                        kind: track.type.toLowerCase(),
                        default: track.default,
                        subtitleTrack: track,
                    };
                });
                this.hls.trigger(events_1.Events.NON_NATIVE_TEXT_TRACKS_FOUND, {
                    tracks: tracksList,
                });
            }
        }
    };
    TimelineController.prototype.onManifestLoaded = function (event, data) {
        var _this = this;
        if (this.config.enableCEA708Captions && data.captions) {
            data.captions.forEach(function (captionsTrack) {
                var instreamIdMatch = /(?:CC|SERVICE)([1-4])/.exec(captionsTrack.instreamId);
                if (!instreamIdMatch) {
                    return;
                }
                var trackName = "textTrack".concat(instreamIdMatch[1]);
                var trackProperties = _this.captionsProperties[trackName];
                if (!trackProperties) {
                    return;
                }
                trackProperties.label = captionsTrack.name;
                if (captionsTrack.lang) {
                    // optional attribute
                    trackProperties.languageCode = captionsTrack.lang;
                }
                trackProperties.media = captionsTrack;
            });
        }
    };
    TimelineController.prototype.closedCaptionsForLevel = function (frag) {
        var level = this.hls.levels[frag.level];
        return level === null || level === void 0 ? void 0 : level.attrs['CLOSED-CAPTIONS'];
    };
    TimelineController.prototype.onFragLoading = function (event, data) {
        var _a, _b;
        // if this frag isn't contiguous, clear the parser so cues with bad start/end times aren't added to the textTrack
        if (this.enabled && data.frag.type === loader_1.PlaylistLevelType.MAIN) {
            var _c = this, cea608Parser1 = _c.cea608Parser1, cea608Parser2 = _c.cea608Parser2, lastSn = _c.lastSn;
            var _d = data.frag, cc = _d.cc, sn = _d.sn;
            var partIndex = (_b = (_a = data.part) === null || _a === void 0 ? void 0 : _a.index) !== null && _b !== void 0 ? _b : -1;
            if (cea608Parser1 && cea608Parser2) {
                if (sn !== lastSn + 1 ||
                    (sn === lastSn && partIndex !== this.lastPartIndex + 1) ||
                    cc !== this.lastCc) {
                    cea608Parser1.reset();
                    cea608Parser2.reset();
                }
            }
            this.lastCc = cc;
            this.lastSn = sn;
            this.lastPartIndex = partIndex;
        }
    };
    TimelineController.prototype.onFragLoaded = function (event, data) {
        var frag = data.frag, payload = data.payload;
        if (frag.type === loader_1.PlaylistLevelType.SUBTITLE) {
            // If fragment is subtitle type, parse as WebVTT.
            if (payload.byteLength) {
                var decryptData = frag.decryptdata;
                // fragment after decryption has a stats object
                var decrypted = 'stats' in data;
                // If the subtitles are not encrypted, parse VTTs now. Otherwise, we need to wait.
                if (decryptData == null || !decryptData.encrypted || decrypted) {
                    var trackPlaylistMedia = this.tracks[frag.level];
                    var vttCCs = this.vttCCs;
                    if (!vttCCs[frag.cc]) {
                        vttCCs[frag.cc] = {
                            start: frag.start,
                            prevCC: this.prevCC,
                            new: true,
                        };
                        this.prevCC = frag.cc;
                    }
                    if (trackPlaylistMedia &&
                        trackPlaylistMedia.textCodec === imsc1_ttml_parser_1.IMSC1_CODEC) {
                        this._parseIMSC1(frag, payload);
                    }
                    else {
                        this._parseVTTs(data);
                    }
                }
            }
            else {
                // In case there is no payload, finish unsuccessfully.
                this.hls.trigger(events_1.Events.SUBTITLE_FRAG_PROCESSED, {
                    success: false,
                    frag: frag,
                    error: new Error('Empty subtitle payload'),
                });
            }
        }
    };
    TimelineController.prototype._parseIMSC1 = function (frag, payload) {
        var _this = this;
        var hls = this.hls;
        (0, imsc1_ttml_parser_1.parseIMSC1)(payload, this.initPTS[frag.cc], function (cues) {
            _this._appendCues(cues, frag.level);
            hls.trigger(events_1.Events.SUBTITLE_FRAG_PROCESSED, {
                success: true,
                frag: frag,
            });
        }, function (error) {
            logger_1.logger.log("Failed to parse IMSC1: ".concat(error));
            hls.trigger(events_1.Events.SUBTITLE_FRAG_PROCESSED, {
                success: false,
                frag: frag,
                error: error,
            });
        });
    };
    TimelineController.prototype._parseVTTs = function (data) {
        var _this = this;
        var _a;
        var frag = data.frag, payload = data.payload;
        // We need an initial synchronisation PTS. Store fragments as long as none has arrived
        var _b = this, initPTS = _b.initPTS, unparsedVttFrags = _b.unparsedVttFrags;
        var maxAvCC = initPTS.length - 1;
        if (!initPTS[frag.cc] && maxAvCC === -1) {
            unparsedVttFrags.push(data);
            return;
        }
        var hls = this.hls;
        // Parse the WebVTT file contents.
        var payloadWebVTT = ((_a = frag.initSegment) === null || _a === void 0 ? void 0 : _a.data)
            ? (0, mp4_tools_1.appendUint8Array)(frag.initSegment.data, new Uint8Array(payload))
            : payload;
        (0, webvtt_parser_1.parseWebVTT)(payloadWebVTT, this.initPTS[frag.cc], this.vttCCs, frag.cc, frag.start, function (cues) {
            _this._appendCues(cues, frag.level);
            hls.trigger(events_1.Events.SUBTITLE_FRAG_PROCESSED, {
                success: true,
                frag: frag,
            });
        }, function (error) {
            var missingInitPTS = error.message === 'Missing initPTS for VTT MPEGTS';
            if (missingInitPTS) {
                unparsedVttFrags.push(data);
            }
            else {
                _this._fallbackToIMSC1(frag, payload);
            }
            // Something went wrong while parsing. Trigger event with success false.
            logger_1.logger.log("Failed to parse VTT cue: ".concat(error));
            if (missingInitPTS && maxAvCC > frag.cc) {
                return;
            }
            hls.trigger(events_1.Events.SUBTITLE_FRAG_PROCESSED, {
                success: false,
                frag: frag,
                error: error,
            });
        });
    };
    TimelineController.prototype._fallbackToIMSC1 = function (frag, payload) {
        var _this = this;
        // If textCodec is unknown, try parsing as IMSC1. Set textCodec based on the result
        var trackPlaylistMedia = this.tracks[frag.level];
        if (!trackPlaylistMedia.textCodec) {
            (0, imsc1_ttml_parser_1.parseIMSC1)(payload, this.initPTS[frag.cc], function () {
                trackPlaylistMedia.textCodec = imsc1_ttml_parser_1.IMSC1_CODEC;
                _this._parseIMSC1(frag, payload);
            }, function () {
                trackPlaylistMedia.textCodec = 'wvtt';
            });
        }
    };
    TimelineController.prototype._appendCues = function (cues, fragLevel) {
        var hls = this.hls;
        if (this.config.renderTextTracksNatively) {
            var textTrack_1 = this.textTracks[fragLevel];
            // WebVTTParser.parse is an async method and if the currently selected text track mode is set to "disabled"
            // before parsing is done then don't try to access currentTrack.cues.getCueById as cues will be null
            // and trying to access getCueById method of cues will throw an exception
            // Because we check if the mode is disabled, we can force check `cues` below. They can't be null.
            if (!textTrack_1 || textTrack_1.mode === 'disabled') {
                return;
            }
            cues.forEach(function (cue) { return (0, texttrack_utils_1.addCueToTrack)(textTrack_1, cue); });
        }
        else {
            var currentTrack = this.tracks[fragLevel];
            if (!currentTrack) {
                return;
            }
            var track = currentTrack.default ? 'default' : 'subtitles' + fragLevel;
            hls.trigger(events_1.Events.CUES_PARSED, { type: 'subtitles', cues: cues, track: track });
        }
    };
    TimelineController.prototype.onFragDecrypted = function (event, data) {
        var frag = data.frag;
        if (frag.type === loader_1.PlaylistLevelType.SUBTITLE) {
            this.onFragLoaded(events_1.Events.FRAG_LOADED, data);
        }
    };
    TimelineController.prototype.onSubtitleTracksCleared = function () {
        this.tracks = [];
        this.captionsTracks = {};
    };
    TimelineController.prototype.onFragParsingUserdata = function (event, data) {
        this.initCea608Parsers();
        var _a = this, cea608Parser1 = _a.cea608Parser1, cea608Parser2 = _a.cea608Parser2;
        if (!this.enabled || !cea608Parser1 || !cea608Parser2) {
            return;
        }
        var frag = data.frag, samples = data.samples;
        if (frag.type === loader_1.PlaylistLevelType.MAIN &&
            this.closedCaptionsForLevel(frag) === 'NONE') {
            return;
        }
        // If the event contains captions (found in the bytes property), push all bytes into the parser immediately
        // It will create the proper timestamps based on the PTS value
        for (var i = 0; i < samples.length; i++) {
            var ccBytes = samples[i].bytes;
            if (ccBytes) {
                var ccdatas = this.extractCea608Data(ccBytes);
                cea608Parser1.addData(samples[i].pts, ccdatas[0]);
                cea608Parser2.addData(samples[i].pts, ccdatas[1]);
            }
        }
    };
    TimelineController.prototype.onBufferFlushing = function (event, _a) {
        var startOffset = _a.startOffset, endOffset = _a.endOffset, endOffsetSubtitles = _a.endOffsetSubtitles, type = _a.type;
        var media = this.media;
        if (!media || media.currentTime < endOffset) {
            return;
        }
        // Clear 608 caption cues from the captions TextTracks when the video back buffer is flushed
        // Forward cues are never removed because we can loose streamed 608 content from recent fragments
        if (!type || type === 'video') {
            var captionsTracks_1 = this.captionsTracks;
            Object.keys(captionsTracks_1).forEach(function (trackName) {
                return (0, texttrack_utils_1.removeCuesInRange)(captionsTracks_1[trackName], startOffset, endOffset);
            });
        }
        if (this.config.renderTextTracksNatively) {
            // Clear VTT/IMSC1 subtitle cues from the subtitle TextTracks when the back buffer is flushed
            if (startOffset === 0 && endOffsetSubtitles !== undefined) {
                var textTracks_1 = this.textTracks;
                Object.keys(textTracks_1).forEach(function (trackName) {
                    return (0, texttrack_utils_1.removeCuesInRange)(textTracks_1[trackName], startOffset, endOffsetSubtitles);
                });
            }
        }
    };
    TimelineController.prototype.extractCea608Data = function (byteArray) {
        var actualCCBytes = [[], []];
        var count = byteArray[0] & 0x1f;
        var position = 2;
        for (var j = 0; j < count; j++) {
            var tmpByte = byteArray[position++];
            var ccbyte1 = 0x7f & byteArray[position++];
            var ccbyte2 = 0x7f & byteArray[position++];
            if (ccbyte1 === 0 && ccbyte2 === 0) {
                continue;
            }
            var ccValid = (0x04 & tmpByte) !== 0; // Support all four channels
            if (ccValid) {
                var ccType = 0x03 & tmpByte;
                if (0x00 /* CEA608 field1*/ === ccType ||
                    0x01 /* CEA608 field2*/ === ccType) {
                    // Exclude CEA708 CC data.
                    actualCCBytes[ccType].push(ccbyte1);
                    actualCCBytes[ccType].push(ccbyte2);
                }
            }
        }
        return actualCCBytes;
    };
    return TimelineController;
}());
exports.TimelineController = TimelineController;
function captionsOrSubtitlesFromCharacteristics(track) {
    if (track.characteristics) {
        if (/transcribes-spoken-dialog/gi.test(track.characteristics) &&
            /describes-music-and-sound/gi.test(track.characteristics)) {
            return 'captions';
        }
    }
    return 'subtitles';
}
function canReuseVttTextTrack(inUseTrack, manifestTrack) {
    return (!!inUseTrack &&
        inUseTrack.kind === captionsOrSubtitlesFromCharacteristics(manifestTrack) &&
        (0, media_option_attributes_1.subtitleTrackMatchesTextTrack)(manifestTrack, inUseTrack));
}
function intersection(x1, x2, y1, y2) {
    return Math.min(x2, y2) - Math.max(x1, y1);
}
function newVTTCCs() {
    return {
        ccOffset: 0,
        presentationOffset: 0,
        0: {
            start: 0,
            prevCC: -1,
            new: true,
        },
    };
}
