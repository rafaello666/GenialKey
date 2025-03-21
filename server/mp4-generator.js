"use strict";
/**
 * Generate MP4 Box
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var mp4_tools_1 = require("../utils/mp4-tools");
var UINT32_MAX = Math.pow(2, 32) - 1;
var MP4 = /** @class */ (function () {
    function MP4() {
    }
    MP4.init = function () {
        MP4.types = {
            avc1: [], // codingname
            avcC: [],
            btrt: [],
            dinf: [],
            dref: [],
            esds: [],
            ftyp: [],
            hdlr: [],
            mdat: [],
            mdhd: [],
            mdia: [],
            mfhd: [],
            minf: [],
            moof: [],
            moov: [],
            mp4a: [],
            '.mp3': [],
            dac3: [],
            'ac-3': [],
            mvex: [],
            mvhd: [],
            pasp: [],
            sdtp: [],
            stbl: [],
            stco: [],
            stsc: [],
            stsd: [],
            stsz: [],
            stts: [],
            tfdt: [],
            tfhd: [],
            traf: [],
            trak: [],
            trun: [],
            trex: [],
            tkhd: [],
            vmhd: [],
            smhd: [],
        };
        var i;
        for (i in MP4.types) {
            if (MP4.types.hasOwnProperty(i)) {
                MP4.types[i] = [
                    i.charCodeAt(0),
                    i.charCodeAt(1),
                    i.charCodeAt(2),
                    i.charCodeAt(3),
                ];
            }
        }
        var videoHdlr = new Uint8Array([
            0x00, // version 0
            0x00,
            0x00,
            0x00, // flags
            0x00,
            0x00,
            0x00,
            0x00, // pre_defined
            0x76,
            0x69,
            0x64,
            0x65, // handler_type: 'vide'
            0x00,
            0x00,
            0x00,
            0x00, // reserved
            0x00,
            0x00,
            0x00,
            0x00, // reserved
            0x00,
            0x00,
            0x00,
            0x00, // reserved
            0x56,
            0x69,
            0x64,
            0x65,
            0x6f,
            0x48,
            0x61,
            0x6e,
            0x64,
            0x6c,
            0x65,
            0x72,
            0x00, // name: 'VideoHandler'
        ]);
        var audioHdlr = new Uint8Array([
            0x00, // version 0
            0x00,
            0x00,
            0x00, // flags
            0x00,
            0x00,
            0x00,
            0x00, // pre_defined
            0x73,
            0x6f,
            0x75,
            0x6e, // handler_type: 'soun'
            0x00,
            0x00,
            0x00,
            0x00, // reserved
            0x00,
            0x00,
            0x00,
            0x00, // reserved
            0x00,
            0x00,
            0x00,
            0x00, // reserved
            0x53,
            0x6f,
            0x75,
            0x6e,
            0x64,
            0x48,
            0x61,
            0x6e,
            0x64,
            0x6c,
            0x65,
            0x72,
            0x00, // name: 'SoundHandler'
        ]);
        MP4.HDLR_TYPES = {
            video: videoHdlr,
            audio: audioHdlr,
        };
        var dref = new Uint8Array([
            0x00, // version 0
            0x00,
            0x00,
            0x00, // flags
            0x00,
            0x00,
            0x00,
            0x01, // entry_count
            0x00,
            0x00,
            0x00,
            0x0c, // entry_size
            0x75,
            0x72,
            0x6c,
            0x20, // 'url' type
            0x00, // version 0
            0x00,
            0x00,
            0x01, // entry_flags
        ]);
        var stco = new Uint8Array([
            0x00, // version
            0x00,
            0x00,
            0x00, // flags
            0x00,
            0x00,
            0x00,
            0x00, // entry_count
        ]);
        MP4.STTS = MP4.STSC = MP4.STCO = stco;
        MP4.STSZ = new Uint8Array([
            0x00, // version
            0x00,
            0x00,
            0x00, // flags
            0x00,
            0x00,
            0x00,
            0x00, // sample_size
            0x00,
            0x00,
            0x00,
            0x00, // sample_count
        ]);
        MP4.VMHD = new Uint8Array([
            0x00, // version
            0x00,
            0x00,
            0x01, // flags
            0x00,
            0x00, // graphicsmode
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00, // opcolor
        ]);
        MP4.SMHD = new Uint8Array([
            0x00, // version
            0x00,
            0x00,
            0x00, // flags
            0x00,
            0x00, // balance
            0x00,
            0x00, // reserved
        ]);
        MP4.STSD = new Uint8Array([
            0x00, // version 0
            0x00,
            0x00,
            0x00, // flags
            0x00,
            0x00,
            0x00,
            0x01,
        ]); // entry_count
        var majorBrand = new Uint8Array([105, 115, 111, 109]); // isom
        var avc1Brand = new Uint8Array([97, 118, 99, 49]); // avc1
        var minorVersion = new Uint8Array([0, 0, 0, 1]);
        MP4.FTYP = MP4.box(MP4.types.ftyp, majorBrand, minorVersion, majorBrand, avc1Brand);
        MP4.DINF = MP4.box(MP4.types.dinf, MP4.box(MP4.types.dref, dref));
    };
    MP4.box = function (type) {
        var payload = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            payload[_i - 1] = arguments[_i];
        }
        var size = 8;
        var i = payload.length;
        var len = i;
        // calculate the total size we need to allocate
        while (i--) {
            size += payload[i].byteLength;
        }
        var result = new Uint8Array(size);
        result[0] = (size >> 24) & 0xff;
        result[1] = (size >> 16) & 0xff;
        result[2] = (size >> 8) & 0xff;
        result[3] = size & 0xff;
        result.set(type, 4);
        // copy the payload into the result
        for (i = 0, size = 8; i < len; i++) {
            // copy payload[i] array @ offset size
            result.set(payload[i], size);
            size += payload[i].byteLength;
        }
        return result;
    };
    MP4.hdlr = function (type) {
        return MP4.box(MP4.types.hdlr, MP4.HDLR_TYPES[type]);
    };
    MP4.mdat = function (data) {
        return MP4.box(MP4.types.mdat, data);
    };
    MP4.mdhd = function (timescale, duration) {
        duration *= timescale;
        var upperWordDuration = Math.floor(duration / (UINT32_MAX + 1));
        var lowerWordDuration = Math.floor(duration % (UINT32_MAX + 1));
        return MP4.box(MP4.types.mdhd, new Uint8Array([
            0x01, // version 1
            0x00,
            0x00,
            0x00, // flags
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x02, // creation_time
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x03, // modification_time
            (timescale >> 24) & 0xff,
            (timescale >> 16) & 0xff,
            (timescale >> 8) & 0xff,
            timescale & 0xff, // timescale
            upperWordDuration >> 24,
            (upperWordDuration >> 16) & 0xff,
            (upperWordDuration >> 8) & 0xff,
            upperWordDuration & 0xff,
            lowerWordDuration >> 24,
            (lowerWordDuration >> 16) & 0xff,
            (lowerWordDuration >> 8) & 0xff,
            lowerWordDuration & 0xff,
            0x55,
            0xc4, // 'und' language (undetermined)
            0x00,
            0x00,
        ]));
    };
    MP4.mdia = function (track) {
        return MP4.box(MP4.types.mdia, MP4.mdhd(track.timescale, track.duration), MP4.hdlr(track.type), MP4.minf(track));
    };
    MP4.mfhd = function (sequenceNumber) {
        return MP4.box(MP4.types.mfhd, new Uint8Array([
            0x00,
            0x00,
            0x00,
            0x00, // flags
            sequenceNumber >> 24,
            (sequenceNumber >> 16) & 0xff,
            (sequenceNumber >> 8) & 0xff,
            sequenceNumber & 0xff, // sequence_number
        ]));
    };
    MP4.minf = function (track) {
        if (track.type === 'audio') {
            return MP4.box(MP4.types.minf, MP4.box(MP4.types.smhd, MP4.SMHD), MP4.DINF, MP4.stbl(track));
        }
        else {
            return MP4.box(MP4.types.minf, MP4.box(MP4.types.vmhd, MP4.VMHD), MP4.DINF, MP4.stbl(track));
        }
    };
    MP4.moof = function (sn, baseMediaDecodeTime, track) {
        return MP4.box(MP4.types.moof, MP4.mfhd(sn), MP4.traf(track, baseMediaDecodeTime));
    };
    MP4.moov = function (tracks) {
        var i = tracks.length;
        var boxes = [];
        while (i--) {
            boxes[i] = MP4.trak(tracks[i]);
        }
        return MP4.box.apply(null, [MP4.types.moov, MP4.mvhd(tracks[0].timescale, tracks[0].duration)]
            .concat(boxes)
            .concat(MP4.mvex(tracks)));
    };
    MP4.mvex = function (tracks) {
        var i = tracks.length;
        var boxes = [];
        while (i--) {
            boxes[i] = MP4.trex(tracks[i]);
        }
        return MP4.box.apply(null, __spreadArray([MP4.types.mvex], boxes, true));
    };
    MP4.mvhd = function (timescale, duration) {
        duration *= timescale;
        var upperWordDuration = Math.floor(duration / (UINT32_MAX + 1));
        var lowerWordDuration = Math.floor(duration % (UINT32_MAX + 1));
        var bytes = new Uint8Array([
            0x01, // version 1
            0x00,
            0x00,
            0x00, // flags
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x02, // creation_time
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x03, // modification_time
            (timescale >> 24) & 0xff,
            (timescale >> 16) & 0xff,
            (timescale >> 8) & 0xff,
            timescale & 0xff, // timescale
            upperWordDuration >> 24,
            (upperWordDuration >> 16) & 0xff,
            (upperWordDuration >> 8) & 0xff,
            upperWordDuration & 0xff,
            lowerWordDuration >> 24,
            (lowerWordDuration >> 16) & 0xff,
            (lowerWordDuration >> 8) & 0xff,
            lowerWordDuration & 0xff,
            0x00,
            0x01,
            0x00,
            0x00, // 1.0 rate
            0x01,
            0x00, // 1.0 volume
            0x00,
            0x00, // reserved
            0x00,
            0x00,
            0x00,
            0x00, // reserved
            0x00,
            0x00,
            0x00,
            0x00, // reserved
            0x00,
            0x01,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x01,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x40,
            0x00,
            0x00,
            0x00, // transformation: unity matrix
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00, // pre_defined
            0xff,
            0xff,
            0xff,
            0xff, // next_track_ID
        ]);
        return MP4.box(MP4.types.mvhd, bytes);
    };
    MP4.sdtp = function (track) {
        var samples = track.samples || [];
        var bytes = new Uint8Array(4 + samples.length);
        var i;
        var flags;
        // leave the full box header (4 bytes) all zero
        // write the sample table
        for (i = 0; i < samples.length; i++) {
            flags = samples[i].flags;
            bytes[i + 4] =
                (flags.dependsOn << 4) |
                    (flags.isDependedOn << 2) |
                    flags.hasRedundancy;
        }
        return MP4.box(MP4.types.sdtp, bytes);
    };
    MP4.stbl = function (track) {
        return MP4.box(MP4.types.stbl, MP4.stsd(track), MP4.box(MP4.types.stts, MP4.STTS), MP4.box(MP4.types.stsc, MP4.STSC), MP4.box(MP4.types.stsz, MP4.STSZ), MP4.box(MP4.types.stco, MP4.STCO));
    };
    MP4.avc1 = function (track) {
        var sps = [];
        var pps = [];
        var i;
        var data;
        var len;
        // assemble the SPSs
        for (i = 0; i < track.sps.length; i++) {
            data = track.sps[i];
            len = data.byteLength;
            sps.push((len >>> 8) & 0xff);
            sps.push(len & 0xff);
            // SPS
            sps = sps.concat(Array.prototype.slice.call(data));
        }
        // assemble the PPSs
        for (i = 0; i < track.pps.length; i++) {
            data = track.pps[i];
            len = data.byteLength;
            pps.push((len >>> 8) & 0xff);
            pps.push(len & 0xff);
            pps = pps.concat(Array.prototype.slice.call(data));
        }
        var avcc = MP4.box(MP4.types.avcC, new Uint8Array([
            0x01, // version
            sps[3], // profile
            sps[4], // profile compat
            sps[5], // level
            0xfc | 3, // lengthSizeMinusOne, hard-coded to 4 bytes
            0xe0 | track.sps.length, // 3bit reserved (111) + numOfSequenceParameterSets
        ]
            .concat(sps)
            .concat([
            track.pps.length, // numOfPictureParameterSets
        ])
            .concat(pps))); // "PPS"
        var width = track.width;
        var height = track.height;
        var hSpacing = track.pixelRatio[0];
        var vSpacing = track.pixelRatio[1];
        return MP4.box(MP4.types.avc1, new Uint8Array([
            0x00,
            0x00,
            0x00, // reserved
            0x00,
            0x00,
            0x00, // reserved
            0x00,
            0x01, // data_reference_index
            0x00,
            0x00, // pre_defined
            0x00,
            0x00, // reserved
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00, // pre_defined
            (width >> 8) & 0xff,
            width & 0xff, // width
            (height >> 8) & 0xff,
            height & 0xff, // height
            0x00,
            0x48,
            0x00,
            0x00, // horizresolution
            0x00,
            0x48,
            0x00,
            0x00, // vertresolution
            0x00,
            0x00,
            0x00,
            0x00, // reserved
            0x00,
            0x01, // frame_count
            0x12,
            0x64,
            0x61,
            0x69,
            0x6c, // dailymotion/hls.js
            0x79,
            0x6d,
            0x6f,
            0x74,
            0x69,
            0x6f,
            0x6e,
            0x2f,
            0x68,
            0x6c,
            0x73,
            0x2e,
            0x6a,
            0x73,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00, // compressorname
            0x00,
            0x18, // depth = 24
            0x11,
            0x11,
        ]), // pre_defined = -1
        avcc, MP4.box(MP4.types.btrt, new Uint8Array([
            0x00,
            0x1c,
            0x9c,
            0x80, // bufferSizeDB
            0x00,
            0x2d,
            0xc6,
            0xc0, // maxBitrate
            0x00,
            0x2d,
            0xc6,
            0xc0,
        ])), // avgBitrate
        MP4.box(MP4.types.pasp, new Uint8Array([
            hSpacing >> 24, // hSpacing
            (hSpacing >> 16) & 0xff,
            (hSpacing >> 8) & 0xff,
            hSpacing & 0xff,
            vSpacing >> 24, // vSpacing
            (vSpacing >> 16) & 0xff,
            (vSpacing >> 8) & 0xff,
            vSpacing & 0xff,
        ])));
    };
    MP4.esds = function (track) {
        var configlen = track.config.length;
        return new Uint8Array([
            0x00, // version 0
            0x00,
            0x00,
            0x00, // flags
            0x03, // descriptor_type
            0x17 + configlen, // length
            0x00,
            0x01, // es_id
            0x00, // stream_priority
            0x04, // descriptor_type
            0x0f + configlen, // length
            0x40, // codec : mpeg4_audio
            0x15, // stream_type
            0x00,
            0x00,
            0x00, // buffer_size
            0x00,
            0x00,
            0x00,
            0x00, // maxBitrate
            0x00,
            0x00,
            0x00,
            0x00, // avgBitrate
            0x05, // descriptor_type
        ]
            .concat([configlen])
            .concat(track.config)
            .concat([0x06, 0x01, 0x02])); // GASpecificConfig)); // length + audio config descriptor
    };
    MP4.audioStsd = function (track) {
        var samplerate = track.samplerate;
        return new Uint8Array([
            0x00,
            0x00,
            0x00, // reserved
            0x00,
            0x00,
            0x00, // reserved
            0x00,
            0x01, // data_reference_index
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00, // reserved
            0x00,
            track.channelCount, // channelcount
            0x00,
            0x10, // sampleSize:16bits
            0x00,
            0x00,
            0x00,
            0x00, // reserved2
            (samplerate >> 8) & 0xff,
            samplerate & 0xff, //
            0x00,
            0x00,
        ]);
    };
    MP4.mp4a = function (track) {
        return MP4.box(MP4.types.mp4a, MP4.audioStsd(track), MP4.box(MP4.types.esds, MP4.esds(track)));
    };
    MP4.mp3 = function (track) {
        return MP4.box(MP4.types['.mp3'], MP4.audioStsd(track));
    };
    MP4.ac3 = function (track) {
        return MP4.box(MP4.types['ac-3'], MP4.audioStsd(track), MP4.box(MP4.types.dac3, track.config));
    };
    MP4.stsd = function (track) {
        if (track.type === 'audio') {
            if (track.segmentCodec === 'mp3' && track.codec === 'mp3') {
                return MP4.box(MP4.types.stsd, MP4.STSD, MP4.mp3(track));
            }
            if (track.segmentCodec === 'ac3') {
                return MP4.box(MP4.types.stsd, MP4.STSD, MP4.ac3(track));
            }
            return MP4.box(MP4.types.stsd, MP4.STSD, MP4.mp4a(track));
        }
        else {
            return MP4.box(MP4.types.stsd, MP4.STSD, MP4.avc1(track));
        }
    };
    MP4.tkhd = function (track) {
        var id = track.id;
        var duration = track.duration * track.timescale;
        var width = track.width;
        var height = track.height;
        var upperWordDuration = Math.floor(duration / (UINT32_MAX + 1));
        var lowerWordDuration = Math.floor(duration % (UINT32_MAX + 1));
        return MP4.box(MP4.types.tkhd, new Uint8Array([
            0x01, // version 1
            0x00,
            0x00,
            0x07, // flags
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x02, // creation_time
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x03, // modification_time
            (id >> 24) & 0xff,
            (id >> 16) & 0xff,
            (id >> 8) & 0xff,
            id & 0xff, // track_ID
            0x00,
            0x00,
            0x00,
            0x00, // reserved
            upperWordDuration >> 24,
            (upperWordDuration >> 16) & 0xff,
            (upperWordDuration >> 8) & 0xff,
            upperWordDuration & 0xff,
            lowerWordDuration >> 24,
            (lowerWordDuration >> 16) & 0xff,
            (lowerWordDuration >> 8) & 0xff,
            lowerWordDuration & 0xff,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00, // reserved
            0x00,
            0x00, // layer
            0x00,
            0x00, // alternate_group
            0x00,
            0x00, // non-audio track volume
            0x00,
            0x00, // reserved
            0x00,
            0x01,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x01,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x40,
            0x00,
            0x00,
            0x00, // transformation: unity matrix
            (width >> 8) & 0xff,
            width & 0xff,
            0x00,
            0x00, // width
            (height >> 8) & 0xff,
            height & 0xff,
            0x00,
            0x00, // height
        ]));
    };
    MP4.traf = function (track, baseMediaDecodeTime) {
        var sampleDependencyTable = MP4.sdtp(track);
        var id = track.id;
        var upperWordBaseMediaDecodeTime = Math.floor(baseMediaDecodeTime / (UINT32_MAX + 1));
        var lowerWordBaseMediaDecodeTime = Math.floor(baseMediaDecodeTime % (UINT32_MAX + 1));
        return MP4.box(MP4.types.traf, MP4.box(MP4.types.tfhd, new Uint8Array([
            0x00, // version 0
            0x00,
            0x00,
            0x00, // flags
            id >> 24,
            (id >> 16) & 0xff,
            (id >> 8) & 0xff,
            id & 0xff, // track_ID
        ])), MP4.box(MP4.types.tfdt, new Uint8Array([
            0x01, // version 1
            0x00,
            0x00,
            0x00, // flags
            upperWordBaseMediaDecodeTime >> 24,
            (upperWordBaseMediaDecodeTime >> 16) & 0xff,
            (upperWordBaseMediaDecodeTime >> 8) & 0xff,
            upperWordBaseMediaDecodeTime & 0xff,
            lowerWordBaseMediaDecodeTime >> 24,
            (lowerWordBaseMediaDecodeTime >> 16) & 0xff,
            (lowerWordBaseMediaDecodeTime >> 8) & 0xff,
            lowerWordBaseMediaDecodeTime & 0xff,
        ])), MP4.trun(track, sampleDependencyTable.length +
            16 + // tfhd
            20 + // tfdt
            8 + // traf header
            16 + // mfhd
            8 + // moof header
            8), // mdat header
        sampleDependencyTable);
    };
    /**
     * Generate a track box.
     * @param track a track definition
     */
    MP4.trak = function (track) {
        track.duration = track.duration || 0xffffffff;
        return MP4.box(MP4.types.trak, MP4.tkhd(track), MP4.mdia(track));
    };
    MP4.trex = function (track) {
        var id = track.id;
        return MP4.box(MP4.types.trex, new Uint8Array([
            0x00, // version 0
            0x00,
            0x00,
            0x00, // flags
            id >> 24,
            (id >> 16) & 0xff,
            (id >> 8) & 0xff,
            id & 0xff, // track_ID
            0x00,
            0x00,
            0x00,
            0x01, // default_sample_description_index
            0x00,
            0x00,
            0x00,
            0x00, // default_sample_duration
            0x00,
            0x00,
            0x00,
            0x00, // default_sample_size
            0x00,
            0x01,
            0x00,
            0x01, // default_sample_flags
        ]));
    };
    MP4.trun = function (track, offset) {
        var samples = track.samples || [];
        var len = samples.length;
        var arraylen = 12 + 16 * len;
        var array = new Uint8Array(arraylen);
        var i;
        var sample;
        var duration;
        var size;
        var flags;
        var cts;
        offset += 8 + arraylen;
        array.set([
            track.type === 'video' ? 0x01 : 0x00, // version 1 for video with signed-int sample_composition_time_offset
            0x00,
            0x0f,
            0x01, // flags
            (len >>> 24) & 0xff,
            (len >>> 16) & 0xff,
            (len >>> 8) & 0xff,
            len & 0xff, // sample_count
            (offset >>> 24) & 0xff,
            (offset >>> 16) & 0xff,
            (offset >>> 8) & 0xff,
            offset & 0xff, // data_offset
        ], 0);
        for (i = 0; i < len; i++) {
            sample = samples[i];
            duration = sample.duration;
            size = sample.size;
            flags = sample.flags;
            cts = sample.cts;
            array.set([
                (duration >>> 24) & 0xff,
                (duration >>> 16) & 0xff,
                (duration >>> 8) & 0xff,
                duration & 0xff, // sample_duration
                (size >>> 24) & 0xff,
                (size >>> 16) & 0xff,
                (size >>> 8) & 0xff,
                size & 0xff, // sample_size
                (flags.isLeading << 2) | flags.dependsOn,
                (flags.isDependedOn << 6) |
                    (flags.hasRedundancy << 4) |
                    (flags.paddingValue << 1) |
                    flags.isNonSync,
                flags.degradPrio & (0xf0 << 8),
                flags.degradPrio & 0x0f, // sample_flags
                (cts >>> 24) & 0xff,
                (cts >>> 16) & 0xff,
                (cts >>> 8) & 0xff,
                cts & 0xff, // sample_composition_time_offset
            ], 12 + 16 * i);
        }
        return MP4.box(MP4.types.trun, array);
    };
    MP4.initSegment = function (tracks) {
        if (!MP4.types) {
            MP4.init();
        }
        var movie = MP4.moov(tracks);
        var result = (0, mp4_tools_1.appendUint8Array)(MP4.FTYP, movie);
        return result;
    };
    return MP4;
}());
exports.default = MP4;
