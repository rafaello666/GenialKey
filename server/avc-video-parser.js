"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var base_video_parser_1 = require("./base-video-parser");
var mp4_tools_1 = require("../../utils/mp4-tools");
var exp_golomb_1 = require("./exp-golomb");
var AvcVideoParser = /** @class */ (function (_super) {
    __extends(AvcVideoParser, _super);
    function AvcVideoParser() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AvcVideoParser.prototype.parseAVCPES = function (track, textTrack, pes, last, duration) {
        var _this = this;
        var units = this.parseAVCNALu(track, pes.data);
        var debug = false;
        var VideoSample = this.VideoSample;
        var push;
        var spsfound = false;
        // free pes.data to save up some memory
        pes.data = null;
        // if new NAL units found and last sample still there, let's push ...
        // this helps parsing streams with missing AUD (only do this if AUD never found)
        if (VideoSample && units.length && !track.audFound) {
            this.pushAccessUnit(VideoSample, track);
            VideoSample = this.VideoSample = this.createVideoSample(false, pes.pts, pes.dts, '');
        }
        units.forEach(function (unit) {
            var _a, _b;
            switch (unit.type) {
                // NDR
                case 1: {
                    var iskey = false;
                    push = true;
                    var data = unit.data;
                    // only check slice type to detect KF in case SPS found in same packet (any keyframe is preceded by SPS ...)
                    if (spsfound && data.length > 4) {
                        // retrieve slice type by parsing beginning of NAL unit (follow H264 spec, slice_header definition) to detect keyframe embedded in NDR
                        var sliceType = new exp_golomb_1.default(data).readSliceType();
                        // 2 : I slice, 4 : SI slice, 7 : I slice, 9: SI slice
                        // SI slice : A slice that is coded using intra prediction only and using quantisation of the prediction samples.
                        // An SI slice can be coded such that its decoded samples can be constructed identically to an SP slice.
                        // I slice: A slice that is not an SI slice that is decoded using intra prediction only.
                        // if (sliceType === 2 || sliceType === 7) {
                        if (sliceType === 2 ||
                            sliceType === 4 ||
                            sliceType === 7 ||
                            sliceType === 9) {
                            iskey = true;
                        }
                    }
                    if (iskey) {
                        // if we have non-keyframe data already, that cannot belong to the same frame as a keyframe, so force a push
                        if ((VideoSample === null || VideoSample === void 0 ? void 0 : VideoSample.frame) && !VideoSample.key) {
                            _this.pushAccessUnit(VideoSample, track);
                            VideoSample = _this.VideoSample = null;
                        }
                    }
                    if (!VideoSample) {
                        VideoSample = _this.VideoSample = _this.createVideoSample(true, pes.pts, pes.dts, '');
                    }
                    if (debug) {
                        VideoSample.debug += 'NDR ';
                    }
                    VideoSample.frame = true;
                    VideoSample.key = iskey;
                    break;
                    // IDR
                }
                case 5:
                    push = true;
                    // handle PES not starting with AUD
                    // if we have frame data already, that cannot belong to the same frame, so force a push
                    if ((VideoSample === null || VideoSample === void 0 ? void 0 : VideoSample.frame) && !VideoSample.key) {
                        _this.pushAccessUnit(VideoSample, track);
                        VideoSample = _this.VideoSample = null;
                    }
                    if (!VideoSample) {
                        VideoSample = _this.VideoSample = _this.createVideoSample(true, pes.pts, pes.dts, '');
                    }
                    if (debug) {
                        VideoSample.debug += 'IDR ';
                    }
                    VideoSample.key = true;
                    VideoSample.frame = true;
                    break;
                // SEI
                case 6: {
                    push = true;
                    if (debug && VideoSample) {
                        VideoSample.debug += 'SEI ';
                    }
                    (0, mp4_tools_1.parseSEIMessageFromNALu)(unit.data, 1, pes.pts, textTrack.samples);
                    break;
                    // SPS
                }
                case 7: {
                    push = true;
                    spsfound = true;
                    if (debug && VideoSample) {
                        VideoSample.debug += 'SPS ';
                    }
                    var sps = unit.data;
                    var expGolombDecoder = new exp_golomb_1.default(sps);
                    var config = expGolombDecoder.readSPS();
                    if (!track.sps ||
                        track.width !== config.width ||
                        track.height !== config.height ||
                        ((_a = track.pixelRatio) === null || _a === void 0 ? void 0 : _a[0]) !== config.pixelRatio[0] ||
                        ((_b = track.pixelRatio) === null || _b === void 0 ? void 0 : _b[1]) !== config.pixelRatio[1]) {
                        track.width = config.width;
                        track.height = config.height;
                        track.pixelRatio = config.pixelRatio;
                        track.sps = [sps];
                        track.duration = duration;
                        var codecarray = sps.subarray(1, 4);
                        var codecstring = 'avc1.';
                        for (var i = 0; i < 3; i++) {
                            var h = codecarray[i].toString(16);
                            if (h.length < 2) {
                                h = '0' + h;
                            }
                            codecstring += h;
                        }
                        track.codec = codecstring;
                    }
                    break;
                }
                // PPS
                case 8:
                    push = true;
                    if (debug && VideoSample) {
                        VideoSample.debug += 'PPS ';
                    }
                    track.pps = [unit.data];
                    break;
                // AUD
                case 9:
                    push = true;
                    track.audFound = true;
                    if (VideoSample) {
                        _this.pushAccessUnit(VideoSample, track);
                    }
                    VideoSample = _this.VideoSample = _this.createVideoSample(false, pes.pts, pes.dts, debug ? 'AUD ' : '');
                    break;
                // Filler Data
                case 12:
                    push = true;
                    break;
                default:
                    push = false;
                    if (VideoSample) {
                        VideoSample.debug += 'unknown NAL ' + unit.type + ' ';
                    }
                    break;
            }
            if (VideoSample && push) {
                var units_1 = VideoSample.units;
                units_1.push(unit);
            }
        });
        // if last PES packet, push samples
        if (last && VideoSample) {
            this.pushAccessUnit(VideoSample, track);
            this.VideoSample = null;
        }
    };
    AvcVideoParser.prototype.parseAVCNALu = function (track, array) {
        var len = array.byteLength;
        var state = track.naluState || 0;
        var lastState = state;
        var units = [];
        var i = 0;
        var value;
        var overflow;
        var unitType;
        var lastUnitStart = -1;
        var lastUnitType = 0;
        // logger.log('PES:' + Hex.hexDump(array));
        if (state === -1) {
            // special use case where we found 3 or 4-byte start codes exactly at the end of previous PES packet
            lastUnitStart = 0;
            // NALu type is value read from offset 0
            lastUnitType = array[0] & 0x1f;
            state = 0;
            i = 1;
        }
        while (i < len) {
            value = array[i++];
            // optimization. state 0 and 1 are the predominant case. let's handle them outside of the switch/case
            if (!state) {
                state = value ? 0 : 1;
                continue;
            }
            if (state === 1) {
                state = value ? 0 : 2;
                continue;
            }
            // here we have state either equal to 2 or 3
            if (!value) {
                state = 3;
            }
            else if (value === 1) {
                overflow = i - state - 1;
                if (lastUnitStart >= 0) {
                    var unit = {
                        data: array.subarray(lastUnitStart, overflow),
                        type: lastUnitType,
                    };
                    // logger.log('pushing NALU, type/size:' + unit.type + '/' + unit.data.byteLength);
                    units.push(unit);
                }
                else {
                    // lastUnitStart is undefined => this is the first start code found in this PES packet
                    // first check if start code delimiter is overlapping between 2 PES packets,
                    // ie it started in last packet (lastState not zero)
                    // and ended at the beginning of this PES packet (i <= 4 - lastState)
                    var lastUnit = this.getLastNalUnit(track.samples);
                    if (lastUnit) {
                        if (lastState && i <= 4 - lastState) {
                            // start delimiter overlapping between PES packets
                            // strip start delimiter bytes from the end of last NAL unit
                            // check if lastUnit had a state different from zero
                            if (lastUnit.state) {
                                // strip last bytes
                                lastUnit.data = lastUnit.data.subarray(0, lastUnit.data.byteLength - lastState);
                            }
                        }
                        // If NAL units are not starting right at the beginning of the PES packet, push preceding data into previous NAL unit.
                        if (overflow > 0) {
                            // logger.log('first NALU found with overflow:' + overflow);
                            lastUnit.data = (0, mp4_tools_1.appendUint8Array)(lastUnit.data, array.subarray(0, overflow));
                            lastUnit.state = 0;
                        }
                    }
                }
                // check if we can read unit type
                if (i < len) {
                    unitType = array[i] & 0x1f;
                    // logger.log('find NALU @ offset:' + i + ',type:' + unitType);
                    lastUnitStart = i;
                    lastUnitType = unitType;
                    state = 0;
                }
                else {
                    // not enough byte to read unit type. let's read it on next PES parsing
                    state = -1;
                }
            }
            else {
                state = 0;
            }
        }
        if (lastUnitStart >= 0 && state >= 0) {
            var unit = {
                data: array.subarray(lastUnitStart, len),
                type: lastUnitType,
                state: state,
            };
            units.push(unit);
            // logger.log('pushing NALU, type/size/state:' + unit.type + '/' + unit.data.byteLength + '/' + state);
        }
        // no NALu found
        if (units.length === 0) {
            // append pes.data to previous NAL unit
            var lastUnit = this.getLastNalUnit(track.samples);
            if (lastUnit) {
                lastUnit.data = (0, mp4_tools_1.appendUint8Array)(lastUnit.data, array);
            }
        }
        track.naluState = state;
        return units;
    };
    return AvcVideoParser;
}(base_video_parser_1.default));
exports.default = AvcVideoParser;
