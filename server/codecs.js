"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCodecType = isCodecType;
exports.areCodecsMediaSourceSupported = areCodecsMediaSourceSupported;
exports.mimeTypeForCodec = mimeTypeForCodec;
exports.videoCodecPreferenceValue = videoCodecPreferenceValue;
exports.codecsSetSelectionPreferenceValue = codecsSetSelectionPreferenceValue;
exports.getCodecCompatibleName = getCodecCompatibleName;
exports.pickMostCompleteCodecName = pickMostCompleteCodecName;
exports.convertAVC1ToAVCOTI = convertAVC1ToAVCOTI;
var mediasource_helper_1 = require("./mediasource-helper");
// from http://mp4ra.org/codecs.html
// values indicate codec selection preference (lower is higher priority)
var sampleEntryCodesISO = {
    audio: {
        a3ds: 1,
        'ac-3': 0.95,
        'ac-4': 1,
        alac: 0.9,
        alaw: 1,
        dra1: 1,
        'dts+': 1,
        'dts-': 1,
        dtsc: 1,
        dtse: 1,
        dtsh: 1,
        'ec-3': 0.9,
        enca: 1,
        fLaC: 0.9, // MP4-RA listed codec entry for FLAC
        flac: 0.9, // legacy browser codec name for FLAC
        FLAC: 0.9, // some manifests may list "FLAC" with Apple's tools
        g719: 1,
        g726: 1,
        m4ae: 1,
        mha1: 1,
        mha2: 1,
        mhm1: 1,
        mhm2: 1,
        mlpa: 1,
        mp4a: 1,
        'raw ': 1,
        Opus: 1,
        opus: 1, // browsers expect this to be lowercase despite MP4RA says 'Opus'
        samr: 1,
        sawb: 1,
        sawp: 1,
        sevc: 1,
        sqcp: 1,
        ssmv: 1,
        twos: 1,
        ulaw: 1,
    },
    video: {
        avc1: 1,
        avc2: 1,
        avc3: 1,
        avc4: 1,
        avcp: 1,
        av01: 0.8,
        drac: 1,
        dva1: 1,
        dvav: 1,
        dvh1: 0.7,
        dvhe: 0.7,
        encv: 1,
        hev1: 0.75,
        hvc1: 0.75,
        mjp2: 1,
        mp4v: 1,
        mvc1: 1,
        mvc2: 1,
        mvc3: 1,
        mvc4: 1,
        resv: 1,
        rv60: 1,
        s263: 1,
        svc1: 1,
        svc2: 1,
        'vc-1': 1,
        vp08: 1,
        vp09: 0.9,
    },
    text: {
        stpp: 1,
        wvtt: 1,
    },
};
function isCodecType(codec, type) {
    var typeCodes = sampleEntryCodesISO[type];
    return !!typeCodes && !!typeCodes[codec.slice(0, 4)];
}
function areCodecsMediaSourceSupported(codecs, type, preferManagedMediaSource) {
    if (preferManagedMediaSource === void 0) { preferManagedMediaSource = true; }
    return !codecs
        .split(',')
        .some(function (codec) {
        return !isCodecMediaSourceSupported(codec, type, preferManagedMediaSource);
    });
}
function isCodecMediaSourceSupported(codec, type, preferManagedMediaSource) {
    var _a;
    if (preferManagedMediaSource === void 0) { preferManagedMediaSource = true; }
    var MediaSource = (0, mediasource_helper_1.getMediaSource)(preferManagedMediaSource);
    return (_a = MediaSource === null || MediaSource === void 0 ? void 0 : MediaSource.isTypeSupported(mimeTypeForCodec(codec, type))) !== null && _a !== void 0 ? _a : false;
}
function mimeTypeForCodec(codec, type) {
    return "".concat(type, "/mp4;codecs=\"").concat(codec, "\"");
}
function videoCodecPreferenceValue(videoCodec) {
    if (videoCodec) {
        var fourCC = videoCodec.substring(0, 4);
        return sampleEntryCodesISO.video[fourCC];
    }
    return 2;
}
function codecsSetSelectionPreferenceValue(codecSet) {
    return codecSet.split(',').reduce(function (num, fourCC) {
        var preferenceValue = sampleEntryCodesISO.video[fourCC];
        if (preferenceValue) {
            return (preferenceValue * 2 + num) / (num ? 3 : 2);
        }
        return (sampleEntryCodesISO.audio[fourCC] + num) / (num ? 2 : 1);
    }, 0);
}
var CODEC_COMPATIBLE_NAMES = {};
function getCodecCompatibleNameLower(lowerCaseCodec, preferManagedMediaSource) {
    if (preferManagedMediaSource === void 0) { preferManagedMediaSource = true; }
    if (CODEC_COMPATIBLE_NAMES[lowerCaseCodec]) {
        return CODEC_COMPATIBLE_NAMES[lowerCaseCodec];
    }
    // Idealy fLaC and Opus would be first (spec-compliant) but
    // some browsers will report that fLaC is supported then fail.
    // see: https://bugs.chromium.org/p/chromium/issues/detail?id=1422728
    var codecsToCheck = {
        flac: ['flac', 'fLaC', 'FLAC'],
        opus: ['opus', 'Opus'],
    }[lowerCaseCodec];
    for (var i = 0; i < codecsToCheck.length; i++) {
        if (isCodecMediaSourceSupported(codecsToCheck[i], 'audio', preferManagedMediaSource)) {
            CODEC_COMPATIBLE_NAMES[lowerCaseCodec] = codecsToCheck[i];
            return codecsToCheck[i];
        }
    }
    return lowerCaseCodec;
}
var AUDIO_CODEC_REGEXP = /flac|opus/i;
function getCodecCompatibleName(codec, preferManagedMediaSource) {
    if (preferManagedMediaSource === void 0) { preferManagedMediaSource = true; }
    return codec.replace(AUDIO_CODEC_REGEXP, function (m) {
        return getCodecCompatibleNameLower(m.toLowerCase(), preferManagedMediaSource);
    });
}
function pickMostCompleteCodecName(parsedCodec, levelCodec) {
    // Parsing of mp4a codecs strings in mp4-tools from media is incomplete as of d8c6c7a
    // so use level codec is parsed codec is unavailable or incomplete
    if (parsedCodec && parsedCodec !== 'mp4a') {
        return parsedCodec;
    }
    return levelCodec ? levelCodec.split(',')[0] : levelCodec;
}
function convertAVC1ToAVCOTI(codec) {
    // Convert avc1 codec string from RFC-4281 to RFC-6381 for MediaSource.isTypeSupported
    // Examples: avc1.66.30 to avc1.42001e and avc1.77.30,avc1.66.30 to avc1.4d001e,avc1.42001e.
    var codecs = codec.split(',');
    for (var i = 0; i < codecs.length; i++) {
        var avcdata = codecs[i].split('.');
        if (avcdata.length > 2) {
            var result = avcdata.shift() + '.';
            result += parseInt(avcdata.shift()).toString(16);
            result += ('000' + parseInt(avcdata.shift()).toString(16)).slice(-4);
            codecs[i] = result;
        }
    }
    return codecs.join(',');
}
