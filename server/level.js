"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Level = exports.HlsUrlParameters = exports.VideoRangeValues = exports.HdcpLevels = void 0;
exports.isHdcpLevel = isHdcpLevel;
exports.isVideoRange = isVideoRange;
exports.getSkipValue = getSkipValue;
exports.HdcpLevels = ['NONE', 'TYPE-0', 'TYPE-1', null];
function isHdcpLevel(value) {
    return exports.HdcpLevels.indexOf(value) > -1;
}
exports.VideoRangeValues = ['SDR', 'PQ', 'HLG'];
function isVideoRange(value) {
    return !!value && exports.VideoRangeValues.indexOf(value) > -1;
}
function getSkipValue(details) {
    var canSkipUntil = details.canSkipUntil, canSkipDateRanges = details.canSkipDateRanges, age = details.age;
    // A Client SHOULD NOT request a Playlist Delta Update unless it already
    // has a version of the Playlist that is no older than one-half of the Skip Boundary.
    // @see: https://datatracker.ietf.org/doc/html/draft-pantos-hls-rfc8216bis#section-6.3.7
    var playlistRecentEnough = age < canSkipUntil / 2;
    if (canSkipUntil && playlistRecentEnough) {
        if (canSkipDateRanges) {
            return "v2" /* HlsSkip.v2 */;
        }
        return "YES" /* HlsSkip.Yes */;
    }
    return "" /* HlsSkip.No */;
}
var HlsUrlParameters = /** @class */ (function () {
    function HlsUrlParameters(msn, part, skip) {
        this.msn = msn;
        this.part = part;
        this.skip = skip;
    }
    HlsUrlParameters.prototype.addDirectives = function (uri) {
        var url = new self.URL(uri);
        if (this.msn !== undefined) {
            url.searchParams.set('_HLS_msn', this.msn.toString());
        }
        if (this.part !== undefined) {
            url.searchParams.set('_HLS_part', this.part.toString());
        }
        if (this.skip) {
            url.searchParams.set('_HLS_skip', this.skip);
        }
        return url.href;
    };
    return HlsUrlParameters;
}());
exports.HlsUrlParameters = HlsUrlParameters;
var Level = /** @class */ (function () {
    function Level(data) {
        this.fragmentError = 0;
        this.loadError = 0;
        this.realBitrate = 0;
        this._avgBitrate = 0;
        // Deprecated (retained for backwards compatibility)
        this._urlId = 0;
        this.url = [data.url];
        this._attrs = [data.attrs];
        this.bitrate = data.bitrate;
        if (data.details) {
            this.details = data.details;
        }
        this.id = data.id || 0;
        this.name = data.name;
        this.width = data.width || 0;
        this.height = data.height || 0;
        this.frameRate = data.attrs.optionalFloat('FRAME-RATE', 0);
        this._avgBitrate = data.attrs.decimalInteger('AVERAGE-BANDWIDTH');
        this.audioCodec = data.audioCodec;
        this.videoCodec = data.videoCodec;
        this.codecSet = [data.videoCodec, data.audioCodec]
            .filter(function (c) { return !!c; })
            .map(function (s) { return s.substring(0, 4); })
            .join(',');
        this.addGroupId('audio', data.attrs.AUDIO);
        this.addGroupId('text', data.attrs.SUBTITLES);
    }
    Object.defineProperty(Level.prototype, "maxBitrate", {
        get: function () {
            return Math.max(this.realBitrate, this.bitrate);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Level.prototype, "averageBitrate", {
        get: function () {
            return this._avgBitrate || this.realBitrate || this.bitrate;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Level.prototype, "attrs", {
        get: function () {
            return this._attrs[0];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Level.prototype, "codecs", {
        get: function () {
            return this.attrs.CODECS || '';
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Level.prototype, "pathwayId", {
        get: function () {
            return this.attrs['PATHWAY-ID'] || '.';
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Level.prototype, "videoRange", {
        get: function () {
            return this.attrs['VIDEO-RANGE'] || 'SDR';
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Level.prototype, "score", {
        get: function () {
            return this.attrs.optionalFloat('SCORE', 0);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Level.prototype, "uri", {
        get: function () {
            return this.url[0] || '';
        },
        enumerable: false,
        configurable: true
    });
    Level.prototype.hasAudioGroup = function (groupId) {
        return hasGroup(this._audioGroups, groupId);
    };
    Level.prototype.hasSubtitleGroup = function (groupId) {
        return hasGroup(this._subtitleGroups, groupId);
    };
    Object.defineProperty(Level.prototype, "audioGroups", {
        get: function () {
            return this._audioGroups;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Level.prototype, "subtitleGroups", {
        get: function () {
            return this._subtitleGroups;
        },
        enumerable: false,
        configurable: true
    });
    Level.prototype.addGroupId = function (type, groupId) {
        if (!groupId) {
            return;
        }
        if (type === 'audio') {
            var audioGroups = this._audioGroups;
            if (!audioGroups) {
                audioGroups = this._audioGroups = [];
            }
            if (audioGroups.indexOf(groupId) === -1) {
                audioGroups.push(groupId);
            }
        }
        else if (type === 'text') {
            var subtitleGroups = this._subtitleGroups;
            if (!subtitleGroups) {
                subtitleGroups = this._subtitleGroups = [];
            }
            if (subtitleGroups.indexOf(groupId) === -1) {
                subtitleGroups.push(groupId);
            }
        }
    };
    Object.defineProperty(Level.prototype, "urlId", {
        // Deprecated methods (retained for backwards compatibility)
        get: function () {
            return 0;
        },
        set: function (value) { },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Level.prototype, "audioGroupIds", {
        get: function () {
            return this.audioGroups ? [this.audioGroupId] : undefined;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Level.prototype, "textGroupIds", {
        get: function () {
            return this.subtitleGroups ? [this.textGroupId] : undefined;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Level.prototype, "audioGroupId", {
        get: function () {
            var _a;
            return (_a = this.audioGroups) === null || _a === void 0 ? void 0 : _a[0];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Level.prototype, "textGroupId", {
        get: function () {
            var _a;
            return (_a = this.subtitleGroups) === null || _a === void 0 ? void 0 : _a[0];
        },
        enumerable: false,
        configurable: true
    });
    Level.prototype.addFallback = function () { };
    return Level;
}());
exports.Level = Level;
function hasGroup(groups, groupId) {
    if (!groupId || !groups) {
        return false;
    }
    return groups.indexOf(groupId) !== -1;
}
