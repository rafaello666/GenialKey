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
exports.RemuxerTrackIdConfig = void 0;
exports.bin2str = bin2str;
exports.readUint16 = readUint16;
exports.readUint32 = readUint32;
exports.readUint64 = readUint64;
exports.readSint32 = readSint32;
exports.writeUint32 = writeUint32;
exports.hasMoofData = hasMoofData;
exports.findBox = findBox;
exports.parseSegmentIndex = parseSegmentIndex;
exports.parseInitSegment = parseInitSegment;
exports.patchEncyptionData = patchEncyptionData;
exports.parseSinf = parseSinf;
exports.getStartDTS = getStartDTS;
exports.getDuration = getDuration;
exports.computeRawDurationFromSamples = computeRawDurationFromSamples;
exports.offsetStartDTS = offsetStartDTS;
exports.segmentValidRange = segmentValidRange;
exports.appendUint8Array = appendUint8Array;
exports.parseSamples = parseSamples;
exports.parseSEIMessageFromNALu = parseSEIMessageFromNALu;
exports.discardEPB = discardEPB;
exports.parseEmsg = parseEmsg;
exports.mp4Box = mp4Box;
exports.mp4pssh = mp4pssh;
exports.parseMultiPssh = parseMultiPssh;
var fragment_1 = require("../loader/fragment");
var typed_array_1 = require("./typed-array");
var id3_1 = require("../demux/id3");
var logger_1 = require("../utils/logger");
var hex_1 = require("./hex");
var UINT32_MAX = Math.pow(2, 32) - 1;
var push = [].push;
// We are using fixed track IDs for driving the MP4 remuxer
// instead of following the TS PIDs.
// There is no reason not to do this and some browsers/SourceBuffer-demuxers
// may not like if there are TrackID "switches"
// See https://github.com/video-dev/hls.js/issues/1331
// Here we are mapping our internal track types to constant MP4 track IDs
// With MSE currently one can only have one track of each, and we are muxing
// whatever video/audio rendition in them.
exports.RemuxerTrackIdConfig = {
    video: 1,
    audio: 2,
    id3: 3,
    text: 4,
};
function bin2str(data) {
    return String.fromCharCode.apply(null, data);
}
function readUint16(buffer, offset) {
    var val = (buffer[offset] << 8) | buffer[offset + 1];
    return val < 0 ? 65536 + val : val;
}
function readUint32(buffer, offset) {
    var val = readSint32(buffer, offset);
    return val < 0 ? 4294967296 + val : val;
}
function readUint64(buffer, offset) {
    var result = readUint32(buffer, offset);
    result *= Math.pow(2, 32);
    result += readUint32(buffer, offset + 4);
    return result;
}
function readSint32(buffer, offset) {
    return ((buffer[offset] << 24) |
        (buffer[offset + 1] << 16) |
        (buffer[offset + 2] << 8) |
        buffer[offset + 3]);
}
function writeUint32(buffer, offset, value) {
    buffer[offset] = value >> 24;
    buffer[offset + 1] = (value >> 16) & 0xff;
    buffer[offset + 2] = (value >> 8) & 0xff;
    buffer[offset + 3] = value & 0xff;
}
// Find "moof" box
function hasMoofData(data) {
    var end = data.byteLength;
    for (var i = 0; i < end;) {
        var size = readUint32(data, i);
        if (size > 8 &&
            data[i + 4] === 0x6d &&
            data[i + 5] === 0x6f &&
            data[i + 6] === 0x6f &&
            data[i + 7] === 0x66) {
            return true;
        }
        i = size > 1 ? i + size : end;
    }
    return false;
}
// Find the data for a box specified by its path
function findBox(data, path) {
    var results = [];
    if (!path.length) {
        // short-circuit the search for empty paths
        return results;
    }
    var end = data.byteLength;
    for (var i = 0; i < end;) {
        var size = readUint32(data, i);
        var type = bin2str(data.subarray(i + 4, i + 8));
        var endbox = size > 1 ? i + size : end;
        if (type === path[0]) {
            if (path.length === 1) {
                // this is the end of the path and we've found the box we were
                // looking for
                results.push(data.subarray(i + 8, endbox));
            }
            else {
                // recursively search for the next box along the path
                var subresults = findBox(data.subarray(i + 8, endbox), path.slice(1));
                if (subresults.length) {
                    push.apply(results, subresults);
                }
            }
        }
        i = endbox;
    }
    // we've finished searching all of data
    return results;
}
function parseSegmentIndex(sidx) {
    var references = [];
    var version = sidx[0];
    // set initial offset, we skip the reference ID (not needed)
    var index = 8;
    var timescale = readUint32(sidx, index);
    index += 4;
    var earliestPresentationTime = 0;
    var firstOffset = 0;
    if (version === 0) {
        earliestPresentationTime = readUint32(sidx, index);
        firstOffset = readUint32(sidx, index + 4);
        index += 8;
    }
    else {
        earliestPresentationTime = readUint64(sidx, index);
        firstOffset = readUint64(sidx, index + 8);
        index += 16;
    }
    // skip reserved
    index += 2;
    var startByte = sidx.length + firstOffset;
    var referencesCount = readUint16(sidx, index);
    index += 2;
    for (var i = 0; i < referencesCount; i++) {
        var referenceIndex = index;
        var referenceInfo = readUint32(sidx, referenceIndex);
        referenceIndex += 4;
        var referenceSize = referenceInfo & 0x7fffffff;
        var referenceType = (referenceInfo & 0x80000000) >>> 31;
        if (referenceType === 1) {
            logger_1.logger.warn('SIDX has hierarchical references (not supported)');
            return null;
        }
        var subsegmentDuration = readUint32(sidx, referenceIndex);
        referenceIndex += 4;
        references.push({
            referenceSize: referenceSize,
            subsegmentDuration: subsegmentDuration, // unscaled
            info: {
                duration: subsegmentDuration / timescale,
                start: startByte,
                end: startByte + referenceSize - 1,
            },
        });
        startByte += referenceSize;
        // Skipping 1 bit for |startsWithSap|, 3 bits for |sapType|, and 28 bits
        // for |sapDelta|.
        referenceIndex += 4;
        // skip to next ref
        index = referenceIndex;
    }
    return {
        earliestPresentationTime: earliestPresentationTime,
        timescale: timescale,
        version: version,
        referencesCount: referencesCount,
        references: references,
    };
}
function parseInitSegment(initSegment) {
    var result = [];
    var traks = findBox(initSegment, ['moov', 'trak']);
    for (var i = 0; i < traks.length; i++) {
        var trak = traks[i];
        var tkhd = findBox(trak, ['tkhd'])[0];
        if (tkhd) {
            var version = tkhd[0];
            var trackId = readUint32(tkhd, version === 0 ? 12 : 20);
            var mdhd = findBox(trak, ['mdia', 'mdhd'])[0];
            if (mdhd) {
                version = mdhd[0];
                var timescale = readUint32(mdhd, version === 0 ? 12 : 20);
                var hdlr = findBox(trak, ['mdia', 'hdlr'])[0];
                if (hdlr) {
                    var hdlrType = bin2str(hdlr.subarray(8, 12));
                    var type = {
                        soun: fragment_1.ElementaryStreamTypes.AUDIO,
                        vide: fragment_1.ElementaryStreamTypes.VIDEO,
                    }[hdlrType];
                    if (type) {
                        // Parse codec details
                        var stsd = findBox(trak, ['mdia', 'minf', 'stbl', 'stsd'])[0];
                        var stsdData = parseStsd(stsd);
                        result[trackId] = { timescale: timescale, type: type };
                        result[type] = __assign({ timescale: timescale, id: trackId }, stsdData);
                    }
                }
            }
        }
    }
    var trex = findBox(initSegment, ['moov', 'mvex', 'trex']);
    trex.forEach(function (trex) {
        var trackId = readUint32(trex, 4);
        var track = result[trackId];
        if (track) {
            track.default = {
                duration: readUint32(trex, 12),
                flags: readUint32(trex, 20),
            };
        }
    });
    return result;
}
function parseStsd(stsd) {
    var sampleEntries = stsd.subarray(8);
    var sampleEntriesEnd = sampleEntries.subarray(8 + 78);
    var fourCC = bin2str(sampleEntries.subarray(4, 8));
    var codec = fourCC;
    var encrypted = fourCC === 'enca' || fourCC === 'encv';
    if (encrypted) {
        var encBox = findBox(sampleEntries, [fourCC])[0];
        var encBoxChildren = encBox.subarray(fourCC === 'enca' ? 28 : 78);
        var sinfs = findBox(encBoxChildren, ['sinf']);
        sinfs.forEach(function (sinf) {
            var schm = findBox(sinf, ['schm'])[0];
            if (schm) {
                var scheme = bin2str(schm.subarray(4, 8));
                if (scheme === 'cbcs' || scheme === 'cenc') {
                    var frma = findBox(sinf, ['frma'])[0];
                    if (frma) {
                        // for encrypted content codec fourCC will be in frma
                        codec = bin2str(frma);
                    }
                }
            }
        });
    }
    switch (codec) {
        case 'avc1':
        case 'avc2':
        case 'avc3':
        case 'avc4': {
            // extract profile + compatibility + level out of avcC box
            var avcCBox = findBox(sampleEntriesEnd, ['avcC'])[0];
            codec += '.' + toHex(avcCBox[1]) + toHex(avcCBox[2]) + toHex(avcCBox[3]);
            break;
        }
        case 'mp4a': {
            var codecBox = findBox(sampleEntries, [fourCC])[0];
            var esdsBox = findBox(codecBox.subarray(28), ['esds'])[0];
            if (esdsBox && esdsBox.length > 12) {
                var i = 4;
                // ES Descriptor tag
                if (esdsBox[i++] !== 0x03) {
                    break;
                }
                i = skipBERInteger(esdsBox, i);
                i += 2; // skip es_id;
                var flags = esdsBox[i++];
                if (flags & 0x80) {
                    i += 2; // skip dependency es_id
                }
                if (flags & 0x40) {
                    i += esdsBox[i++]; // skip URL
                }
                // Decoder config descriptor
                if (esdsBox[i++] !== 0x04) {
                    break;
                }
                i = skipBERInteger(esdsBox, i);
                var objectType = esdsBox[i++];
                if (objectType === 0x40) {
                    codec += '.' + toHex(objectType);
                }
                else {
                    break;
                }
                i += 12;
                // Decoder specific info
                if (esdsBox[i++] !== 0x05) {
                    break;
                }
                i = skipBERInteger(esdsBox, i);
                var firstByte = esdsBox[i++];
                var audioObjectType = (firstByte & 0xf8) >> 3;
                if (audioObjectType === 31) {
                    audioObjectType +=
                        1 + ((firstByte & 0x7) << 3) + ((esdsBox[i] & 0xe0) >> 5);
                }
                codec += '.' + audioObjectType;
            }
            break;
        }
        case 'hvc1':
        case 'hev1': {
            var hvcCBox = findBox(sampleEntriesEnd, ['hvcC'])[0];
            var profileByte = hvcCBox[1];
            var profileSpace = ['', 'A', 'B', 'C'][profileByte >> 6];
            var generalProfileIdc = profileByte & 0x1f;
            var profileCompat = readUint32(hvcCBox, 2);
            var tierFlag = (profileByte & 0x20) >> 5 ? 'H' : 'L';
            var levelIDC = hvcCBox[12];
            var constraintIndicator = hvcCBox.subarray(6, 12);
            codec += '.' + profileSpace + generalProfileIdc;
            codec += '.' + profileCompat.toString(16).toUpperCase();
            codec += '.' + tierFlag + levelIDC;
            var constraintString = '';
            for (var i = constraintIndicator.length; i--;) {
                var byte = constraintIndicator[i];
                if (byte || constraintString) {
                    var encodedByte = byte.toString(16).toUpperCase();
                    constraintString = '.' + encodedByte + constraintString;
                }
            }
            codec += constraintString;
            break;
        }
        case 'dvh1':
        case 'dvhe': {
            var dvcCBox = findBox(sampleEntriesEnd, ['dvcC'])[0];
            var profile = (dvcCBox[2] >> 1) & 0x7f;
            var level = ((dvcCBox[2] << 5) & 0x20) | ((dvcCBox[3] >> 3) & 0x1f);
            codec += '.' + addLeadingZero(profile) + '.' + addLeadingZero(level);
            break;
        }
        case 'vp09': {
            var vpcCBox = findBox(sampleEntriesEnd, ['vpcC'])[0];
            var profile = vpcCBox[4];
            var level = vpcCBox[5];
            var bitDepth = (vpcCBox[6] >> 4) & 0x0f;
            codec +=
                '.' +
                    addLeadingZero(profile) +
                    '.' +
                    addLeadingZero(level) +
                    '.' +
                    addLeadingZero(bitDepth);
            break;
        }
        case 'av01': {
            var av1CBox = findBox(sampleEntriesEnd, ['av1C'])[0];
            var profile = av1CBox[1] >>> 5;
            var level = av1CBox[1] & 0x1f;
            var tierFlag = av1CBox[2] >>> 7 ? 'H' : 'M';
            var highBitDepth = (av1CBox[2] & 0x40) >> 6;
            var twelveBit = (av1CBox[2] & 0x20) >> 5;
            var bitDepth = profile === 2 && highBitDepth
                ? twelveBit
                    ? 12
                    : 10
                : highBitDepth
                    ? 10
                    : 8;
            var monochrome = (av1CBox[2] & 0x10) >> 4;
            var chromaSubsamplingX = (av1CBox[2] & 0x08) >> 3;
            var chromaSubsamplingY = (av1CBox[2] & 0x04) >> 2;
            var chromaSamplePosition = av1CBox[2] & 0x03;
            // TODO: parse color_description_present_flag
            // default it to BT.709/limited range for now
            // more info https://aomediacodec.github.io/av1-isobmff/#av1codecconfigurationbox-syntax
            var colorPrimaries = 1;
            var transferCharacteristics = 1;
            var matrixCoefficients = 1;
            var videoFullRangeFlag = 0;
            codec +=
                '.' +
                    profile +
                    '.' +
                    addLeadingZero(level) +
                    tierFlag +
                    '.' +
                    addLeadingZero(bitDepth) +
                    '.' +
                    monochrome +
                    '.' +
                    chromaSubsamplingX +
                    chromaSubsamplingY +
                    chromaSamplePosition +
                    '.' +
                    addLeadingZero(colorPrimaries) +
                    '.' +
                    addLeadingZero(transferCharacteristics) +
                    '.' +
                    addLeadingZero(matrixCoefficients) +
                    '.' +
                    videoFullRangeFlag;
            break;
        }
        case 'ac-3':
        case 'ec-3':
        case 'alac':
        case 'fLaC':
        case 'Opus':
        default:
            break;
    }
    return { codec: codec, encrypted: encrypted };
}
function skipBERInteger(bytes, i) {
    var limit = i + 5;
    while (bytes[i++] & 0x80 && i < limit) { }
    return i;
}
function toHex(x) {
    return ('0' + x.toString(16).toUpperCase()).slice(-2);
}
function addLeadingZero(num) {
    return (num < 10 ? '0' : '') + num;
}
function patchEncyptionData(initSegment, decryptdata) {
    if (!initSegment || !decryptdata) {
        return initSegment;
    }
    var keyId = decryptdata.keyId;
    if (keyId && decryptdata.isCommonEncryption) {
        var traks = findBox(initSegment, ['moov', 'trak']);
        traks.forEach(function (trak) {
            var stsd = findBox(trak, ['mdia', 'minf', 'stbl', 'stsd'])[0];
            // skip the sample entry count
            var sampleEntries = stsd.subarray(8);
            var encBoxes = findBox(sampleEntries, ['enca']);
            var isAudio = encBoxes.length > 0;
            if (!isAudio) {
                encBoxes = findBox(sampleEntries, ['encv']);
            }
            encBoxes.forEach(function (enc) {
                var encBoxChildren = isAudio ? enc.subarray(28) : enc.subarray(78);
                var sinfBoxes = findBox(encBoxChildren, ['sinf']);
                sinfBoxes.forEach(function (sinf) {
                    var tenc = parseSinf(sinf);
                    if (tenc) {
                        // Look for default key id (keyID offset is always 8 within the tenc box):
                        var tencKeyId = tenc.subarray(8, 24);
                        if (!tencKeyId.some(function (b) { return b !== 0; })) {
                            logger_1.logger.log("[eme] Patching keyId in 'enc".concat(isAudio ? 'a' : 'v', ">sinf>>tenc' box: ").concat(hex_1.default.hexDump(tencKeyId), " -> ").concat(hex_1.default.hexDump(keyId)));
                            tenc.set(keyId, 8);
                        }
                    }
                });
            });
        });
    }
    return initSegment;
}
function parseSinf(sinf) {
    var schm = findBox(sinf, ['schm'])[0];
    if (schm) {
        var scheme = bin2str(schm.subarray(4, 8));
        if (scheme === 'cbcs' || scheme === 'cenc') {
            return findBox(sinf, ['schi', 'tenc'])[0];
        }
    }
    return null;
}
/**
 * Determine the base media decode start time, in seconds, for an MP4
 * fragment. If multiple fragments are specified, the earliest time is
 * returned.
 *
 * The base media decode time can be parsed from track fragment
 * metadata:
 * ```
 * moof > traf > tfdt.baseMediaDecodeTime
 * ```
 * It requires the timescale value from the mdhd to interpret.
 *
 * @param initData - a hash of track type to timescale values
 * @param fmp4 - the bytes of the mp4 fragment
 * @returns the earliest base media decode start time for the
 * fragment, in seconds
 */
