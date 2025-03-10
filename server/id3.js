"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testables = exports.utf8ArrayToStr = exports.decodeFrame = exports.getID3Frames = exports.isTimeStampFrame = exports.getTimeStamp = exports.canParse = exports.getID3Data = exports.isFooter = exports.isHeader = void 0;
/**
 * Returns true if an ID3 header can be found at offset in data
 * @param data - The data to search
 * @param offset - The offset at which to start searching
 */
var isHeader = function (data, offset) {
    /*
     * http://id3.org/id3v2.3.0
     * [0]     = 'I'
     * [1]     = 'D'
     * [2]     = '3'
     * [3,4]   = {Version}
     * [5]     = {Flags}
     * [6-9]   = {ID3 Size}
     *
     * An ID3v2 tag can be detected with the following pattern:
     *  $49 44 33 yy yy xx zz zz zz zz
     * Where yy is less than $FF, xx is the 'flags' byte and zz is less than $80
     */
    if (offset + 10 <= data.length) {
        // look for 'ID3' identifier
        if (data[offset] === 0x49 &&
            data[offset + 1] === 0x44 &&
            data[offset + 2] === 0x33) {
            // check version is within range
            if (data[offset + 3] < 0xff && data[offset + 4] < 0xff) {
                // check size is within range
                if (data[offset + 6] < 0x80 &&
                    data[offset + 7] < 0x80 &&
                    data[offset + 8] < 0x80 &&
                    data[offset + 9] < 0x80) {
                    return true;
                }
            }
        }
    }
    return false;
};
exports.isHeader = isHeader;
/**
 * Returns true if an ID3 footer can be found at offset in data
 * @param data - The data to search
 * @param offset - The offset at which to start searching
 */
var isFooter = function (data, offset) {
    /*
     * The footer is a copy of the header, but with a different identifier
     */
    if (offset + 10 <= data.length) {
        // look for '3DI' identifier
        if (data[offset] === 0x33 &&
            data[offset + 1] === 0x44 &&
            data[offset + 2] === 0x49) {
            // check version is within range
            if (data[offset + 3] < 0xff && data[offset + 4] < 0xff) {
                // check size is within range
                if (data[offset + 6] < 0x80 &&
                    data[offset + 7] < 0x80 &&
                    data[offset + 8] < 0x80 &&
                    data[offset + 9] < 0x80) {
                    return true;
                }
            }
        }
    }
    return false;
};
exports.isFooter = isFooter;
/**
 * Returns any adjacent ID3 tags found in data starting at offset, as one block of data
 * @param data - The data to search in
 * @param offset - The offset at which to start searching
 * @returns the block of data containing any ID3 tags found
 * or *undefined* if no header is found at the starting offset
 */
var getID3Data = function (data, offset) {
    var front = offset;
    var length = 0;
    while ((0, exports.isHeader)(data, offset)) {
        // ID3 header is 10 bytes
        length += 10;
        var size = readSize(data, offset + 6);
        length += size;
        if ((0, exports.isFooter)(data, offset + 10)) {
            // ID3 footer is 10 bytes
            length += 10;
        }
        offset += length;
    }
    if (length > 0) {
        return data.subarray(front, front + length);
    }
    return undefined;
};
exports.getID3Data = getID3Data;
var readSize = function (data, offset) {
    var size = 0;
    size = (data[offset] & 0x7f) << 21;
    size |= (data[offset + 1] & 0x7f) << 14;
    size |= (data[offset + 2] & 0x7f) << 7;
    size |= data[offset + 3] & 0x7f;
    return size;
};
var canParse = function (data, offset) {
    return ((0, exports.isHeader)(data, offset) &&
        readSize(data, offset + 6) + 10 <= data.length - offset);
};
exports.canParse = canParse;
/**
 * Searches for the Elementary Stream timestamp found in the ID3 data chunk
 * @param data - Block of data containing one or more ID3 tags
 */
var getTimeStamp = function (data) {
    var frames = (0, exports.getID3Frames)(data);
    for (var i = 0; i < frames.length; i++) {
        var frame = frames[i];
        if ((0, exports.isTimeStampFrame)(frame)) {
            return readTimeStamp(frame);
        }
    }
    return undefined;
};
exports.getTimeStamp = getTimeStamp;
/**
 * Returns true if the ID3 frame is an Elementary Stream timestamp frame
 */
var isTimeStampFrame = function (frame) {
    return (frame &&
        frame.key === 'PRIV' &&
        frame.info === 'com.apple.streaming.transportStreamTimestamp');
};
exports.isTimeStampFrame = isTimeStampFrame;
var getFrameData = function (data) {
    /*
    Frame ID       $xx xx xx xx (four characters)
    Size           $xx xx xx xx
    Flags          $xx xx
    */
    var type = String.fromCharCode(data[0], data[1], data[2], data[3]);
    var size = readSize(data, 4);
    // skip frame id, size, and flags
    var offset = 10;
    return { type: type, size: size, data: data.subarray(offset, offset + size) };
};
/**
 * Returns an array of ID3 frames found in all the ID3 tags in the id3Data
 * @param id3Data - The ID3 data containing one or more ID3 tags
 */
