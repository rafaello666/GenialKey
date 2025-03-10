"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAddTrackEvent = sendAddTrackEvent;
exports.addCueToTrack = addCueToTrack;
exports.clearCurrentCues = clearCurrentCues;
exports.removeCuesInRange = removeCuesInRange;
exports.getCuesInRange = getCuesInRange;
exports.filterSubtitleTracks = filterSubtitleTracks;
var logger_1 = require("./logger");
function sendAddTrackEvent(track, videoEl) {
    var event;
    try {
        event = new Event('addtrack');
    }
    catch (err) {
        // for IE11
        event = document.createEvent('Event');
        event.initEvent('addtrack', false, false);
    }
    event.track = track;
    videoEl.dispatchEvent(event);
}
function addCueToTrack(track, cue) {
    // Sometimes there are cue overlaps on segmented vtts so the same
    // cue can appear more than once in different vtt files.
    // This avoid showing duplicated cues with same timecode and text.
    var mode = track.mode;
    if (mode === 'disabled') {
        track.mode = 'hidden';
    }
    if (track.cues && !track.cues.getCueById(cue.id)) {
        try {
            track.addCue(cue);
            if (!track.cues.getCueById(cue.id)) {
                throw new Error("addCue is failed for: ".concat(cue));
            }
        }
        catch (err) {
            logger_1.logger.debug("[texttrack-utils]: ".concat(err));
            try {
                var textTrackCue = new self.TextTrackCue(cue.startTime, cue.endTime, cue.text);
                textTrackCue.id = cue.id;
                track.addCue(textTrackCue);
            }
            catch (err2) {
                logger_1.logger.debug("[texttrack-utils]: Legacy TextTrackCue fallback failed: ".concat(err2));
            }
        }
    }
    if (mode === 'disabled') {
        track.mode = mode;
    }
}
function clearCurrentCues(track) {
    // When track.mode is disabled, track.cues will be null.
    // To guarantee the removal of cues, we need to temporarily
    // change the mode to hidden
    var mode = track.mode;
    if (mode === 'disabled') {
        track.mode = 'hidden';
    }
    if (track.cues) {
        for (var i = track.cues.length; i--;) {
            track.removeCue(track.cues[i]);
        }
    }
    if (mode === 'disabled') {
        track.mode = mode;
    }
}
function removeCuesInRange(track, start, end, predicate) {
    var mode = track.mode;
    if (mode === 'disabled') {
        track.mode = 'hidden';
    }
    if (track.cues && track.cues.length > 0) {
        var cues = getCuesInRange(track.cues, start, end);
        for (var i = 0; i < cues.length; i++) {
            if (!predicate || predicate(cues[i])) {
                track.removeCue(cues[i]);
            }
        }
    }
    if (mode === 'disabled') {
        track.mode = mode;
    }
}
// Find first cue starting after given time.
// Modified version of binary search O(log(n)).
function getFirstCueIndexAfterTime(cues, time) {
    // If first cue starts after time, start there
    if (time < cues[0].startTime) {
        return 0;
    }
    // If the last cue ends before time there is no overlap
    var len = cues.length - 1;
    if (time > cues[len].endTime) {
        return -1;
    }
    var left = 0;
    var right = len;
    while (left <= right) {
        var mid = Math.floor((right + left) / 2);
        if (time < cues[mid].startTime) {
            right = mid - 1;
        }
        else if (time > cues[mid].startTime && left < len) {
            left = mid + 1;
        }
        else {
            // If it's not lower or higher, it must be equal.
            return mid;
        }
    }
    // At this point, left and right have swapped.
    // No direct match was found, left or right element must be the closest. Check which one has the smallest diff.
    return cues[left].startTime - time < time - cues[right].startTime
        ? left
        : right;
}
function getCuesInRange(cues, start, end) {
    var cuesFound = [];
    var firstCueInRange = getFirstCueIndexAfterTime(cues, start);
    if (firstCueInRange > -1) {
        for (var i = firstCueInRange, len = cues.length; i < len; i++) {
            var cue = cues[i];
            if (cue.startTime >= start && cue.endTime <= end) {
                cuesFound.push(cue);
            }
            else if (cue.startTime > end) {
                return cuesFound;
            }
        }
    }
    return cuesFound;
}
function filterSubtitleTracks(textTrackList) {
    var tracks = [];
    for (var i = 0; i < textTrackList.length; i++) {
        var track = textTrackList[i];
        // Edge adds a track without a label; we don't want to use it
        if ((track.kind === 'subtitles' || track.kind === 'captions') &&
            track.label) {
            tracks.push(textTrackList[i]);
        }
    }
    return tracks;
}