function getStartDTS(initData, fmp4) {
    // we need info from two children of each track fragment box
    return findBox(fmp4, ['moof', 'traf']).reduce(function (result, traf) {
        var tfdt = findBox(traf, ['tfdt'])[0];
        var version = tfdt[0];
        var start = findBox(traf, ['tfhd']).reduce(function (result, tfhd) {
            // get the track id from the tfhd
            var id = readUint32(tfhd, 4);
            var track = initData[id];
            if (track) {
                var baseTime = readUint32(tfdt, 4);
                if (version === 1) {
                    // If value is too large, assume signed 64-bit. Negative track fragment decode times are invalid, but they exist in the wild.
                    // This prevents large values from being used for initPTS, which can cause playlist sync issues.
                    // https://github.com/video-dev/hls.js/issues/5303
                    if (baseTime === UINT32_MAX) {
                        logger_1.logger.warn("[mp4-demuxer]: Ignoring assumed invalid signed 64-bit track fragment decode time");
                        return result;
                    }
                    baseTime *= UINT32_MAX + 1;
                    baseTime += readUint32(tfdt, 8);
                }
                // assume a 90kHz clock if no timescale was specified
                var scale = track.timescale || 90e3;
                // convert base time to seconds
                var startTime = baseTime / scale;
                if (Number.isFinite(startTime) &&
                    (result === null || startTime < result)) {
                    return startTime;
                }
            }
            return result;
        }, null);
        if (start !== null &&
            Number.isFinite(start) &&
            (result === null || start < result)) {
            return start;
        }
        return result;
    }, null);
}
/*
  For Reference:
  aligned(8) class TrackFragmentHeaderBox
           extends FullBox(‘tfhd’, 0, tf_flags){
     unsigned int(32)  track_ID;
     // all the following are optional fields
     unsigned int(64)  base_data_offset;
     unsigned int(32)  sample_description_index;
     unsigned int(32)  default_sample_duration;
     unsigned int(32)  default_sample_size;
     unsigned int(32)  default_sample_flags
  }
 */
