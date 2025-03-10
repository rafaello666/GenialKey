"use strict";
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
var texttrack_utils_1 = require("../utils/texttrack-utils");
var ID3 = require("../demux/id3");
var date_range_1 = require("../loader/date-range");
var demuxer_1 = require("../types/demuxer");
var MIN_CUE_DURATION = 0.25;
function getCueClass() {
    if (typeof self === 'undefined')
        return undefined;
    return self.VTTCue || self.TextTrackCue;
}
function createCueWithDataFields(Cue, startTime, endTime, data, type) {
    var cue = new Cue(startTime, endTime, '');
    try {
        cue.value = data;
        if (type) {
            cue.type = type;
        }
    }
    catch (e) {
        cue = new Cue(startTime, endTime, JSON.stringify(type ? __assign({ type: type }, data) : data));
    }
    return cue;
}
// VTTCue latest draft allows an infinite duration, fallback
// to MAX_VALUE if necessary
var MAX_CUE_ENDTIME = (function () {
    var Cue = getCueClass();
    try {
        Cue && new Cue(0, Number.POSITIVE_INFINITY, '');
    }
    catch (e) {
        return Number.MAX_VALUE;
    }
    return Number.POSITIVE_INFINITY;
})();
function dateRangeDateToTimelineSeconds(date, offset) {
    return date.getTime() / 1000 - offset;
}
function hexToArrayBuffer(str) {
    return Uint8Array.from(str
        .replace(/^0x/, '')
        .replace(/([\da-fA-F]{2}) ?/g, '0x$1 ')
        .replace(/ +$/, '')
        .split(' ')).buffer;
}
var ID3TrackController = /** @class */ (function () {
    function ID3TrackController(hls) {
        this.id3Track = null;
        this.media = null;
        this.dateRangeCuesAppended = {};
        this.hls = hls;
        this._registerListeners();
    }
    ID3TrackController.prototype.destroy = function () {
        this._unregisterListeners();
        this.id3Track = null;
        this.media = null;
        this.dateRangeCuesAppended = {};
        // @ts-ignore
        this.hls = null;
    };
    ID3TrackController.prototype._registerListeners = function () {
        var hls = this.hls;
        hls.on(events_1.Events.MEDIA_ATTACHED, this.onMediaAttached, this);
        hls.on(events_1.Events.MEDIA_DETACHING, this.onMediaDetaching, this);
        hls.on(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.on(events_1.Events.FRAG_PARSING_METADATA, this.onFragParsingMetadata, this);
        hls.on(events_1.Events.BUFFER_FLUSHING, this.onBufferFlushing, this);
        hls.on(events_1.Events.LEVEL_UPDATED, this.onLevelUpdated, this);
    };
    ID3TrackController.prototype._unregisterListeners = function () {
        var hls = this.hls;
        hls.off(events_1.Events.MEDIA_ATTACHED, this.onMediaAttached, this);
        hls.off(events_1.Events.MEDIA_DETACHING, this.onMediaDetaching, this);
        hls.off(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        hls.off(events_1.Events.FRAG_PARSING_METADATA, this.onFragParsingMetadata, this);
        hls.off(events_1.Events.BUFFER_FLUSHING, this.onBufferFlushing, this);
        hls.off(events_1.Events.LEVEL_UPDATED, this.onLevelUpdated, this);
    };
    // Add ID3 metatadata text track.
    ID3TrackController.prototype.onMediaAttached = function (event, data) {
        this.media = data.media;
    };
    ID3TrackController.prototype.onMediaDetaching = function () {
        if (!this.id3Track) {
            return;
        }
        (0, texttrack_utils_1.clearCurrentCues)(this.id3Track);
        this.id3Track = null;
        this.media = null;
        this.dateRangeCuesAppended = {};
    };
    ID3TrackController.prototype.onManifestLoading = function () {
        this.dateRangeCuesAppended = {};
    };
    ID3TrackController.prototype.createTrack = function (media) {
        var track = this.getID3Track(media.textTracks);
        track.mode = 'hidden';
        return track;
    };
    ID3TrackController.prototype.getID3Track = function (textTracks) {
        if (!this.media) {
            return;
        }
        for (var i = 0; i < textTracks.length; i++) {
            var textTrack = textTracks[i];
            if (textTrack.kind === 'metadata' && textTrack.label === 'id3') {
                // send 'addtrack' when reusing the textTrack for metadata,
                // same as what we do for captions
                (0, texttrack_utils_1.sendAddTrackEvent)(textTrack, this.media);
                return textTrack;
            }
        }
        return this.media.addTextTrack('metadata', 'id3');
    };
    ID3TrackController.prototype.onFragParsingMetadata = function (event, data) {
        if (!this.media) {
            return;
        }
        var _a = this.hls.config, enableEmsgMetadataCues = _a.enableEmsgMetadataCues, enableID3MetadataCues = _a.enableID3MetadataCues;
        if (!enableEmsgMetadataCues && !enableID3MetadataCues) {
            return;
        }
        var samples = data.samples;
        // create track dynamically
        if (!this.id3Track) {
            this.id3Track = this.createTrack(this.media);
        }
        var Cue = getCueClass();
        if (!Cue) {
            return;
        }
        for (var i = 0; i < samples.length; i++) {
            var type = samples[i].type;
            if ((type === demuxer_1.MetadataSchema.emsg && !enableEmsgMetadataCues) ||
                !enableID3MetadataCues) {
                continue;
            }
            var frames_1 = ID3.getID3Frames(samples[i].data);
            if (frames_1) {
                var startTime = samples[i].pts;
                var endTime = startTime + samples[i].duration;
                if (endTime > MAX_CUE_ENDTIME) {
                    endTime = MAX_CUE_ENDTIME;
                }
                var timeDiff = endTime - startTime;
                if (timeDiff <= 0) {
                    endTime = startTime + MIN_CUE_DURATION;
                }
                for (var j = 0; j < frames_1.length; j++) {
                    var frame = frames_1[j];
                    // Safari doesn't put the timestamp frame in the TextTrack
                    if (!ID3.isTimeStampFrame(frame)) {
                        // add a bounds to any unbounded cues
                        this.updateId3CueEnds(startTime, type);
                        var cue = createCueWithDataFields(Cue, startTime, endTime, frame, type);
                        if (cue) {
                            this.id3Track.addCue(cue);
                        }
                    }
                }
            }
        }
    };
    ID3TrackController.prototype.updateId3CueEnds = function (startTime, type) {
        var _a;
        var cues = (_a = this.id3Track) === null || _a === void 0 ? void 0 : _a.cues;
        if (cues) {
            for (var i = cues.length; i--;) {
                var cue = cues[i];
                if (cue.type === type &&
                    cue.startTime < startTime &&
                    cue.endTime === MAX_CUE_ENDTIME) {
                    cue.endTime = startTime;
                }
            }
        }
    };
    ID3TrackController.prototype.onBufferFlushing = function (event, _a) {
        var startOffset = _a.startOffset, endOffset = _a.endOffset, type = _a.type;
        var _b = this, id3Track = _b.id3Track, hls = _b.hls;
        if (!hls) {
            return;
        }
        var _c = hls.config, enableEmsgMetadataCues = _c.enableEmsgMetadataCues, enableID3MetadataCues = _c.enableID3MetadataCues;
        if (id3Track && (enableEmsgMetadataCues || enableID3MetadataCues)) {
            var predicate = void 0;
            if (type === 'audio') {
                predicate = function (cue) {
                    return cue.type === demuxer_1.MetadataSchema.audioId3 &&
                        enableID3MetadataCues;
                };
            }
            else if (type === 'video') {
                predicate = function (cue) {
                    return cue.type === demuxer_1.MetadataSchema.emsg && enableEmsgMetadataCues;
                };
            }
            else {
                predicate = function (cue) {
                    return (cue.type === demuxer_1.MetadataSchema.audioId3 &&
                        enableID3MetadataCues) ||
                        (cue.type === demuxer_1.MetadataSchema.emsg && enableEmsgMetadataCues);
                };
            }
            (0, texttrack_utils_1.removeCuesInRange)(id3Track, startOffset, endOffset, predicate);
        }
    };
    ID3TrackController.prototype.onLevelUpdated = function (event, _a) {
        var details = _a.details;
        if (!this.media ||
            !details.hasProgramDateTime ||
            !this.hls.config.enableDateRangeMetadataCues) {
            return;
        }
        var _b = this, dateRangeCuesAppended = _b.dateRangeCuesAppended, id3Track = _b.id3Track;
        var dateRanges = details.dateRanges;
        var ids = Object.keys(dateRanges);
        // Remove cues from track not found in details.dateRanges
        if (id3Track) {
            var idsToRemove = Object.keys(dateRangeCuesAppended).filter(function (id) { return !ids.includes(id); });
            var _loop_1 = function (i) {
                var id = idsToRemove[i];
                Object.keys(dateRangeCuesAppended[id].cues).forEach(function (key) {
                    id3Track.removeCue(dateRangeCuesAppended[id].cues[key]);
                });
                delete dateRangeCuesAppended[id];
            };
            for (var i = idsToRemove.length; i--;) {
                _loop_1(i);
            }
        }
        // Exit if the playlist does not have Date Ranges or does not have Program Date Time
        var lastFragment = details.fragments[details.fragments.length - 1];
        if (ids.length === 0 || !Number.isFinite(lastFragment === null || lastFragment === void 0 ? void 0 : lastFragment.programDateTime)) {
            return;
        }
        if (!this.id3Track) {
            this.id3Track = this.createTrack(this.media);
        }
        var dateTimeOffset = lastFragment.programDateTime / 1000 - lastFragment.start;
        var Cue = getCueClass();
        var _loop_2 = function (i) {
            var id = ids[i];
            var dateRange = dateRanges[id];
            var startTime = dateRangeDateToTimelineSeconds(dateRange.startDate, dateTimeOffset);
            // Process DateRanges to determine end-time (known DURATION, END-DATE, or END-ON-NEXT)
            var appendedDateRangeCues = dateRangeCuesAppended[id];
            var cues = (appendedDateRangeCues === null || appendedDateRangeCues === void 0 ? void 0 : appendedDateRangeCues.cues) || {};
            var durationKnown = (appendedDateRangeCues === null || appendedDateRangeCues === void 0 ? void 0 : appendedDateRangeCues.durationKnown) || false;
            var endTime = MAX_CUE_ENDTIME;
            var endDate = dateRange.endDate;
            if (endDate) {
                endTime = dateRangeDateToTimelineSeconds(endDate, dateTimeOffset);
                durationKnown = true;
            }
            else if (dateRange.endOnNext && !durationKnown) {
                var nextDateRangeWithSameClass = ids.reduce(function (candidateDateRange, id) {
                    if (id !== dateRange.id) {
                        var otherDateRange = dateRanges[id];
                        if (otherDateRange.class === dateRange.class &&
                            otherDateRange.startDate > dateRange.startDate &&
                            (!candidateDateRange ||
                                dateRange.startDate < candidateDateRange.startDate)) {
                            return otherDateRange;
                        }
                    }
                    return candidateDateRange;
                }, null);
                if (nextDateRangeWithSameClass) {
                    endTime = dateRangeDateToTimelineSeconds(nextDateRangeWithSameClass.startDate, dateTimeOffset);
                    durationKnown = true;
                }
            }
            // Create TextTrack Cues for each MetadataGroup Item (select DateRange attribute)
            // This is to emulate Safari HLS playback handling of DateRange tags
            var attributes = Object.keys(dateRange.attr);
            for (var j = 0; j < attributes.length; j++) {
                var key = attributes[j];
                if (!(0, date_range_1.isDateRangeCueAttribute)(key)) {
                    continue;
                }
                var cue = cues[key];
                if (cue) {
                    if (durationKnown && !appendedDateRangeCues.durationKnown) {
                        cue.endTime = endTime;
                    }
                }
                else if (Cue) {
                    var data = dateRange.attr[key];
                    if ((0, date_range_1.isSCTE35Attribute)(key)) {
                        data = hexToArrayBuffer(data);
                    }
                    var cue_1 = createCueWithDataFields(Cue, startTime, endTime, { key: key, data: data }, demuxer_1.MetadataSchema.dateRange);
                    if (cue_1) {
                        cue_1.id = id;
                        this_1.id3Track.addCue(cue_1);
                        cues[key] = cue_1;
                    }
                }
            }
            // Keep track of processed DateRanges by ID for updating cues with new DateRange tag attributes
            dateRangeCuesAppended[id] = {
                cues: cues,
                dateRange: dateRange,
                durationKnown: durationKnown,
            };
        };
        var this_1 = this;
        for (var i = 0; i < ids.length; i++) {
            _loop_2(i);
        }
    };
    return ID3TrackController;
}());
exports.default = ID3TrackController;
