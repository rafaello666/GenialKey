"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStartCodecTier = getStartCodecTier;
exports.getAudioTracksByGroup = getAudioTracksByGroup;
exports.getCodecTiers = getCodecTiers;
exports.findMatchingOption = findMatchingOption;
exports.matchesOption = matchesOption;
exports.audioMatchPredicate = audioMatchPredicate;
exports.findClosestLevelWithAudioGroup = findClosestLevelWithAudioGroup;
var codecs_1 = require("./codecs");
var hdr_1 = require("./hdr");
var logger_1 = require("./logger");
function getStartCodecTier(codecTiers, currentVideoRange, currentBw, audioPreference, videoPreference) {
    var codecSets = Object.keys(codecTiers);
    var channelsPreference = audioPreference === null || audioPreference === void 0 ? void 0 : audioPreference.channels;
    var audioCodecPreference = audioPreference === null || audioPreference === void 0 ? void 0 : audioPreference.audioCodec;
    var preferStereo = channelsPreference && parseInt(channelsPreference) === 2;
    // Use first level set to determine stereo, and minimum resolution and framerate
    var hasStereo = true;
    var hasCurrentVideoRange = false;
    var minHeight = Infinity;
    var minFramerate = Infinity;
    var minBitrate = Infinity;
    var selectedScore = 0;
    var videoRanges = [];
    var _a = (0, hdr_1.getVideoSelectionOptions)(currentVideoRange, videoPreference), preferHDR = _a.preferHDR, allowedVideoRanges = _a.allowedVideoRanges;
    var _loop_1 = function (i) {
        var tier = codecTiers[codecSets[i]];
        hasStereo = tier.channels[2] > 0;
        minHeight = Math.min(minHeight, tier.minHeight);
        minFramerate = Math.min(minFramerate, tier.minFramerate);
        minBitrate = Math.min(minBitrate, tier.minBitrate);
        var matchingVideoRanges = allowedVideoRanges.filter(function (range) { return tier.videoRanges[range] > 0; });
        if (matchingVideoRanges.length > 0) {
            hasCurrentVideoRange = true;
            videoRanges = matchingVideoRanges;
        }
    };
    for (var i = codecSets.length; i--;) {
        _loop_1(i);
    }
    minHeight = Number.isFinite(minHeight) ? minHeight : 0;
    minFramerate = Number.isFinite(minFramerate) ? minFramerate : 0;
    var maxHeight = Math.max(1080, minHeight);
    var maxFramerate = Math.max(30, minFramerate);
    minBitrate = Number.isFinite(minBitrate) ? minBitrate : currentBw;
    currentBw = Math.max(minBitrate, currentBw);
    // If there are no variants with matching preference, set currentVideoRange to undefined
    if (!hasCurrentVideoRange) {
        currentVideoRange = undefined;
        videoRanges = [];
    }
    var codecSet = codecSets.reduce(function (selected, candidate) {
        // Remove candiates which do not meet bitrate, default audio, stereo or channels preference, 1080p or lower, 30fps or lower, or SDR/HDR selection if present
        var candidateTier = codecTiers[candidate];
        if (candidate === selected) {
            return selected;
        }
        if (candidateTier.minBitrate > currentBw) {
            logStartCodecCandidateIgnored(candidate, "min bitrate of ".concat(candidateTier.minBitrate, " > current estimate of ").concat(currentBw));
            return selected;
        }
        if (!candidateTier.hasDefaultAudio) {
            logStartCodecCandidateIgnored(candidate, "no renditions with default or auto-select sound found");
            return selected;
        }
        if (audioCodecPreference &&
            candidate.indexOf(audioCodecPreference.substring(0, 4)) % 5 !== 0) {
            logStartCodecCandidateIgnored(candidate, "audio codec preference \"".concat(audioCodecPreference, "\" not found"));
            return selected;
        }
        if (channelsPreference && !preferStereo) {
            if (!candidateTier.channels[channelsPreference]) {
                logStartCodecCandidateIgnored(candidate, "no renditions with ".concat(channelsPreference, " channel sound found (channels options: ").concat(Object.keys(candidateTier.channels), ")"));
                return selected;
            }
        }
        else if ((!audioCodecPreference || preferStereo) &&
            hasStereo &&
            candidateTier.channels['2'] === 0) {
            logStartCodecCandidateIgnored(candidate, "no renditions with stereo sound found");
            return selected;
        }
        if (candidateTier.minHeight > maxHeight) {
            logStartCodecCandidateIgnored(candidate, "min resolution of ".concat(candidateTier.minHeight, " > maximum of ").concat(maxHeight));
            return selected;
        }
        if (candidateTier.minFramerate > maxFramerate) {
            logStartCodecCandidateIgnored(candidate, "min framerate of ".concat(candidateTier.minFramerate, " > maximum of ").concat(maxFramerate));
            return selected;
        }
        if (!videoRanges.some(function (range) { return candidateTier.videoRanges[range] > 0; })) {
            logStartCodecCandidateIgnored(candidate, "no variants with VIDEO-RANGE of ".concat(JSON.stringify(videoRanges), " found"));
            return selected;
        }
        if (candidateTier.maxScore < selectedScore) {
            logStartCodecCandidateIgnored(candidate, "max score of ".concat(candidateTier.maxScore, " < selected max of ").concat(selectedScore));
            return selected;
        }
        // Remove candiates with less preferred codecs or more errors
        if (selected &&
            ((0, codecs_1.codecsSetSelectionPreferenceValue)(candidate) >=
                (0, codecs_1.codecsSetSelectionPreferenceValue)(selected) ||
                candidateTier.fragmentError > codecTiers[selected].fragmentError)) {
            return selected;
        }
        selectedScore = candidateTier.maxScore;
        return candidate;
    }, undefined);
    return {
        codecSet: codecSet,
        videoRanges: videoRanges,
        preferHDR: preferHDR,
        minFramerate: minFramerate,
        minBitrate: minBitrate,
    };
}
function logStartCodecCandidateIgnored(codeSet, reason) {
    logger_1.logger.log("[abr] start candidates with \"".concat(codeSet, "\" ignored because ").concat(reason));
}
function getAudioTracksByGroup(allAudioTracks) {
    return allAudioTracks.reduce(function (audioTracksByGroup, track) {
        var trackGroup = audioTracksByGroup.groups[track.groupId];
        if (!trackGroup) {
            trackGroup = audioTracksByGroup.groups[track.groupId] = {
                tracks: [],
                channels: { 2: 0 },
                hasDefault: false,
                hasAutoSelect: false,
            };
        }
        trackGroup.tracks.push(track);
        var channelsKey = track.channels || '2';
        trackGroup.channels[channelsKey] =
            (trackGroup.channels[channelsKey] || 0) + 1;
        trackGroup.hasDefault = trackGroup.hasDefault || track.default;
        trackGroup.hasAutoSelect = trackGroup.hasAutoSelect || track.autoselect;
        if (trackGroup.hasDefault) {
            audioTracksByGroup.hasDefaultAudio = true;
        }
        if (trackGroup.hasAutoSelect) {
            audioTracksByGroup.hasAutoSelectAudio = true;
        }
        return audioTracksByGroup;
    }, {
        hasDefaultAudio: false,
        hasAutoSelectAudio: false,
        groups: {},
    });
}
function getCodecTiers(levels, audioTracksByGroup, minAutoLevel, maxAutoLevel) {
    return levels
        .slice(minAutoLevel, maxAutoLevel + 1)
        .reduce(function (tiers, level) {
        if (!level.codecSet) {
            return tiers;
        }
        var audioGroups = level.audioGroups;
        var tier = tiers[level.codecSet];
        if (!tier) {
            tiers[level.codecSet] = tier = {
                minBitrate: Infinity,
                minHeight: Infinity,
                minFramerate: Infinity,
                maxScore: 0,
                videoRanges: { SDR: 0 },
                channels: { '2': 0 },
                hasDefaultAudio: !audioGroups,
                fragmentError: 0,
            };
        }
        tier.minBitrate = Math.min(tier.minBitrate, level.bitrate);
        var lesserWidthOrHeight = Math.min(level.height, level.width);
        tier.minHeight = Math.min(tier.minHeight, lesserWidthOrHeight);
        tier.minFramerate = Math.min(tier.minFramerate, level.frameRate);
        tier.maxScore = Math.max(tier.maxScore, level.score);
        tier.fragmentError += level.fragmentError;
        tier.videoRanges[level.videoRange] =
            (tier.videoRanges[level.videoRange] || 0) + 1;
        if (__USE_ALT_AUDIO__ && audioGroups) {
            audioGroups.forEach(function (audioGroupId) {
                if (!audioGroupId) {
                    return;
                }
                var audioGroup = audioTracksByGroup.groups[audioGroupId];
                if (!audioGroup) {
                    return;
                }
                // Default audio is any group with DEFAULT=YES, or if missing then any group with AUTOSELECT=YES, or all variants
                tier.hasDefaultAudio =
                    tier.hasDefaultAudio || audioTracksByGroup.hasDefaultAudio
                        ? audioGroup.hasDefault
                        : audioGroup.hasAutoSelect ||
                            (!audioTracksByGroup.hasDefaultAudio &&
                                !audioTracksByGroup.hasAutoSelectAudio);
                Object.keys(audioGroup.channels).forEach(function (channels) {
                    tier.channels[channels] =
                        (tier.channels[channels] || 0) + audioGroup.channels[channels];
                });
            });
        }
        return tiers;
    }, {});
}
function findMatchingOption(option, tracks, matchPredicate) {
    if ('attrs' in option) {
        var index = tracks.indexOf(option);
        if (index !== -1) {
            return index;
        }
    }
    for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i];
        if (matchesOption(option, track, matchPredicate)) {
            return i;
        }
    }
    return -1;
}
function matchesOption(option, track, matchPredicate) {
    var groupId = option.groupId, name = option.name, lang = option.lang, assocLang = option.assocLang, isDefault = option.default;
    var forced = option.forced;
    return ((groupId === undefined || track.groupId === groupId) &&
        (name === undefined || track.name === name) &&
        (lang === undefined || track.lang === lang) &&
        (lang === undefined || track.assocLang === assocLang) &&
        (isDefault === undefined || track.default === isDefault) &&
        (forced === undefined || track.forced === forced) &&
        (!('characteristics' in option) ||
            characteristicsMatch(option.characteristics || '', track.characteristics)) &&
        (matchPredicate === undefined || matchPredicate(option, track)));
}
function characteristicsMatch(characteristicsA, characteristicsB) {
    if (characteristicsB === void 0) { characteristicsB = ''; }
    var arrA = characteristicsA.split(',');
    var arrB = characteristicsB.split(',');
    // Expects each item to be unique:
    return (arrA.length === arrB.length && !arrA.some(function (el) { return arrB.indexOf(el) === -1; }));
}
function audioMatchPredicate(option, track) {
    var audioCodec = option.audioCodec, channels = option.channels;
    return ((audioCodec === undefined ||
        (track.audioCodec || '').substring(0, 4) ===
            audioCodec.substring(0, 4)) &&
        (channels === undefined || channels === (track.channels || '2')));
}
function findClosestLevelWithAudioGroup(option, levels, allAudioTracks, searchIndex, matchPredicate) {
    var currentLevel = levels[searchIndex];
    // Are there variants with same URI as current level?
    // If so, find a match that does not require any level URI change
    var variants = levels.reduce(function (variantMap, level, index) {
        var uri = level.uri;
        var renditions = variantMap[uri] || (variantMap[uri] = []);
        renditions.push(index);
        return variantMap;
    }, {});
    var renditions = variants[currentLevel.uri];
    if (renditions.length > 1) {
        searchIndex = Math.max.apply(Math, renditions);
    }
    // Find best match
    var currentVideoRange = currentLevel.videoRange;
    var currentFrameRate = currentLevel.frameRate;
    var currentVideoCodec = currentLevel.codecSet.substring(0, 4);
    var matchingVideo = searchDownAndUpList(levels, searchIndex, function (level) {
        if (level.videoRange !== currentVideoRange ||
            level.frameRate !== currentFrameRate ||
            level.codecSet.substring(0, 4) !== currentVideoCodec) {
            return false;
        }
        var audioGroups = level.audioGroups;
        var tracks = allAudioTracks.filter(function (track) {
            return !audioGroups || audioGroups.indexOf(track.groupId) !== -1;
        });
        return findMatchingOption(option, tracks, matchPredicate) > -1;
    });
    if (matchingVideo > -1) {
        return matchingVideo;
    }
    return searchDownAndUpList(levels, searchIndex, function (level) {
        var audioGroups = level.audioGroups;
        var tracks = allAudioTracks.filter(function (track) {
            return !audioGroups || audioGroups.indexOf(track.groupId) !== -1;
        });
        return findMatchingOption(option, tracks, matchPredicate) > -1;
    });
}
function searchDownAndUpList(arr, searchIndex, predicate) {
    for (var i = searchIndex; i > -1; i--) {
        if (predicate(arr[i])) {
            return i;
        }
    }
    for (var i = searchIndex + 1; i < arr.length; i++) {
        if (predicate(arr[i])) {
            return i;
        }
    }
    return -1;
}
