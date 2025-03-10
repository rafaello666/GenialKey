"use strict";
/**
 * Provides methods dealing with playlist sliding and drift
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePTS = updatePTS;
exports.updateFragPTSDTS = updateFragPTSDTS;
exports.mergeDetails = mergeDetails;
exports.mapPartIntersection = mapPartIntersection;
exports.mapFragmentIntersection = mapFragmentIntersection;
exports.adjustSliding = adjustSliding;
exports.addSliding = addSliding;
exports.computeReloadInterval = computeReloadInterval;
exports.getFragmentWithSN = getFragmentWithSN;
exports.getPartWith = getPartWith;
exports.findPart = findPart;
exports.reassignFragmentLevelIndexes = reassignFragmentLevelIndexes;
var logger_1 = require("./logger");
var date_range_1 = require("../loader/date-range");
function updatePTS(fragments, fromIdx, toIdx) {
    var fragFrom = fragments[fromIdx];
    var fragTo = fragments[toIdx];
    updateFromToPTS(fragFrom, fragTo);
}
function updateFromToPTS(fragFrom, fragTo) {
    var fragToPTS = fragTo.startPTS;
    // if we know startPTS[toIdx]
    if (Number.isFinite(fragToPTS)) {
        // update fragment duration.
        // it helps to fix drifts between playlist reported duration and fragment real duration
        var duration = 0;
        var frag = void 0;
        if (fragTo.sn > fragFrom.sn) {
            duration = fragToPTS - fragFrom.start;
            frag = fragFrom;
        }
        else {
            duration = fragFrom.start - fragToPTS;
            frag = fragTo;
        }
        if (frag.duration !== duration) {
            frag.duration = duration;
        }
        // we dont know startPTS[toIdx]
    }
    else if (fragTo.sn > fragFrom.sn) {
        var contiguous = fragFrom.cc === fragTo.cc;
        // TODO: With part-loading end/durations we need to confirm the whole fragment is loaded before using (or setting) minEndPTS
        if (contiguous && fragFrom.minEndPTS) {
            fragTo.start = fragFrom.start + (fragFrom.minEndPTS - fragFrom.start);
        }
        else {
            fragTo.start = fragFrom.start + fragFrom.duration;
        }
    }
    else {
        fragTo.start = Math.max(fragFrom.start - fragTo.duration, 0);
    }
}
function updateFragPTSDTS(details, frag, startPTS, endPTS, startDTS, endDTS) {
    var parsedMediaDuration = endPTS - startPTS;
    if (parsedMediaDuration <= 0) {
        logger_1.logger.warn('Fragment should have a positive duration', frag);
        endPTS = startPTS + frag.duration;
        endDTS = startDTS + frag.duration;
    }
    var maxStartPTS = startPTS;
    var minEndPTS = endPTS;
    var fragStartPts = frag.startPTS;
    var fragEndPts = frag.endPTS;
    if (Number.isFinite(fragStartPts)) {
        // delta PTS between audio and video
        var deltaPTS = Math.abs(fragStartPts - startPTS);
        if (!Number.isFinite(frag.deltaPTS)) {
            frag.deltaPTS = deltaPTS;
        }
        else {
            frag.deltaPTS = Math.max(deltaPTS, frag.deltaPTS);
        }
        maxStartPTS = Math.max(startPTS, fragStartPts);
        startPTS = Math.min(startPTS, fragStartPts);
        startDTS = Math.min(startDTS, frag.startDTS);
        minEndPTS = Math.min(endPTS, fragEndPts);
        endPTS = Math.max(endPTS, fragEndPts);
        endDTS = Math.max(endDTS, frag.endDTS);
    }
    var drift = startPTS - frag.start;
    if (frag.start !== 0) {
        frag.start = startPTS;
    }
    frag.duration = endPTS - frag.start;
    frag.startPTS = startPTS;
    frag.maxStartPTS = maxStartPTS;
    frag.startDTS = startDTS;
    frag.endPTS = endPTS;
    frag.minEndPTS = minEndPTS;
    frag.endDTS = endDTS;
    var sn = frag.sn; // 'initSegment'
    // exit if sn out of range
    if (!details || sn < details.startSN || sn > details.endSN) {
        return 0;
    }
    var i;
    var fragIdx = sn - details.startSN;
    var fragments = details.fragments;
    // update frag reference in fragments array
    // rationale is that fragments array might not contain this frag object.
    // this will happen if playlist has been refreshed between frag loading and call to updateFragPTSDTS()
    // if we don't update frag, we won't be able to propagate PTS info on the playlist
    // resulting in invalid sliding computation
    fragments[fragIdx] = frag;
    // adjust fragment PTS/duration from seqnum-1 to frag 0
    for (i = fragIdx; i > 0; i--) {
        updateFromToPTS(fragments[i], fragments[i - 1]);
    }
    // adjust fragment PTS/duration from seqnum to last frag
    for (i = fragIdx; i < fragments.length - 1; i++) {
        updateFromToPTS(fragments[i], fragments[i + 1]);
    }
    if (details.fragmentHint) {
        updateFromToPTS(fragments[fragments.length - 1], details.fragmentHint);
    }
    details.PTSKnown = details.alignedSliding = true;
    return drift;
}
function mergeDetails(oldDetails, newDetails) {
    // Track the last initSegment processed. Initialize it to the last one on the timeline.
    var currentInitSegment = null;
    var oldFragments = oldDetails.fragments;
    for (var i = oldFragments.length - 1; i >= 0; i--) {
        var oldInit = oldFragments[i].initSegment;
        if (oldInit) {
            currentInitSegment = oldInit;
            break;
        }
    }
    if (oldDetails.fragmentHint) {
        // prevent PTS and duration from being adjusted on the next hint
        delete oldDetails.fragmentHint.endPTS;
    }
    // check if old/new playlists have fragments in common
    // loop through overlapping SN and update startPTS, cc, and duration if any found
    var PTSFrag;
    mapFragmentIntersection(oldDetails, newDetails, function (oldFrag, newFrag, newFragIndex, newFragments) {
        if (newDetails.skippedSegments) {
            if (newFrag.cc !== oldFrag.cc) {
                var ccOffset = oldFrag.cc - newFrag.cc;
                for (var i = newFragIndex; i < newFragments.length; i++) {
                    newFragments[i].cc += ccOffset;
                }
            }
        }
        if (Number.isFinite(oldFrag.startPTS) &&
            Number.isFinite(oldFrag.endPTS)) {
            newFrag.start = newFrag.startPTS = oldFrag.startPTS;
            newFrag.startDTS = oldFrag.startDTS;
            newFrag.maxStartPTS = oldFrag.maxStartPTS;
            newFrag.endPTS = oldFrag.endPTS;
            newFrag.endDTS = oldFrag.endDTS;
            newFrag.minEndPTS = oldFrag.minEndPTS;
            newFrag.duration =
                oldFrag.endPTS - oldFrag.startPTS;
            if (newFrag.duration) {
                PTSFrag = newFrag;
            }
            // PTS is known when any segment has startPTS and endPTS
            newDetails.PTSKnown = newDetails.alignedSliding = true;
        }
        newFrag.elementaryStreams = oldFrag.elementaryStreams;
        newFrag.loader = oldFrag.loader;
        newFrag.stats = oldFrag.stats;
        if (oldFrag.initSegment) {
            newFrag.initSegment = oldFrag.initSegment;
            currentInitSegment = oldFrag.initSegment;
        }
    });
    var newFragments = newDetails.fragments;
    if (currentInitSegment) {
        var fragmentsToCheck = newDetails.fragmentHint
            ? newFragments.concat(newDetails.fragmentHint)
            : newFragments;
        fragmentsToCheck.forEach(function (frag) {
            if (frag &&
                (!frag.initSegment ||
                    frag.initSegment.relurl === (currentInitSegment === null || currentInitSegment === void 0 ? void 0 : currentInitSegment.relurl))) {
                frag.initSegment = currentInitSegment;
            }
        });
    }
    if (newDetails.skippedSegments) {
        newDetails.deltaUpdateFailed = newFragments.some(function (frag) { return !frag; });
        if (newDetails.deltaUpdateFailed) {
            logger_1.logger.warn('[level-helper] Previous playlist missing segments skipped in delta playlist');
            for (var i = newDetails.skippedSegments; i--;) {
                newFragments.shift();
            }
            newDetails.startSN = newFragments[0].sn;
        }
        else {
            if (newDetails.canSkipDateRanges) {
                newDetails.dateRanges = mergeDateRanges(oldDetails.dateRanges, newDetails.dateRanges, newDetails.recentlyRemovedDateranges);
            }
        }
        newDetails.startCC = newDetails.fragments[0].cc;
        newDetails.endCC = newFragments[newFragments.length - 1].cc;
    }
    // Merge parts
    mapPartIntersection(oldDetails.partList, newDetails.partList, function (oldPart, newPart) {
        newPart.elementaryStreams = oldPart.elementaryStreams;
        newPart.stats = oldPart.stats;
    });
    // if at least one fragment contains PTS info, recompute PTS information for all fragments
    if (PTSFrag) {
        updateFragPTSDTS(newDetails, PTSFrag, PTSFrag.startPTS, PTSFrag.endPTS, PTSFrag.startDTS, PTSFrag.endDTS);
    }
    else {
        // ensure that delta is within oldFragments range
        // also adjust sliding in case delta is 0 (we could have old=[50-60] and new=old=[50-61])
        // in that case we also need to adjust start offset of all fragments
        adjustSliding(oldDetails, newDetails);
    }
    if (newFragments.length) {
        newDetails.totalduration = newDetails.edge - newFragments[0].start;
    }
    newDetails.driftStartTime = oldDetails.driftStartTime;
    newDetails.driftStart = oldDetails.driftStart;
    var advancedDateTime = newDetails.advancedDateTime;
    if (newDetails.advanced && advancedDateTime) {
        var edge = newDetails.edge;
        if (!newDetails.driftStart) {
            newDetails.driftStartTime = advancedDateTime;
            newDetails.driftStart = edge;
        }
        newDetails.driftEndTime = advancedDateTime;
        newDetails.driftEnd = edge;
    }
    else {
        newDetails.driftEndTime = oldDetails.driftEndTime;
        newDetails.driftEnd = oldDetails.driftEnd;
        newDetails.advancedDateTime = oldDetails.advancedDateTime;
    }
}
function mergeDateRanges(oldDateRanges, deltaDateRanges, recentlyRemovedDateranges) {
    var dateRanges = Object.assign({}, oldDateRanges);
    if (recentlyRemovedDateranges) {
        recentlyRemovedDateranges.forEach(function (id) {
            delete dateRanges[id];
        });
    }
    Object.keys(deltaDateRanges).forEach(function (id) {
        var dateRange = new date_range_1.DateRange(deltaDateRanges[id].attr, dateRanges[id]);
        if (dateRange.isValid) {
            dateRanges[id] = dateRange;
        }
        else {
            logger_1.logger.warn("Ignoring invalid Playlist Delta Update DATERANGE tag: \"".concat(JSON.stringify(deltaDateRanges[id].attr), "\""));
        }
    });
    return dateRanges;
}
function mapPartIntersection(oldParts, newParts, intersectionFn) {
    if (oldParts && newParts) {
        var delta = 0;
        for (var i = 0, len = oldParts.length; i <= len; i++) {
            var oldPart = oldParts[i];
            var newPart = newParts[i + delta];
            if (oldPart &&
                newPart &&
                oldPart.index === newPart.index &&
                oldPart.fragment.sn === newPart.fragment.sn) {
                intersectionFn(oldPart, newPart);
            }
            else {
                delta--;
            }
        }
    }
}
function mapFragmentIntersection(oldDetails, newDetails, intersectionFn) {
    var skippedSegments = newDetails.skippedSegments;
    var start = Math.max(oldDetails.startSN, newDetails.startSN) - newDetails.startSN;
    var end = (oldDetails.fragmentHint ? 1 : 0) +
        (skippedSegments
            ? newDetails.endSN
            : Math.min(oldDetails.endSN, newDetails.endSN)) -
        newDetails.startSN;
    var delta = newDetails.startSN - oldDetails.startSN;
    var newFrags = newDetails.fragmentHint
        ? newDetails.fragments.concat(newDetails.fragmentHint)
        : newDetails.fragments;
    var oldFrags = oldDetails.fragmentHint
        ? oldDetails.fragments.concat(oldDetails.fragmentHint)
        : oldDetails.fragments;
    for (var i = start; i <= end; i++) {
        var oldFrag = oldFrags[delta + i];
        var newFrag = newFrags[i];
        if (skippedSegments && !newFrag && i < skippedSegments) {
            // Fill in skipped segments in delta playlist
            newFrag = newDetails.fragments[i] = oldFrag;
        }
        if (oldFrag && newFrag) {
            intersectionFn(oldFrag, newFrag, i, newFrags);
        }
    }
}
function adjustSliding(oldDetails, newDetails) {
    var delta = newDetails.startSN + newDetails.skippedSegments - oldDetails.startSN;
    var oldFragments = oldDetails.fragments;
    if (delta < 0 || delta >= oldFragments.length) {
        return;
    }
    addSliding(newDetails, oldFragments[delta].start);
}
function addSliding(details, start) {
    if (start) {
        var fragments = details.fragments;
        for (var i = details.skippedSegments; i < fragments.length; i++) {
            fragments[i].start += start;
        }
        if (details.fragmentHint) {
            details.fragmentHint.start += start;
        }
    }
}
function computeReloadInterval(newDetails, distanceToLiveEdgeMs) {
    if (distanceToLiveEdgeMs === void 0) { distanceToLiveEdgeMs = Infinity; }
    var reloadInterval = 1000 * newDetails.targetduration;
    if (newDetails.updated) {
        // Use last segment duration when shorter than target duration and near live edge
        var fragments = newDetails.fragments;
        var liveEdgeMaxTargetDurations = 4;
        if (fragments.length &&
            reloadInterval * liveEdgeMaxTargetDurations > distanceToLiveEdgeMs) {
            var lastSegmentDuration = fragments[fragments.length - 1].duration * 1000;
            if (lastSegmentDuration < reloadInterval) {
                reloadInterval = lastSegmentDuration;
            }
        }
    }
    else {
        // estimate = 'miss half average';
        // follow HLS Spec, If the client reloads a Playlist file and finds that it has not
        // changed then it MUST wait for a period of one-half the target
        // duration before retrying.
        reloadInterval /= 2;
    }
    return Math.round(reloadInterval);
}
function getFragmentWithSN(level, sn, fragCurrent) {
    if (!(level === null || level === void 0 ? void 0 : level.details)) {
        return null;
    }
    var levelDetails = level.details;
    var fragment = levelDetails.fragments[sn - levelDetails.startSN];
    if (fragment) {
        return fragment;
    }
    fragment = levelDetails.fragmentHint;
    if (fragment && fragment.sn === sn) {
        return fragment;
    }
    if (sn < levelDetails.startSN && fragCurrent && fragCurrent.sn === sn) {
        return fragCurrent;
    }
    return null;
}
function getPartWith(level, sn, partIndex) {
    var _a;
    if (!(level === null || level === void 0 ? void 0 : level.details)) {
        return null;
    }
    return findPart((_a = level.details) === null || _a === void 0 ? void 0 : _a.partList, sn, partIndex);
}
function findPart(partList, sn, partIndex) {
    if (partList) {
        for (var i = partList.length; i--;) {
            var part = partList[i];
            if (part.index === partIndex && part.fragment.sn === sn) {
                return part;
            }
        }
    }
    return null;
}
function reassignFragmentLevelIndexes(levels) {
    levels.forEach(function (level, index) {
        var details = level.details;
        if (details === null || details === void 0 ? void 0 : details.fragments) {
            details.fragments.forEach(function (fragment) {
                fragment.level = index;
            });
        }
    });
}