function getDuration(data, initData) {
    var rawDuration = 0;
    var videoDuration = 0;
    var audioDuration = 0;
    var trafs = findBox(data, ['moof', 'traf']);
    for (var i = 0; i < trafs.length; i++) {
        var traf = trafs[i];
        // There is only one tfhd & trun per traf
        // This is true for CMAF style content, and we should perhaps check the ftyp
        // and only look for a single trun then, but for ISOBMFF we should check
        // for multiple track runs.
        var tfhd = findBox(traf, ['tfhd'])[0];
        // get the track id from the tfhd
        var id = readUint32(tfhd, 4);
        var track = initData[id];
        if (!track) {
            continue;
        }
        var trackDefault = track.default;
        var tfhdFlags = readUint32(tfhd, 0) | (trackDefault === null || trackDefault === void 0 ? void 0 : trackDefault.flags);
        var sampleDuration = trackDefault === null || trackDefault === void 0 ? void 0 : trackDefault.duration;
        if (tfhdFlags & 0x000008) {
            // 0x000008 indicates the presence of the default_sample_duration field
            if (tfhdFlags & 0x000002) {
                // 0x000002 indicates the presence of the sample_description_index field, which precedes default_sample_duration
                // If present, the default_sample_duration exists at byte offset 12
                sampleDuration = readUint32(tfhd, 12);
            }
            else {
                // Otherwise, the duration is at byte offset 8
                sampleDuration = readUint32(tfhd, 8);
            }
        }
        // assume a 90kHz clock if no timescale was specified
        var timescale = track.timescale || 90e3;
        var truns = findBox(traf, ['trun']);
        for (var j = 0; j < truns.length; j++) {
            rawDuration = computeRawDurationFromSamples(truns[j]);
            if (!rawDuration && sampleDuration) {
                var sampleCount = readUint32(truns[j], 4);
                rawDuration = sampleDuration * sampleCount;
            }
            if (track.type === fragment_1.ElementaryStreamTypes.VIDEO) {
                videoDuration += rawDuration / timescale;
            }
            else if (track.type === fragment_1.ElementaryStreamTypes.AUDIO) {
                audioDuration += rawDuration / timescale;
            }
        }
    }
    if (videoDuration === 0 && audioDuration === 0) {
        // If duration samples are not available in the traf use sidx subsegment_duration
        var sidxMinStart = Infinity;
        var sidxMaxEnd = 0;
        var sidxDuration = 0;
        var sidxs = findBox(data, ['sidx']);
        for (var i = 0; i < sidxs.length; i++) {
            var sidx = parseSegmentIndex(sidxs[i]);
            if (sidx === null || sidx === void 0 ? void 0 : sidx.references) {
                sidxMinStart = Math.min(sidxMinStart, sidx.earliestPresentationTime / sidx.timescale);
                var subSegmentDuration = sidx.references.reduce(function (dur, ref) { return dur + ref.info.duration || 0; }, 0);
                sidxMaxEnd = Math.max(sidxMaxEnd, subSegmentDuration + sidx.earliestPresentationTime / sidx.timescale);
                sidxDuration = sidxMaxEnd - sidxMinStart;
            }
        }
        if (sidxDuration && Number.isFinite(sidxDuration)) {
            return sidxDuration;
        }
    }
    if (videoDuration) {
        return videoDuration;
    }
    return audioDuration;
}
/*
  For Reference:
  aligned(8) class TrackRunBox
           extends FullBox(‘trun’, version, tr_flags) {
     unsigned int(32)  sample_count;
     // the following are optional fields
     signed int(32) data_offset;
     unsigned int(32)  first_sample_flags;
     // all fields in the following array are optional
     {
        unsigned int(32)  sample_duration;
        unsigned int(32)  sample_size;
        unsigned int(32)  sample_flags
        if (version == 0)
           { unsigned int(32)
        else
           { signed int(32)
     }[ sample_count ]
  }
 */