var getID3Frames = function (id3Data) {
    var offset = 0;
    var frames = [];
    while ((0, exports.isHeader)(id3Data, offset)) {
        var size = readSize(id3Data, offset + 6);
        // skip past ID3 header
        offset += 10;
        var end = offset + size;
        // loop through frames in the ID3 tag
        while (offset + 8 < end) {
            var frameData = getFrameData(id3Data.subarray(offset));
            var frame = (0, exports.decodeFrame)(frameData);
            if (frame) {
                frames.push(frame);
            }
            // skip frame header and frame data
            offset += frameData.size + 10;
        }
        if ((0, exports.isFooter)(id3Data, offset)) {
            offset += 10;
        }
    }
    return frames;
};
exports.getID3Frames = getID3Frames;
var decodeFrame = function (frame) {
    if (frame.type === 'PRIV') {
        return decodePrivFrame(frame);
    }
    else if (frame.type[0] === 'W') {
        return decodeURLFrame(frame);
    }
    return decodeTextFrame(frame);
};
exports.decodeFrame = decodeFrame;
var decodePrivFrame = function (frame) {
    /*
    Format: <text string>\0<binary data>
    */
    if (frame.size < 2) {
        return undefined;
    }
    var owner = (0, exports.utf8ArrayToStr)(frame.data, true);
    var privateData = new Uint8Array(frame.data.subarray(owner.length + 1));
    return { key: frame.type, info: owner, data: privateData.buffer };
};
var decodeTextFrame = function (frame) {
    if (frame.size < 2) {
        return undefined;
    }
    if (frame.type === 'TXXX') {
        /*
        Format:
        [0]   = {Text Encoding}
        [1-?] = {Description}\0{Value}
        */
        var index = 1;
        var description = (0, exports.utf8ArrayToStr)(frame.data.subarray(index), true);
        index += description.length + 1;
        var value = (0, exports.utf8ArrayToStr)(frame.data.subarray(index));
        return { key: frame.type, info: description, data: value };
    }
    /*
    Format:
    [0]   = {Text Encoding}
    [1-?] = {Value}
    */
    var text = (0, exports.utf8ArrayToStr)(frame.data.subarray(1));
    return { key: frame.type, data: text };
};
var decodeURLFrame = function (frame) {
    if (frame.type === 'WXXX') {
        /*
        Format:
        [0]   = {Text Encoding}
        [1-?] = {Description}\0{URL}
        */
        if (frame.size < 2) {
            return undefined;
        }
        var index = 1;
        var description = (0, exports.utf8ArrayToStr)(frame.data.subarray(index), true);
        index += description.length + 1;
        var value = (0, exports.utf8ArrayToStr)(frame.data.subarray(index));
        return { key: frame.type, info: description, data: value };
    }
    /*
    Format:
    [0-?] = {URL}
    */
    var url = (0, exports.utf8ArrayToStr)(frame.data);
    return { key: frame.type, data: url };
};
var readTimeStamp = function (timeStampFrame) {
    if (timeStampFrame.data.byteLength === 8) {
        var data = new Uint8Array(timeStampFrame.data);
        // timestamp is 33 bit expressed as a big-endian eight-octet number,
        // with the upper 31 bits set to zero.
        var pts33Bit = data[3] & 0x1;
        var timestamp = (data[4] << 23) + (data[5] << 15) + (data[6] << 7) + data[7];
        timestamp /= 45;
        if (pts33Bit) {
            timestamp += 47721858.84;
        } // 2^32 / 90
        return Math.round(timestamp);
    }
    return undefined;
};
// http://stackoverflow.com/questions/8936984/uint8array-to-string-in-javascript/22373197
// http://www.onicos.com/staff/iz/amuse/javascript/expert/utf.txt
/* utf.js - UTF-8 <=> UTF-16 convertion
 *
 * Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
 * Version: 1.0
 * LastModified: Dec 25 1999
 * This library is free.  You can redistribute it and/or modify it.
 */
var utf8ArrayToStr = function (array, exitOnNull) {
    if (exitOnNull === void 0) { exitOnNull = false; }
    var decoder = getTextDecoder();
    if (decoder) {
        var decoded = decoder.decode(array);
        if (exitOnNull) {
            // grab up to the first null
            var idx = decoded.indexOf('\0');
            return idx !== -1 ? decoded.substring(0, idx) : decoded;
        }
        // remove any null characters
        return decoded.replace(/\0/g, '');
    }
    var len = array.length;
    var c;
    var char2;
    var char3;
    var out = '';
    var i = 0;
    while (i < len) {
        c = array[i++];
        if (c === 0x00 && exitOnNull) {
            return out;
        }
        else if (c === 0x00 || c === 0x03) {
            // If the character is 3 (END_OF_TEXT) or 0 (NULL) then skip it
            continue;
        }
        switch (c >> 4) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                // 0xxxxxxx
                out += String.fromCharCode(c);
                break;
            case 12:
            case 13:
                // 110x xxxx   10xx xxxx
                char2 = array[i++];
                out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
                break;
            case 14:
                // 1110 xxxx  10xx xxxx  10xx xxxx
                char2 = array[i++];
                char3 = array[i++];
                out += String.fromCharCode(((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0));
                break;
            default:
        }
    }
    return out;
};
exports.utf8ArrayToStr = utf8ArrayToStr;
exports.testables = {
    decodeTextFrame: decodeTextFrame,
};
var decoder;
function getTextDecoder() {
    // On Play Station 4, TextDecoder is defined but partially implemented.
    // Manual decoding option is preferable
    if (navigator.userAgent.includes('PlayStation 4')) {
        return;
    }
    if (!decoder && typeof self.TextDecoder !== 'undefined') {
        decoder = new self.TextDecoder('utf-8');
    }
    return decoder;
}
