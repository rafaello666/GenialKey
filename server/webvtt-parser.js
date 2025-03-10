"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCueId = generateCueId;
exports.parseWebVTT = parseWebVTT;
var vttparser_1 = require("./vttparser");
var id3_1 = require("../demux/id3");
var timescale_conversion_1 = require("./timescale-conversion");
var mp4_remuxer_1 = require("../remux/mp4-remuxer");
var LINEBREAKS = /\r\n|\n\r|\n|\r/g;
// String.prototype.startsWith is not supported in IE11
var startsWith = function (inputString, searchString, position) {
    if (position === void 0) { position = 0; }
    return (inputString.slice(position, position + searchString.length) === searchString);
};
var cueString2millis = function (timeString) {
    var ts = parseInt(timeString.slice(-3));
    var secs = parseInt(timeString.slice(-6, -4));
    var mins = parseInt(timeString.slice(-9, -7));
    var hours = timeString.length > 9
        ? parseInt(timeString.substring(0, timeString.indexOf(':')))
        : 0;
    if (!Number.isFinite(ts) ||
        !Number.isFinite(secs) ||
        !Number.isFinite(mins) ||
        !Number.isFinite(hours)) {
        throw Error("Malformed X-TIMESTAMP-MAP: Local:".concat(timeString));
    }
    ts += 1000 * secs;
    ts += 60 * 1000 * mins;
    ts += 60 * 60 * 1000 * hours;
    return ts;
};
// From https://github.com/darkskyapp/string-hash
var hash = function (text) {
    var hash = 5381;
    var i = text.length;
    while (i) {
        hash = (hash * 33) ^ text.charCodeAt(--i);
    }
    return (hash >>> 0).toString();
};
// Create a unique hash id for a cue based on start/end times and text.
// This helps timeline-controller to avoid showing repeated captions.
function generateCueId(startTime, endTime, text) {
    return hash(startTime.toString()) + hash(endTime.toString()) + hash(text);
}
var calculateOffset = function (vttCCs, cc, presentationTime) {
    var currCC = vttCCs[cc];
    var prevCC = vttCCs[currCC.prevCC];
    // This is the first discontinuity or cues have been processed since the last discontinuity
    // Offset = current discontinuity time
    if (!prevCC || (!prevCC.new && currCC.new)) {
        vttCCs.ccOffset = vttCCs.presentationOffset = currCC.start;
        currCC.new = false;
        return;
    }
    // There have been discontinuities since cues were last parsed.
    // Offset = time elapsed
    while (prevCC === null || prevCC === void 0 ? void 0 : prevCC.new) {
        vttCCs.ccOffset += currCC.start - prevCC.start;
        currCC.new = false;
        currCC = prevCC;
        prevCC = vttCCs[currCC.prevCC];
    }
    vttCCs.presentationOffset = presentationTime;
};
function parseWebVTT(vttByteArray, initPTS, vttCCs, cc, timeOffset, callBack, errorCallBack) {
    var parser = new vttparser_1.VTTParser();
    // Convert byteArray into string, replacing any somewhat exotic linefeeds with "\n", then split on that character.
    // Uint8Array.prototype.reduce is not implemented in IE11
    var vttLines = (0, id3_1.utf8ArrayToStr)(new Uint8Array(vttByteArray))
        .trim()
        .replace(LINEBREAKS, '\n')
        .split('\n');
    var cues = [];
    var init90kHz = initPTS
        ? (0, timescale_conversion_1.toMpegTsClockFromTimescale)(initPTS.baseTime, initPTS.timescale)
        : 0;
    var cueTime = '00:00.000';
    var timestampMapMPEGTS = 0;
    var timestampMapLOCAL = 0;
    var parsingError;
    var inHeader = true;
    parser.oncue = function (cue) {
        // Adjust cue timing; clamp cues to start no earlier than - and drop cues that don't end after - 0 on timeline.
        var currCC = vttCCs[cc];
        var cueOffset = vttCCs.ccOffset;
        // Calculate subtitle PTS offset
        var webVttMpegTsMapOffset = (timestampMapMPEGTS - init90kHz) / 90000;
        // Update offsets for new discontinuities
        if (currCC === null || currCC === void 0 ? void 0 : currCC.new) {
            if (timestampMapLOCAL !== undefined) {
                // When local time is provided, offset = discontinuity start time - local time
                cueOffset = vttCCs.ccOffset = currCC.start;
            }
            else {
                calculateOffset(vttCCs, cc, webVttMpegTsMapOffset);
            }
        }
        if (webVttMpegTsMapOffset) {
            if (!initPTS) {
                parsingError = new Error('Missing initPTS for VTT MPEGTS');
                return;
            }
            // If we have MPEGTS, offset = presentation time + discontinuity offset
            cueOffset = webVttMpegTsMapOffset - vttCCs.presentationOffset;
        }
        var duration = cue.endTime - cue.startTime;
        var startTime = (0, mp4_remuxer_1.normalizePts)((cue.startTime + cueOffset - timestampMapLOCAL) * 90000, timeOffset * 90000) / 90000;
        cue.startTime = Math.max(startTime, 0);
        cue.endTime = Math.max(startTime + duration, 0);
        //trim trailing webvtt block whitespaces
        var text = cue.text.trim();
        // Fix encoding of special characters
        cue.text = decodeURIComponent(encodeURIComponent(text));
        // If the cue was not assigned an id from the VTT file (line above the content), create one.
        if (!cue.id) {
            cue.id = generateCueId(cue.startTime, cue.endTime, text);
        }
        if (cue.endTime > 0) {
            cues.push(cue);
        }
    };
    parser.onparsingerror = function (error) {
        parsingError = error;
    };
    parser.onflush = function () {
        if (parsingError) {
            errorCallBack(parsingError);
            return;
        }
        callBack(cues);
    };
    // Go through contents line by line.
    vttLines.forEach(function (line) {
        if (inHeader) {
            // Look for X-TIMESTAMP-MAP in header.
            if (startsWith(line, 'X-TIMESTAMP-MAP=')) {
                // Once found, no more are allowed anyway, so stop searching.
                inHeader = false;
                // Extract LOCAL and MPEGTS.
                line
                    .slice(16)
                    .split(',')
                    .forEach(function (timestamp) {
                    if (startsWith(timestamp, 'LOCAL:')) {
                        cueTime = timestamp.slice(6);
                    }
                    else if (startsWith(timestamp, 'MPEGTS:')) {
                        timestampMapMPEGTS = parseInt(timestamp.slice(7));
                    }
                });
                try {
                    // Convert cue time to seconds
                    timestampMapLOCAL = cueString2millis(cueTime) / 1000;
                }
                catch (error) {
                    parsingError = error;
                }
                // Return without parsing X-TIMESTAMP-MAP line.
                return;
            }
            else if (line === '') {
                inHeader = false;
            }
        }
        // Parse line by default.
        parser.parse(line + '\n');
    });
    parser.flush();
}
