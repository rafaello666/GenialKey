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
exports.SUPPORTED_INFO_CACHE = exports.SUPPORTED_INFO_DEFAULT = void 0;
exports.requiresMediaCapabilitiesDecodingInfo = requiresMediaCapabilitiesDecodingInfo;
exports.getMediaDecodingInfoPromise = getMediaDecodingInfoPromise;
var codecs_1 = require("./codecs");
exports.SUPPORTED_INFO_DEFAULT = {
    supported: true,
    configurations: [],
    decodingInfoResults: [
        {
            supported: true,
            powerEfficient: true,
            smooth: true,
        },
    ],
};
exports.SUPPORTED_INFO_CACHE = {};
function requiresMediaCapabilitiesDecodingInfo(level, audioTracksByGroup, currentVideoRange, currentFrameRate, currentBw, audioPreference) {
    // Only test support when configuration is exceeds minimum options
    var audioGroups = level.audioCodec ? level.audioGroups : null;
    var audioCodecPreference = audioPreference === null || audioPreference === void 0 ? void 0 : audioPreference.audioCodec;
    var channelsPreference = audioPreference === null || audioPreference === void 0 ? void 0 : audioPreference.channels;
    var maxChannels = channelsPreference
        ? parseInt(channelsPreference)
        : audioCodecPreference
            ? Infinity
            : 2;
    var audioChannels = null;
    if (audioGroups === null || audioGroups === void 0 ? void 0 : audioGroups.length) {
        try {
            if (audioGroups.length === 1 && audioGroups[0]) {
                audioChannels = audioTracksByGroup.groups[audioGroups[0]].channels;
            }
            else {
                audioChannels = audioGroups.reduce(function (acc, groupId) {
                    if (groupId) {
                        var audioTrackGroup_1 = audioTracksByGroup.groups[groupId];
                        if (!audioTrackGroup_1) {
                            throw new Error("Audio track group ".concat(groupId, " not found"));
                        }
                        // Sum all channel key values
                        Object.keys(audioTrackGroup_1.channels).forEach(function (key) {
                            acc[key] = (acc[key] || 0) + audioTrackGroup_1.channels[key];
                        });
                    }
                    return acc;
                }, { 2: 0 });
            }
        }
        catch (error) {
            return true;
        }
    }
    return ((level.videoCodec !== undefined &&
        ((level.width > 1920 && level.height > 1088) ||
            (level.height > 1920 && level.width > 1088) ||
            level.frameRate > Math.max(currentFrameRate, 30) ||
            (level.videoRange !== 'SDR' &&
                level.videoRange !== currentVideoRange) ||
            level.bitrate > Math.max(currentBw, 8e6))) ||
        (!!audioChannels &&
            Number.isFinite(maxChannels) &&
            Object.keys(audioChannels).some(function (channels) { return parseInt(channels) > maxChannels; })));
}
function getMediaDecodingInfoPromise(level, audioTracksByGroup, mediaCapabilities) {
    var videoCodecs = level.videoCodec;
    var audioCodecs = level.audioCodec;
    if (!videoCodecs || !audioCodecs || !mediaCapabilities) {
        return Promise.resolve(exports.SUPPORTED_INFO_DEFAULT);
    }
    var baseVideoConfiguration = {
        width: level.width,
        height: level.height,
        bitrate: Math.ceil(Math.max(level.bitrate * 0.9, level.averageBitrate)),
        // Assume a framerate of 30fps since MediaCapabilities will not accept Level default of 0.
        framerate: level.frameRate || 30,
    };
    var videoRange = level.videoRange;
    if (videoRange !== 'SDR') {
        baseVideoConfiguration.transferFunction =
            videoRange.toLowerCase();
    }
    var configurations = videoCodecs
        .split(',')
        .map(function (videoCodec) { return ({
        type: 'media-source',
        video: __assign(__assign({}, baseVideoConfiguration), { contentType: (0, codecs_1.mimeTypeForCodec)(videoCodec, 'video') }),
    }); });
    if (audioCodecs && level.audioGroups) {
        level.audioGroups.forEach(function (audioGroupId) {
            var _a;
            if (!audioGroupId) {
                return;
            }
            (_a = audioTracksByGroup.groups[audioGroupId]) === null || _a === void 0 ? void 0 : _a.tracks.forEach(function (audioTrack) {
                if (audioTrack.groupId === audioGroupId) {
                    var channels = audioTrack.channels || '';
                    var channelsNumber_1 = parseFloat(channels);
                    if (Number.isFinite(channelsNumber_1) && channelsNumber_1 > 2) {
                        configurations.push.apply(configurations, audioCodecs.split(',').map(function (audioCodec) { return ({
                            type: 'media-source',
                            audio: {
                                contentType: (0, codecs_1.mimeTypeForCodec)(audioCodec, 'audio'),
                                channels: '' + channelsNumber_1,
                                // spatialRendering:
                                //   audioCodec === 'ec-3' && channels.indexOf('JOC'),
                            },
                        }); }));
                    }
                }
            });
        });
    }
    return Promise.all(configurations.map(function (configuration) {
        // Cache MediaCapabilities promises
        var decodingInfoKey = getMediaDecodingInfoKey(configuration);
        return (exports.SUPPORTED_INFO_CACHE[decodingInfoKey] ||
            (exports.SUPPORTED_INFO_CACHE[decodingInfoKey] =
                mediaCapabilities.decodingInfo(configuration)));
    }))
        .then(function (decodingInfoResults) { return ({
        supported: !decodingInfoResults.some(function (info) { return !info.supported; }),
        configurations: configurations,
        decodingInfoResults: decodingInfoResults,
    }); })
        .catch(function (error) { return ({
        supported: false,
        configurations: configurations,
        decodingInfoResults: [],
        error: error,
    }); });
}
function getMediaDecodingInfoKey(config) {
    var audio = config.audio, video = config.video;
    var mediaConfig = video || audio;
    if (mediaConfig) {
        var codec = mediaConfig.contentType.split('"')[1];
        if (video) {
            return "r".concat(video.height, "x").concat(video.width, "f").concat(Math.ceil(video.framerate)).concat(video.transferFunction || 'sd', "_").concat(codec, "_").concat(Math.ceil(video.bitrate / 1e5));
        }
        if (audio) {
            return "c".concat(audio.channels).concat(audio.spatialRendering ? 's' : 'n', "_").concat(codec);
        }
    }
    return '';
}