function computeRawDurationFromSamples(trun) {
    var flags = readUint32(trun, 0);
    // Flags are at offset 0, non-optional sample_count is at offset 4. Therefore we start 8 bytes in.
    // Each field is an int32, which is 4 bytes
    var offset = 8;
    // data-offset-present flag
    if (flags & 0x000001) {
        offset += 4;
    }
    // first-sample-flags-present flag
    if (flags & 0x000004) {
        offset += 4;
    }
    var duration = 0;
    var sampleCount = readUint32(trun, 4);
    for (var i = 0; i < sampleCount; i++) {
        // sample-duration-present flag
        if (flags & 0x000100) {
            var sampleDuration = readUint32(trun, offset);
            duration += sampleDuration;
            offset += 4;
        }
        // sample-size-present flag
        if (flags & 0x000200) {
            offset += 4;
        }
        // sample-flags-present flag
        if (flags & 0x000400) {
            offset += 4;
        }
        // sample-composition-time-offsets-present flag
        if (flags & 0x000800) {
            offset += 4;
        }
    }
    return duration;
}
function offsetStartDTS(initData, fmp4, timeOffset) {
    findBox(fmp4, ['moof', 'traf']).forEach(function (traf) {
        findBox(traf, ['tfhd']).forEach(function (tfhd) {
            // get the track id from the tfhd
            var id = readUint32(tfhd, 4);
            var track = initData[id];
            if (!track) {
                return;
            }
            // assume a 90kHz clock if no timescale was specified
            var timescale = track.timescale || 90e3;
            // get the base media decode time from the tfdt
            findBox(traf, ['tfdt']).forEach(function (tfdt) {
                var version = tfdt[0];
                var offset = timeOffset * timescale;
                if (offset) {
                    var baseMediaDecodeTime = readUint32(tfdt, 4);
                    if (version === 0) {
                        baseMediaDecodeTime -= offset;
                        baseMediaDecodeTime = Math.max(baseMediaDecodeTime, 0);
                        writeUint32(tfdt, 4, baseMediaDecodeTime);
                    }
                    else {
                        baseMediaDecodeTime *= Math.pow(2, 32);
                        baseMediaDecodeTime += readUint32(tfdt, 8);
                        baseMediaDecodeTime -= offset;
                        baseMediaDecodeTime = Math.max(baseMediaDecodeTime, 0);
                        var upper = Math.floor(baseMediaDecodeTime / (UINT32_MAX + 1));
                        var lower = Math.floor(baseMediaDecodeTime % (UINT32_MAX + 1));
                        writeUint32(tfdt, 4, upper);
                        writeUint32(tfdt, 8, lower);
                    }
                }
            });
        });
    });
}
// TODO: Check if the last moof+mdat pair is part of the valid range
function segmentValidRange(data) {
    var segmentedRange = {
        valid: null,
        remainder: null,
    };
    var moofs = findBox(data, ['moof']);
    if (moofs.length < 2) {
        segmentedRange.remainder = data;
        return segmentedRange;
    }
    var last = moofs[moofs.length - 1];
    // Offset by 8 bytes; findBox offsets the start by as much
    segmentedRange.valid = (0, typed_array_1.sliceUint8)(data, 0, last.byteOffset - 8);
    segmentedRange.remainder = (0, typed_array_1.sliceUint8)(data, last.byteOffset - 8);
    return segmentedRange;
}
function appendUint8Array(data1, data2) {
    var temp = new Uint8Array(data1.length + data2.length);
    temp.set(data1);
    temp.set(data2, data1.length);
    return temp;
}
function parseSamples(timeOffset, track) {
    var seiSamples = [];
    var videoData = track.samples;
    var timescale = track.timescale;
    var trackId = track.id;
    var isHEVCFlavor = false;
    var moofs = findBox(videoData, ['moof']);
    moofs.map(function (moof) {
        var moofOffset = moof.byteOffset - 8;
        var trafs = findBox(moof, ['traf']);
        trafs.map(function (traf) {
            // get the base media decode time from the tfdt
            var baseTime = findBox(traf, ['tfdt']).map(function (tfdt) {
                var version = tfdt[0];
                var result = readUint32(tfdt, 4);
                if (version === 1) {
                    result *= Math.pow(2, 32);
                    result += readUint32(tfdt, 8);
                }
                return result / timescale;
            })[0];
            if (baseTime !== undefined) {
                timeOffset = baseTime;
            }
            return findBox(traf, ['tfhd']).map(function (tfhd) {
                var id = readUint32(tfhd, 4);
                var tfhdFlags = readUint32(tfhd, 0) & 0xffffff;
                var baseDataOffsetPresent = (tfhdFlags & 0x000001) !== 0;
                var sampleDescriptionIndexPresent = (tfhdFlags & 0x000002) !== 0;
                var defaultSampleDurationPresent = (tfhdFlags & 0x000008) !== 0;
                var defaultSampleDuration = 0;
                var defaultSampleSizePresent = (tfhdFlags & 0x000010) !== 0;
                var defaultSampleSize = 0;
                var defaultSampleFlagsPresent = (tfhdFlags & 0x000020) !== 0;
                var tfhdOffset = 8;
                if (id === trackId) {
                    if (baseDataOffsetPresent) {
                        tfhdOffset += 8;
                    }
                    if (sampleDescriptionIndexPresent) {
                        tfhdOffset += 4;
                    }
                    if (defaultSampleDurationPresent) {
                        defaultSampleDuration = readUint32(tfhd, tfhdOffset);
                        tfhdOffset += 4;
                    }
                    if (defaultSampleSizePresent) {
                        defaultSampleSize = readUint32(tfhd, tfhdOffset);
                        tfhdOffset += 4;
                    }
                    if (defaultSampleFlagsPresent) {
                        tfhdOffset += 4;
                    }
                    if (track.type === 'video') {
                        isHEVCFlavor = isHEVC(track.codec);
                    }
                    findBox(traf, ['trun']).map(function (trun) {
                        var version = trun[0];
                        var flags = readUint32(trun, 0) & 0xffffff;
                        var dataOffsetPresent = (flags & 0x000001) !== 0;
                        var dataOffset = 0;
                        var firstSampleFlagsPresent = (flags & 0x000004) !== 0;
                        var sampleDurationPresent = (flags & 0x000100) !== 0;
                        var sampleDuration = 0;
                        var sampleSizePresent = (flags & 0x000200) !== 0;
                        var sampleSize = 0;
                        var sampleFlagsPresent = (flags & 0x000400) !== 0;
                        var sampleCompositionOffsetsPresent = (flags & 0x000800) !== 0;
                        var compositionOffset = 0;
                        var sampleCount = readUint32(trun, 4);
                        var trunOffset = 8; // past version, flags, and sample count
                        if (dataOffsetPresent) {
                            dataOffset = readUint32(trun, trunOffset);
                            trunOffset += 4;
                        }
                        if (firstSampleFlagsPresent) {
                            trunOffset += 4;
                        }
                        var sampleOffset = dataOffset + moofOffset;
                        for (var ix = 0; ix < sampleCount; ix++) {
                            if (sampleDurationPresent) {
                                sampleDuration = readUint32(trun, trunOffset);
                                trunOffset += 4;
                            }
                            else {
                                sampleDuration = defaultSampleDuration;
                            }
                            if (sampleSizePresent) {
                                sampleSize = readUint32(trun, trunOffset);
                                trunOffset += 4;
                            }
                            else {
                                sampleSize = defaultSampleSize;
                            }
                            if (sampleFlagsPresent) {
                                trunOffset += 4;
                            }
                            if (sampleCompositionOffsetsPresent) {
                                if (version === 0) {
                                    compositionOffset = readUint32(trun, trunOffset);
                                }
                                else {
                                    compositionOffset = readSint32(trun, trunOffset);
                                }
                                trunOffset += 4;
                            }
                            if (track.type === fragment_1.ElementaryStreamTypes.VIDEO) {
                                var naluTotalSize = 0;
                                while (naluTotalSize < sampleSize) {
                                    var naluSize = readUint32(videoData, sampleOffset);
                                    sampleOffset += 4;
                                    if (isSEIMessage(isHEVCFlavor, videoData[sampleOffset])) {
                                        var data = videoData.subarray(sampleOffset, sampleOffset + naluSize);
                                        parseSEIMessageFromNALu(data, isHEVCFlavor ? 2 : 1, timeOffset + compositionOffset / timescale, seiSamples);
                                    }
                                    sampleOffset += naluSize;
                                    naluTotalSize += naluSize + 4;
                                }
                            }
                            timeOffset += sampleDuration / timescale;
                        }
                    });
                }
            });
        });
    });
    return seiSamples;
}
function isHEVC(codec) {
    if (!codec) {
        return false;
    }
    var delimit = codec.indexOf('.');
    var baseCodec = delimit < 0 ? codec : codec.substring(0, delimit);
    return (baseCodec === 'hvc1' ||
        baseCodec === 'hev1' ||
        // Dolby Vision
        baseCodec === 'dvh1' ||
        baseCodec === 'dvhe');
}
function isSEIMessage(isHEVCFlavor, naluHeader) {
    if (isHEVCFlavor) {
        var naluType = (naluHeader >> 1) & 0x3f;
        return naluType === 39 || naluType === 40;
    }
    else {
        var naluType = naluHeader & 0x1f;
        return naluType === 6;
    }
}
function parseSEIMessageFromNALu(unescapedData, headerSize, pts, samples) {
    var data = discardEPB(unescapedData);
    var seiPtr = 0;
    // skip nal header
    seiPtr += headerSize;
    var payloadType = 0;
    var payloadSize = 0;
    var b = 0;
    while (seiPtr < data.length) {
        payloadType = 0;
        do {
            if (seiPtr >= data.length) {
                break;
            }
            b = data[seiPtr++];
            payloadType += b;
        } while (b === 0xff);
        // Parse payload size.
        payloadSize = 0;
        do {
            if (seiPtr >= data.length) {
                break;
            }
            b = data[seiPtr++];
            payloadSize += b;
        } while (b === 0xff);
        var leftOver = data.length - seiPtr;
        // Create a variable to process the payload
        var payPtr = seiPtr;
        // Increment the seiPtr to the end of the payload
        if (payloadSize < leftOver) {
            seiPtr += payloadSize;
        }
        else if (payloadSize > leftOver) {
            // Some type of corruption has happened?
            logger_1.logger.error("Malformed SEI payload. ".concat(payloadSize, " is too small, only ").concat(leftOver, " bytes left to parse."));
            // We might be able to parse some data, but let's be safe and ignore it.
            break;
        }
        if (payloadType === 4) {
            var countryCode = data[payPtr++];
            if (countryCode === 181) {
                var providerCode = readUint16(data, payPtr);
                payPtr += 2;
                if (providerCode === 49) {
                    var userStructure = readUint32(data, payPtr);
                    payPtr += 4;
                    if (userStructure === 0x47413934) {
                        var userDataType = data[payPtr++];
                        // Raw CEA-608 bytes wrapped in CEA-708 packet
                        if (userDataType === 3) {
                            var firstByte = data[payPtr++];
                            var totalCCs = 0x1f & firstByte;
                            var enabled = 0x40 & firstByte;
                            var totalBytes = enabled ? 2 + totalCCs * 3 : 0;
                            var byteArray = new Uint8Array(totalBytes);
                            if (enabled) {
                                byteArray[0] = firstByte;
                                for (var i = 1; i < totalBytes; i++) {
                                    byteArray[i] = data[payPtr++];
                                }
                            }
                            samples.push({
                                type: userDataType,
                                payloadType: payloadType,
                                pts: pts,
                                bytes: byteArray,
                            });
                        }
                    }
                }
            }
        }
        else if (payloadType === 5) {
            if (payloadSize > 16) {
                var uuidStrArray = [];
                for (var i = 0; i < 16; i++) {
                    var b_1 = data[payPtr++].toString(16);
                    uuidStrArray.push(b_1.length == 1 ? '0' + b_1 : b_1);
                    if (i === 3 || i === 5 || i === 7 || i === 9) {
                        uuidStrArray.push('-');
                    }
                }
                var length_1 = payloadSize - 16;
                var userDataBytes = new Uint8Array(length_1);
                for (var i = 0; i < length_1; i++) {
                    userDataBytes[i] = data[payPtr++];
                }
                samples.push({
                    payloadType: payloadType,
                    pts: pts,
                    uuid: uuidStrArray.join(''),
                    userData: (0, id3_1.utf8ArrayToStr)(userDataBytes),
                    userDataBytes: userDataBytes,
                });
            }
        }
    }
}
/**
 * remove Emulation Prevention bytes from a RBSP
 */
