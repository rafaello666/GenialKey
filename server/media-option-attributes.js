"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subtitleOptionsIdentical = subtitleOptionsIdentical;
exports.mediaAttributesIdentical = mediaAttributesIdentical;
exports.subtitleTrackMatchesTextTrack = subtitleTrackMatchesTextTrack;
function subtitleOptionsIdentical(trackList1, trackList2) {
    if (trackList1.length !== trackList2.length) {
        return false;
    }
    for (var i = 0; i < trackList1.length; i++) {
        if (!mediaAttributesIdentical(trackList1[i].attrs, trackList2[i].attrs)) {
            return false;
        }
    }
    return true;
}
function mediaAttributesIdentical(attrs1, attrs2, customAttributes) {
    // Media options with the same rendition ID must be bit identical
    var stableRenditionId = attrs1['STABLE-RENDITION-ID'];
    if (stableRenditionId && !customAttributes) {
        return stableRenditionId === attrs2['STABLE-RENDITION-ID'];
    }
    // When rendition ID is not present, compare attributes
    return !(customAttributes || [
        'LANGUAGE',
        'NAME',
        'CHARACTERISTICS',
        'AUTOSELECT',
        'DEFAULT',
        'FORCED',
        'ASSOC-LANGUAGE',
    ]).some(function (subtitleAttribute) {
        return attrs1[subtitleAttribute] !== attrs2[subtitleAttribute];
    });
}
function subtitleTrackMatchesTextTrack(subtitleTrack, textTrack) {
    return (textTrack.label.toLowerCase() === subtitleTrack.name.toLowerCase() &&
        (!textTrack.language ||
            textTrack.language.toLowerCase() ===
                (subtitleTrack.lang || '').toLowerCase()));
}
