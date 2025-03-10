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
exports.Part = exports.Fragment = exports.BaseSegment = void 0;
var url_toolkit_1 = require("url-toolkit");
var load_stats_1 = require("./load-stats");
var BaseSegment = /** @class */ (function () {
    function BaseSegment(baseurl) {
        var _a;
        this._byteRange = null;
        this._url = null;
        // Holds the types of data this fragment supports
        this.elementaryStreams = (_a = {},
            _a["audio" /* ElementaryStreamTypes.AUDIO */] = null,
            _a["video" /* ElementaryStreamTypes.VIDEO */] = null,
            _a["audiovideo" /* ElementaryStreamTypes.AUDIOVIDEO */] = null,
            _a);
        this.baseurl = baseurl;
    }
    // setByteRange converts a EXT-X-BYTERANGE attribute into a two element array
    BaseSegment.prototype.setByteRange = function (value, previous) {
        var params = value.split('@', 2);
        var start;
        if (params.length === 1) {
            start = (previous === null || previous === void 0 ? void 0 : previous.byteRangeEndOffset) || 0;
        }
        else {
            start = parseInt(params[1]);
        }
        this._byteRange = [start, parseInt(params[0]) + start];
    };
    Object.defineProperty(BaseSegment.prototype, "byteRange", {
        get: function () {
            if (!this._byteRange) {
                return [];
            }
            return this._byteRange;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseSegment.prototype, "byteRangeStartOffset", {
        get: function () {
            return this.byteRange[0];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseSegment.prototype, "byteRangeEndOffset", {
        get: function () {
            return this.byteRange[1];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseSegment.prototype, "url", {
        get: function () {
            if (!this._url && this.baseurl && this.relurl) {
                this._url = (0, url_toolkit_1.buildAbsoluteURL)(this.baseurl, this.relurl, {
                    alwaysNormalize: true,
                });
            }
            return this._url || '';
        },
        set: function (value) {
            this._url = value;
        },
        enumerable: false,
        configurable: true
    });
    return BaseSegment;
}());
exports.BaseSegment = BaseSegment;
/**
 * Object representing parsed data from an HLS Segment. Found in {@link hls.js#LevelDetails.fragments}.
 */
var Fragment = /** @class */ (function (_super) {
    __extends(Fragment, _super);
    function Fragment(type, baseurl) {
        var _this = _super.call(this, baseurl) || this;
        _this._decryptdata = null;
        _this.rawProgramDateTime = null;
        _this.programDateTime = null;
        _this.tagList = [];
        // EXTINF has to be present for a m3u8 to be considered valid
        _this.duration = 0;
        // sn notates the sequence number for a segment, and if set to a string can be 'initSegment'
        _this.sn = 0;
        // A reference to the loader. Set while the fragment is loading, and removed afterwards. Used to abort fragment loading
        _this.loader = null;
        // A reference to the key loader. Set while the key is loading, and removed afterwards. Used to abort key loading
        _this.keyLoader = null;
        // The level/track index to which the fragment belongs
        _this.level = -1;
        // The continuity counter of the fragment
        _this.cc = 0;
        // The start time of the fragment, as listed in the manifest. Updated after transmux complete.
        _this.start = 0;
        // Load/parse timing information
        _this.stats = new load_stats_1.LoadStats();
        // A flag indicating whether the segment was downloaded in order to test bitrate, and was not buffered
        _this.bitrateTest = false;
        // #EXTINF  segment title
        _this.title = null;
        // The Media Initialization Section for this segment
        _this.initSegment = null;
        // Deprecated
        _this.urlId = 0;
        _this.type = type;
        return _this;
    }
    Object.defineProperty(Fragment.prototype, "decryptdata", {
        get: function () {
            var levelkeys = this.levelkeys;
            if (!levelkeys && !this._decryptdata) {
                return null;
            }
            if (!this._decryptdata && this.levelkeys && !this.levelkeys.NONE) {
                var key = this.levelkeys.identity;
                if (key) {
                    this._decryptdata = key.getDecryptData(this.sn);
                }
                else {
                    var keyFormats = Object.keys(this.levelkeys);
                    if (keyFormats.length === 1) {
                        return (this._decryptdata = this.levelkeys[keyFormats[0]].getDecryptData(this.sn));
                    }
                    else {
                        // Multiple keys. key-loader to call Fragment.setKeyFormat based on selected key-system.
                    }
                }
            }
            return this._decryptdata;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Fragment.prototype, "end", {
        get: function () {
            return this.start + this.duration;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Fragment.prototype, "endProgramDateTime", {
        get: function () {
            if (this.programDateTime === null) {
                return null;
            }
            if (!Number.isFinite(this.programDateTime)) {
                return null;
            }
            var duration = !Number.isFinite(this.duration) ? 0 : this.duration;
            return this.programDateTime + duration * 1000;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Fragment.prototype, "encrypted", {
        get: function () {
            var _a;
            // At the m3u8-parser level we need to add support for manifest signalled keyformats
            // when we want the fragment to start reporting that it is encrypted.
            // Currently, keyFormat will only be set for identity keys
            if ((_a = this._decryptdata) === null || _a === void 0 ? void 0 : _a.encrypted) {
                return true;
            }
            else if (this.levelkeys) {
                var keyFormats = Object.keys(this.levelkeys);
                var len = keyFormats.length;
                if (len > 1 || (len === 1 && this.levelkeys[keyFormats[0]].encrypted)) {
                    return true;
                }
            }
            return false;
        },
        enumerable: false,
        configurable: true
    });
    Fragment.prototype.setKeyFormat = function (keyFormat) {
        if (this.levelkeys) {
            var key = this.levelkeys[keyFormat];
            if (key && !this._decryptdata) {
                this._decryptdata = key.getDecryptData(this.sn);
            }
        }
    };
    Fragment.prototype.abortRequests = function () {
        var _a, _b;
        (_a = this.loader) === null || _a === void 0 ? void 0 : _a.abort();
        (_b = this.keyLoader) === null || _b === void 0 ? void 0 : _b.abort();
    };
    Fragment.prototype.setElementaryStreamInfo = function (type, startPTS, endPTS, startDTS, endDTS, partial) {
        if (partial === void 0) { partial = false; }
        var elementaryStreams = this.elementaryStreams;
        var info = elementaryStreams[type];
        if (!info) {
            elementaryStreams[type] = {
                startPTS: startPTS,
                endPTS: endPTS,
                startDTS: startDTS,
                endDTS: endDTS,
                partial: partial,
            };
            return;
        }
        info.startPTS = Math.min(info.startPTS, startPTS);
        info.endPTS = Math.max(info.endPTS, endPTS);
        info.startDTS = Math.min(info.startDTS, startDTS);
        info.endDTS = Math.max(info.endDTS, endDTS);
    };
    Fragment.prototype.clearElementaryStreamInfo = function () {
        var elementaryStreams = this.elementaryStreams;
        elementaryStreams["audio" /* ElementaryStreamTypes.AUDIO */] = null;
        elementaryStreams["video" /* ElementaryStreamTypes.VIDEO */] = null;
        elementaryStreams["audiovideo" /* ElementaryStreamTypes.AUDIOVIDEO */] = null;
    };
    return Fragment;
}(BaseSegment));
exports.Fragment = Fragment;
/**
 * Object representing parsed data from an HLS Partial Segment. Found in {@link hls.js#LevelDetails.partList}.
 */
var Part = /** @class */ (function (_super) {
    __extends(Part, _super);
    function Part(partAttrs, frag, baseurl, index, previous) {
        var _this = _super.call(this, baseurl) || this;
        _this.fragOffset = 0;
        _this.duration = 0;
        _this.gap = false;
        _this.independent = false;
        _this.stats = new load_stats_1.LoadStats();
        _this.duration = partAttrs.decimalFloatingPoint('DURATION');
        _this.gap = partAttrs.bool('GAP');
        _this.independent = partAttrs.bool('INDEPENDENT');
        _this.relurl = partAttrs.enumeratedString('URI');
        _this.fragment = frag;
        _this.index = index;
        var byteRange = partAttrs.enumeratedString('BYTERANGE');
        if (byteRange) {
            _this.setByteRange(byteRange, previous);
        }
        if (previous) {
            _this.fragOffset = previous.fragOffset + previous.duration;
        }
        return _this;
    }
    Object.defineProperty(Part.prototype, "start", {
        get: function () {
            return this.fragment.start + this.fragOffset;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Part.prototype, "end", {
        get: function () {
            return this.start + this.duration;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Part.prototype, "loaded", {
        get: function () {
            var elementaryStreams = this.elementaryStreams;
            return !!(elementaryStreams.audio ||
                elementaryStreams.video ||
                elementaryStreams.audiovideo);
        },
        enumerable: false,
        configurable: true
    });
    return Part;
}(BaseSegment));
exports.Part = Part;
