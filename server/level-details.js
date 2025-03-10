"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LevelDetails = void 0;
var DEFAULT_TARGET_DURATION = 10;
/**
 * Object representing parsed data from an HLS Media Playlist. Found in {@link hls.js#Level.details}.
 */
var LevelDetails = /** @class */ (function () {
    function LevelDetails(baseUrl) {
        this.PTSKnown = false;
        this.alignedSliding = false;
        this.endCC = 0;
        this.endSN = 0;
        this.partList = null;
        this.live = true;
        this.ageHeader = 0;
        this.updated = true;
        this.advanced = true;
        this.misses = 0;
        this.startCC = 0;
        this.startSN = 0;
        this.startTimeOffset = null;
        this.targetduration = 0;
        this.totalduration = 0;
        this.type = null;
        this.m3u8 = '';
        this.version = null;
        this.canBlockReload = false;
        this.canSkipUntil = 0;
        this.canSkipDateRanges = false;
        this.skippedSegments = 0;
        this.partHoldBack = 0;
        this.holdBack = 0;
        this.partTarget = 0;
        this.tuneInGoal = 0;
        this.driftStartTime = 0;
        this.driftEndTime = 0;
        this.driftStart = 0;
        this.driftEnd = 0;
        this.playlistParsingError = null;
        this.variableList = null;
        this.hasVariableRefs = false;
        this.fragments = [];
        this.encryptedFragments = [];
        this.dateRanges = {};
        this.url = baseUrl;
    }
    LevelDetails.prototype.reloaded = function (previous) {
        if (!previous) {
            this.advanced = true;
            this.updated = true;
            return;
        }
        var partSnDiff = this.lastPartSn - previous.lastPartSn;
        var partIndexDiff = this.lastPartIndex - previous.lastPartIndex;
        this.updated =
            this.endSN !== previous.endSN ||
                !!partIndexDiff ||
                !!partSnDiff ||
                !this.live;
        this.advanced =
            this.endSN > previous.endSN ||
                partSnDiff > 0 ||
                (partSnDiff === 0 && partIndexDiff > 0);
        if (this.updated || this.advanced) {
            this.misses = Math.floor(previous.misses * 0.6);
        }
        else {
            this.misses = previous.misses + 1;
        }
        this.availabilityDelay = previous.availabilityDelay;
    };
    Object.defineProperty(LevelDetails.prototype, "hasProgramDateTime", {
        get: function () {
            if (this.fragments.length) {
                return Number.isFinite(this.fragments[this.fragments.length - 1].programDateTime);
            }
            return false;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LevelDetails.prototype, "levelTargetDuration", {
        get: function () {
            return (this.averagetargetduration ||
                this.targetduration ||
                DEFAULT_TARGET_DURATION);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LevelDetails.prototype, "drift", {
        get: function () {
            var runTime = this.driftEndTime - this.driftStartTime;
            if (runTime > 0) {
                var runDuration = this.driftEnd - this.driftStart;
                return (runDuration * 1000) / runTime;
            }
            return 1;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LevelDetails.prototype, "edge", {
        get: function () {
            return this.partEnd || this.fragmentEnd;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LevelDetails.prototype, "partEnd", {
        get: function () {
            var _a;
            if ((_a = this.partList) === null || _a === void 0 ? void 0 : _a.length) {
                return this.partList[this.partList.length - 1].end;
            }
            return this.fragmentEnd;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LevelDetails.prototype, "fragmentEnd", {
        get: function () {
            var _a;
            if ((_a = this.fragments) === null || _a === void 0 ? void 0 : _a.length) {
                return this.fragments[this.fragments.length - 1].end;
            }
            return 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LevelDetails.prototype, "age", {
        get: function () {
            if (this.advancedDateTime) {
                return Math.max(Date.now() - this.advancedDateTime, 0) / 1000;
            }
            return 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LevelDetails.prototype, "lastPartIndex", {
        get: function () {
            var _a;
            if ((_a = this.partList) === null || _a === void 0 ? void 0 : _a.length) {
                return this.partList[this.partList.length - 1].index;
            }
            return -1;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LevelDetails.prototype, "lastPartSn", {
        get: function () {
            var _a;
            if ((_a = this.partList) === null || _a === void 0 ? void 0 : _a.length) {
                return this.partList[this.partList.length - 1].fragment.sn;
            }
            return this.endSN;
        },
        enumerable: false,
        configurable: true
    });
    return LevelDetails;
}());
exports.LevelDetails = LevelDetails;
