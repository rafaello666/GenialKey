"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendFrame = appendFrame;
exports.parseHeader = parseHeader;
exports.isHeaderPattern = isHeaderPattern;
exports.isHeader = isHeader;
exports.canParse = canParse;
exports.probe = probe;
var chromeVersion = null;
var BitratesMap = [
    32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, 32, 48, 56,
    64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384, 32, 40, 48, 56, 64, 80,
    96, 112, 128, 160, 192, 224, 256, 320, 32, 48, 56, 64, 80, 96, 112, 128, 144,
    160, 176, 192, 224, 256, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144,
    160,
];
var SamplingRateMap = [
    44100, 48000, 32000, 22050, 24000, 16000, 11025, 12000, 8000,
];
var SamplesCoefficients = [
    // MPEG 2.5
    [
        0, // Reserved
        72, // Layer3
        144, // Layer2
        12, // Layer1
    ],
    // Reserved
    [
        0, // Reserved
        0, // Layer3
        0, // Layer2
        0, // Layer1
    ],
    // MPEG 2
    [
        0, // Reserved
        72, // Layer3
        144, // Layer2
        12, // Layer1
    ],
    // MPEG 1
    [
        0, // Reserved
        144, // Layer3
        144, // Layer2
        12, // Layer1
    ],
];
var BytesInSlot = [
    0, // Reserved
    1, // Layer3
    1, // Layer2
    4, // Layer1
];
function appendFrame(track, data, offset, pts, frameIndex) {
    // Using http://www.datavoyage.com/mpgscript/mpeghdr.htm as a reference
    if (offset + 24 > data.length) {
        return;
    }
    var header = parseHeader(data, offset);
    if (header && offset + header.frameLength <= data.length) {
        var frameDuration = (header.samplesPerFrame * 90000) / header.sampleRate;
        var stamp = pts + frameIndex * frameDuration;
        var sample = {
            unit: data.subarray(offset, offset + header.frameLength),
            pts: stamp,
            dts: stamp,
        };
        track.config = [];
        track.channelCount = header.channelCount;
        track.samplerate = header.sampleRate;
        track.samples.push(sample);
        return { sample: sample, length: header.frameLength, missing: 0 };
    }
}
function parseHeader(data, offset) {
    var mpegVersion = (data[offset + 1] >> 3) & 3;
    var mpegLayer = (data[offset + 1] >> 1) & 3;
    var bitRateIndex = (data[offset + 2] >> 4) & 15;
    var sampleRateIndex = (data[offset + 2] >> 2) & 3;
    if (mpegVersion !== 1 &&
        bitRateIndex !== 0 &&
        bitRateIndex !== 15 &&
        sampleRateIndex !== 3) {
        var paddingBit = (data[offset + 2] >> 1) & 1;
        var channelMode = data[offset + 3] >> 6;
        var columnInBitrates = mpegVersion === 3 ? 3 - mpegLayer : mpegLayer === 3 ? 3 : 4;
        var bitRate = BitratesMap[columnInBitrates * 14 + bitRateIndex - 1] * 1000;
        var columnInSampleRates = mpegVersion === 3 ? 0 : mpegVersion === 2 ? 1 : 2;
        var sampleRate = SamplingRateMap[columnInSampleRates * 3 + sampleRateIndex];
        var channelCount = channelMode === 3 ? 1 : 2; // If bits of channel mode are `11` then it is a single channel (Mono)
        var sampleCoefficient = SamplesCoefficients[mpegVersion][mpegLayer];
        var bytesInSlot = BytesInSlot[mpegLayer];
        var samplesPerFrame = sampleCoefficient * 8 * bytesInSlot;
        var frameLength = Math.floor((sampleCoefficient * bitRate) / sampleRate + paddingBit) *
            bytesInSlot;
        if (chromeVersion === null) {
            var userAgent = navigator.userAgent || '';
            var result = userAgent.match(/Chrome\/(\d+)/i);
            chromeVersion = result ? parseInt(result[1]) : 0;
        }
        var needChromeFix = !!chromeVersion && chromeVersion <= 87;
        if (needChromeFix &&
            mpegLayer === 2 &&
            bitRate >= 224000 &&
            channelMode === 0) {
            // Work around bug in Chromium by setting channelMode to dual-channel (01) instead of stereo (00)
            data[offset + 3] = data[offset + 3] | 0x80;
        }
        return { sampleRate: sampleRate, channelCount: channelCount, frameLength: frameLength, samplesPerFrame: samplesPerFrame };
    }
}
function isHeaderPattern(data, offset) {
    return (data[offset] === 0xff &&
        (data[offset + 1] & 0xe0) === 0xe0 &&
        (data[offset + 1] & 0x06) !== 0x00);
}
function isHeader(data, offset) {
    // Look for MPEG header | 1111 1111 | 111X XYZX | where X can be either 0 or 1 and Y or Z should be 1
    // Layer bits (position 14 and 15) in header should be always different from 0 (Layer I or Layer II or Layer III)
    // More info http://www.mp3-tech.org/programmer/frame_header.html
    return offset + 1 < data.length && isHeaderPattern(data, offset);
}
function canParse(data, offset) {
    var headerSize = 4;
    return isHeaderPattern(data, offset) && headerSize <= data.length - offset;
}
function probe(data, offset) {
    // same as isHeader but we also check that MPEG frame follows last MPEG frame
    // or end of data is reached
    if (offset + 1 < data.length && isHeaderPattern(data, offset)) {
        // MPEG header Length
        var headerLength = 4;
        // MPEG frame Length
        var header = parseHeader(data, offset);
        var frameLength = headerLength;
        if (header === null || header === void 0 ? void 0 : header.frameLength) {
            frameLength = header.frameLength;
        }
        var newOffset = offset + frameLength;
        return newOffset === data.length || isHeader(data, newOffset);
    }
    return false;
}