function discardEPB(data) {
    var length = data.byteLength;
    var EPBPositions = [];
    var i = 1;
    // Find all `Emulation Prevention Bytes`
    while (i < length - 2) {
        if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0x03) {
            EPBPositions.push(i + 2);
            i += 2;
        }
        else {
            i++;
        }
    }
    // If no Emulation Prevention Bytes were found just return the original
    // array
    if (EPBPositions.length === 0) {
        return data;
    }
    // Create a new array to hold the NAL unit data
    var newLength = length - EPBPositions.length;
    var newData = new Uint8Array(newLength);
    var sourceIndex = 0;
    for (i = 0; i < newLength; sourceIndex++, i++) {
        if (sourceIndex === EPBPositions[0]) {
            // Skip this byte
            sourceIndex++;
            // Remove this position index
            EPBPositions.shift();
        }
        newData[i] = data[sourceIndex];
    }
    return newData;
}
function parseEmsg(data) {
    var version = data[0];
    var schemeIdUri = '';
    var value = '';
    var timeScale = 0;
    var presentationTimeDelta = 0;
    var presentationTime = 0;
    var eventDuration = 0;
    var id = 0;
    var offset = 0;
    if (version === 0) {
        while (bin2str(data.subarray(offset, offset + 1)) !== '\0') {
            schemeIdUri += bin2str(data.subarray(offset, offset + 1));
            offset += 1;
        }
        schemeIdUri += bin2str(data.subarray(offset, offset + 1));
        offset += 1;
        while (bin2str(data.subarray(offset, offset + 1)) !== '\0') {
            value += bin2str(data.subarray(offset, offset + 1));
            offset += 1;
        }
        value += bin2str(data.subarray(offset, offset + 1));
        offset += 1;
        timeScale = readUint32(data, 12);
        presentationTimeDelta = readUint32(data, 16);
        eventDuration = readUint32(data, 20);
        id = readUint32(data, 24);
        offset = 28;
    }
    else if (version === 1) {
        offset += 4;
        timeScale = readUint32(data, offset);
        offset += 4;
        var leftPresentationTime = readUint32(data, offset);
        offset += 4;
        var rightPresentationTime = readUint32(data, offset);
        offset += 4;
        presentationTime = Math.pow(2, 32) * leftPresentationTime + rightPresentationTime;
        if (!Number.isSafeInteger(presentationTime)) {
            presentationTime = Number.MAX_SAFE_INTEGER;
            logger_1.logger.warn('Presentation time exceeds safe integer limit and wrapped to max safe integer in parsing emsg box');
        }
        eventDuration = readUint32(data, offset);
        offset += 4;
        id = readUint32(data, offset);
        offset += 4;
        while (bin2str(data.subarray(offset, offset + 1)) !== '\0') {
            schemeIdUri += bin2str(data.subarray(offset, offset + 1));
            offset += 1;
        }
        schemeIdUri += bin2str(data.subarray(offset, offset + 1));
        offset += 1;
        while (bin2str(data.subarray(offset, offset + 1)) !== '\0') {
            value += bin2str(data.subarray(offset, offset + 1));
            offset += 1;
        }
        value += bin2str(data.subarray(offset, offset + 1));
        offset += 1;
    }
    var payload = data.subarray(offset, data.byteLength);
    return {
        schemeIdUri: schemeIdUri,
        value: value,
        timeScale: timeScale,
        presentationTime: presentationTime,
        presentationTimeDelta: presentationTimeDelta,
        eventDuration: eventDuration,
        id: id,
        payload: payload,
    };
}
function mp4Box(type) {
    var payload = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        payload[_i - 1] = arguments[_i];
    }
    var len = payload.length;
    var size = 8;
    var i = len;
    while (i--) {
        size += payload[i].byteLength;
    }
    var result = new Uint8Array(size);
    result[0] = (size >> 24) & 0xff;
    result[1] = (size >> 16) & 0xff;
    result[2] = (size >> 8) & 0xff;
    result[3] = size & 0xff;
    result.set(type, 4);
    for (i = 0, size = 8; i < len; i++) {
        result.set(payload[i], size);
        size += payload[i].byteLength;
    }
    return result;
}
function mp4pssh(systemId, keyids, data) {
    if (systemId.byteLength !== 16) {
        throw new RangeError('Invalid system id');
    }
    var version;
    var kids;
    if (keyids) {
        version = 1;
        kids = new Uint8Array(keyids.length * 16);
        for (var ix = 0; ix < keyids.length; ix++) {
            var k = keyids[ix]; // uint8array
            if (k.byteLength !== 16) {
                throw new RangeError('Invalid key');
            }
            kids.set(k, ix * 16);
        }
    }
    else {
        version = 0;
        kids = new Uint8Array();
    }
    var kidCount;
    if (version > 0) {
        kidCount = new Uint8Array(4);
        if (keyids.length > 0) {
            new DataView(kidCount.buffer).setUint32(0, keyids.length, false);
        }
    }
    else {
        kidCount = new Uint8Array();
    }
    var dataSize = new Uint8Array(4);
    if (data && data.byteLength > 0) {
        new DataView(dataSize.buffer).setUint32(0, data.byteLength, false);
    }
    return mp4Box([112, 115, 115, 104], new Uint8Array([
        version,
        0x00,
        0x00,
        0x00, // Flags
    ]), systemId, // 16 bytes
    kidCount, kids, dataSize, data || new Uint8Array());
}
function parseMultiPssh(initData) {
    var results = [];
    if (initData instanceof ArrayBuffer) {
        var length_2 = initData.byteLength;
        var offset = 0;
        while (offset + 32 < length_2) {
            var view = new DataView(initData, offset);
            var pssh = parsePssh(view);
            results.push(pssh);
            offset += pssh.size;
        }
    }
    return results;
}
function parsePssh(view) {
    var size = view.getUint32(0);
    var offset = view.byteOffset;
    var length = view.byteLength;
    if (length < size) {
        return {
            offset: offset,
            size: length,
        };
    }
    var type = view.getUint32(4);
    if (type !== 0x70737368) {
        return { offset: offset, size: size };
    }
    var version = view.getUint32(8) >>> 24;
    if (version !== 0 && version !== 1) {
        return { offset: offset, size: size };
    }
    var buffer = view.buffer;
    var systemId = hex_1.default.hexDump(new Uint8Array(buffer, offset + 12, 16));
    var dataSizeOrKidCount = view.getUint32(28);
    var kids = null;
    var data = null;
    if (version === 0) {
        if (size - 32 < dataSizeOrKidCount || dataSizeOrKidCount < 22) {
            return { offset: offset, size: size };
        }
        data = new Uint8Array(buffer, offset + 32, dataSizeOrKidCount);
    }
    else if (version === 1) {
        if (!dataSizeOrKidCount ||
            length < offset + 32 + dataSizeOrKidCount * 16 + 16) {
            return { offset: offset, size: size };
        }
        kids = [];
        for (var i = 0; i < dataSizeOrKidCount; i++) {
            kids.push(new Uint8Array(buffer, offset + 32 + i * 16, 16));
        }
    }
    return {
        version: version,
        systemId: systemId,
        kids: kids,
        data: data,
        offset: offset,
        size: size,
    };
}
