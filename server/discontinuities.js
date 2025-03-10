"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findFirstFragWithCC = findFirstFragWithCC;
exports.shouldAlignOnDiscontinuities = shouldAlignOnDiscontinuities;
exports.findDiscontinuousReferenceFrag = findDiscontinuousReferenceFrag;
exports.adjustSlidingStart = adjustSlidingStart;
exports.alignStream = alignStream;
exports.alignMediaPlaylistByPDT = alignMediaPlaylistByPDT;
var logger_1 = require("./logger");
var level_helper_1 = require("./level-helper");
function findFirstFragWithCC(fragments, cc) {
    var _a;
    for (var i = 0, len = fragments.length; i < len; i++) {
        if (((_a = fragments[i]) === null || _a === void 0 ? void 0 : _a.cc) === cc) {
            return fragments[i];
        }
    }
    return null;
}
function shouldAlignOnDiscontinuities(lastFrag, switchDetails, details) {
    if (switchDetails) {
        if (details.endCC > details.startCC ||
            (lastFrag && lastFrag.cc < details.startCC)) {
            return true;
        }
    }
    return false;
}
// Find the first frag in the previous level which matches the CC of the first frag of the new level
function findDiscontinuousReferenceFrag(prevDetails, curDetails) {
    var prevFrags = prevDetails.fragments;
    var curFrags = curDetails.fragments;
    if (!curFrags.length || !prevFrags.length) {
        logger_1.logger.log('No fragments to align');
        return;
    }
    var prevStartFrag = findFirstFragWithCC(prevFrags, curFrags[0].cc);
    if (!prevStartFrag || (prevStartFrag && !prevStartFrag.startPTS)) {
        logger_1.logger.log('No frag in previous level to align on');
        return;
    }
    return prevStartFrag;
}
function adjustFragmentStart(frag, sliding) {
    if (frag) {
        var start = frag.start + sliding;
        frag.start = frag.startPTS = start;
        frag.endPTS = start + frag.duration;
    }
}
function adjustSlidingStart(sliding, details) {
    // Update segments
    var fragments = details.fragments;
    for (var i = 0, len = fragments.length; i < len; i++) {
        adjustFragmentStart(fragments[i], sliding);
    }
    // Update LL-HLS parts at the end of the playlist
    if (details.fragmentHint) {
        adjustFragmentStart(details.fragmentHint, sliding);
    }
    details.alignedSliding = true;
}
/**
 * Using the parameters of the last level, this function computes PTS' of the new fragments so that they form a
 * contiguous stream with the last fragments.
 * The PTS of a fragment lets Hls.js know where it fits into a stream - by knowing every PTS, we know which fragment to
 * download at any given time. PTS is normally computed when the fragment is demuxed, so taking this step saves us time
 * and an extra download.
 * @param lastFrag
 * @param lastLevel
 * @param details
 */
function alignStream(lastFrag, switchDetails, details) {
    if (!switchDetails) {
        return;
    }
    alignDiscontinuities(lastFrag, details, switchDetails);
    if (!details.alignedSliding && switchDetails) {
        // If the PTS wasn't figured out via discontinuity sequence that means there was no CC increase within the level.
        // Aligning via Program Date Time should therefore be reliable, since PDT should be the same within the same
        // discontinuity sequence.
        alignMediaPlaylistByPDT(details, switchDetails);
    }
    if (!details.alignedSliding && switchDetails && !details.skippedSegments) {
        // Try to align on sn so that we pick a better start fragment.
        // Do not perform this on playlists with delta updates as this is only to align levels on switch
        // and adjustSliding only adjusts fragments after skippedSegments.
        (0, level_helper_1.adjustSliding)(switchDetails, details);
    }
}
/**
 * Computes the PTS if a new level's fragments using the PTS of a fragment in the last level which shares the same
 * discontinuity sequence.
 * @param lastFrag - The last Fragment which shares the same discontinuity sequence
 * @param lastLevel - The details of the last loaded level
 * @param details - The details of the new level
 */
function alignDiscontinuities(lastFrag, details, switchDetails) {
    if (shouldAlignOnDiscontinuities(lastFrag, switchDetails, details)) {
        var referenceFrag = findDiscontinuousReferenceFrag(switchDetails, details);
        if (referenceFrag && Number.isFinite(referenceFrag.start)) {
            logger_1.logger.log("Adjusting PTS using last level due to CC increase within current level ".concat(details.url));
            adjustSlidingStart(referenceFrag.start, details);
        }
    }
}
/**
 * Ensures appropriate time-alignment between renditions based on PDT.
 * This function assumes the timelines represented in `refDetails` are accurate, including the PDTs
 * for the last discontinuity sequence number shared by both playlists when present,
 * and uses the "wallclock"/PDT timeline as a cross-reference to `details`, adjusting the presentation
 * times/timelines of `details` accordingly.
 * Given the asynchronous nature of fetches and initial loads of live `main` and audio/subtitle tracks,
 * the primary purpose of this function is to ensure the "local timelines" of audio/subtitle tracks
 * are aligned to the main/video timeline, using PDT as the cross-reference/"anchor" that should
 * be consistent across playlists, per the HLS spec.
 * @param details - The details of the rendition you'd like to time-align (e.g. an audio rendition).
 * @param refDetails - The details of the reference rendition with start and PDT times for alignment.
 */
function alignMediaPlaylistByPDT(details, refDetails) {
    if (!details.hasProgramDateTime || !refDetails.hasProgramDateTime) {
        return;
    }
    var fragments = details.fragments;
    var refFragments = refDetails.fragments;
    if (!fragments.length || !refFragments.length) {
        return;
    }
    // Calculate a delta to apply to all fragments according to the delta in PDT times and start times
    // of a fragment in the reference details, and a fragment in the target details of the same discontinuity.
    // If a fragment of the same discontinuity was not found use the middle fragment of both.
    var refFrag;
    var frag;
    var targetCC = Math.min(refDetails.endCC, details.endCC);
    if (refDetails.startCC < targetCC && details.startCC < targetCC) {
        refFrag = findFirstFragWithCC(refFragments, targetCC);
        frag = findFirstFragWithCC(fragments, targetCC);
    }
    if (!refFrag || !frag) {
        refFrag = refFragments[Math.floor(refFragments.length / 2)];
        frag =
            findFirstFragWithCC(fragments, refFrag.cc) ||
                fragments[Math.floor(fragments.length / 2)];
    }
    var refPDT = refFrag.programDateTime;
    var targetPDT = frag.programDateTime;
    if (!refPDT || !targetPDT) {
        return;
    }
    var delta = (targetPDT - refPDT) / 1000 - (frag.start - refFrag.start);
    adjustSlidingStart(delta, details);
}
