"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("../events");
var CmcdObjectType_1 = require("@svta/common-media-library/cmcd/CmcdObjectType");
var CmcdStreamingFormat_1 = require("@svta/common-media-library/cmcd/CmcdStreamingFormat");
var appendCmcdHeaders_1 = require("@svta/common-media-library/cmcd/appendCmcdHeaders");
var appendCmcdQuery_1 = require("@svta/common-media-library/cmcd/appendCmcdQuery");
var uuid_1 = require("@svta/common-media-library/utils/uuid");
var buffer_helper_1 = require("../utils/buffer-helper");
var logger_1 = require("../utils/logger");
/**
 * Controller to deal with Common Media Client Data (CMCD)
 * @see https://cdn.cta.tech/cta/media/media/resources/standards/pdfs/cta-5004-final.pdf
 */
var CMCDController = /** @class */ (function () {
    function CMCDController(hls) {
        var _this = this;
        this.useHeaders = false;
        this.initialized = false;
        this.starved = false;
        this.buffering = true;
        this.onWaiting = function () {
            if (_this.initialized) {
                _this.starved = true;
            }
            _this.buffering = true;
        };
        this.onPlaying = function () {
            if (!_this.initialized) {
                _this.initialized = true;
            }
            _this.buffering = false;
        };
        /**
         * Apply CMCD data to a manifest request.
         */
        this.applyPlaylistData = function (context) {
            try {
                _this.apply(context, {
                    ot: CmcdObjectType_1.CmcdObjectType.MANIFEST,
                    su: !_this.initialized,
                });
            }
            catch (error) {
                logger_1.logger.warn('Could not generate manifest CMCD data.', error);
            }
        };
        /**
         * Apply CMCD data to a segment request
         */
        this.applyFragmentData = function (context) {
            try {
                var fragment = context.frag;
                var level = _this.hls.levels[fragment.level];
                var ot = _this.getObjectType(fragment);
                var data = {
                    d: fragment.duration * 1000,
                    ot: ot,
                };
                if (ot === CmcdObjectType_1.CmcdObjectType.VIDEO ||
                    ot === CmcdObjectType_1.CmcdObjectType.AUDIO ||
                    ot == CmcdObjectType_1.CmcdObjectType.MUXED) {
                    data.br = level.bitrate / 1000;
                    data.tb = _this.getTopBandwidth(ot) / 1000;
                    data.bl = _this.getBufferLength(ot);
                }
                _this.apply(context, data);
            }
            catch (error) {
                logger_1.logger.warn('Could not generate segment CMCD data.', error);
            }
        };
        this.hls = hls;
        var config = (this.config = hls.config);
        var cmcd = config.cmcd;
        if (cmcd != null) {
            config.pLoader = this.createPlaylistLoader();
            config.fLoader = this.createFragmentLoader();
            this.sid = cmcd.sessionId || (0, uuid_1.uuid)();
            this.cid = cmcd.contentId;
            this.useHeaders = cmcd.useHeaders === true;
            this.includeKeys = cmcd.includeKeys;
            this.registerListeners();
        }
    }
    CMCDController.prototype.registerListeners = function () {
        var hls = this.hls;
        hls.on(events_1.Events.MEDIA_ATTACHED, this.onMediaAttached, this);
        hls.on(events_1.Events.MEDIA_DETACHED, this.onMediaDetached, this);
        hls.on(events_1.Events.BUFFER_CREATED, this.onBufferCreated, this);
    };
    CMCDController.prototype.unregisterListeners = function () {
        var hls = this.hls;
        hls.off(events_1.Events.MEDIA_ATTACHED, this.onMediaAttached, this);
        hls.off(events_1.Events.MEDIA_DETACHED, this.onMediaDetached, this);
        hls.off(events_1.Events.BUFFER_CREATED, this.onBufferCreated, this);
    };
    CMCDController.prototype.destroy = function () {
        this.unregisterListeners();
        this.onMediaDetached();
        // @ts-ignore
        this.hls = this.config = this.audioBuffer = this.videoBuffer = null;
        // @ts-ignore
        this.onWaiting = this.onPlaying = null;
    };
    CMCDController.prototype.onMediaAttached = function (event, data) {
        this.media = data.media;
        this.media.addEventListener('waiting', this.onWaiting);
        this.media.addEventListener('playing', this.onPlaying);
    };
    CMCDController.prototype.onMediaDetached = function () {
        if (!this.media) {
            return;
        }
        this.media.removeEventListener('waiting', this.onWaiting);
        this.media.removeEventListener('playing', this.onPlaying);
        // @ts-ignore
        this.media = null;
    };
    CMCDController.prototype.onBufferCreated = function (event, data) {
        var _a, _b;
        this.audioBuffer = (_a = data.tracks.audio) === null || _a === void 0 ? void 0 : _a.buffer;
        this.videoBuffer = (_b = data.tracks.video) === null || _b === void 0 ? void 0 : _b.buffer;
    };
    /**
     * Create baseline CMCD data
     */
    CMCDController.prototype.createData = function () {
        var _a;
        return {
            v: 1,
            sf: CmcdStreamingFormat_1.CmcdStreamingFormat.HLS,
            sid: this.sid,
            cid: this.cid,
            pr: (_a = this.media) === null || _a === void 0 ? void 0 : _a.playbackRate,
            mtp: this.hls.bandwidthEstimate / 1000,
        };
    };
    /**
     * Apply CMCD data to a request.
     */
    CMCDController.prototype.apply = function (context, data) {
        if (data === void 0) { data = {}; }
        // apply baseline data
        Object.assign(data, this.createData());
        var isVideo = data.ot === CmcdObjectType_1.CmcdObjectType.INIT ||
            data.ot === CmcdObjectType_1.CmcdObjectType.VIDEO ||
            data.ot === CmcdObjectType_1.CmcdObjectType.MUXED;
        if (this.starved && isVideo) {
            data.bs = true;
            data.su = true;
            this.starved = false;
        }
        if (data.su == null) {
            data.su = this.buffering;
        }
        // TODO: Implement rtp, nrr, nor, dl
        var includeKeys = this.includeKeys;
        if (includeKeys) {
            data = Object.keys(data).reduce(function (acc, key) {
                includeKeys.includes(key) && (acc[key] = data[key]);
                return acc;
            }, {});
        }
        if (this.useHeaders) {
            if (!context.headers) {
                context.headers = {};
            }
            (0, appendCmcdHeaders_1.appendCmcdHeaders)(context.headers, data);
        }
        else {
            context.url = (0, appendCmcdQuery_1.appendCmcdQuery)(context.url, data);
        }
    };
    /**
     * The CMCD object type.
     */
    CMCDController.prototype.getObjectType = function (fragment) {
        var type = fragment.type;
        if (type === 'subtitle') {
            return CmcdObjectType_1.CmcdObjectType.TIMED_TEXT;
        }
        if (fragment.sn === 'initSegment') {
            return CmcdObjectType_1.CmcdObjectType.INIT;
        }
        if (type === 'audio') {
            return CmcdObjectType_1.CmcdObjectType.AUDIO;
        }
        if (type === 'main') {
            if (!this.hls.audioTracks.length) {
                return CmcdObjectType_1.CmcdObjectType.MUXED;
            }
            return CmcdObjectType_1.CmcdObjectType.VIDEO;
        }
        return undefined;
    };
    /**
     * Get the highest bitrate.
     */
    CMCDController.prototype.getTopBandwidth = function (type) {
        var bitrate = 0;
        var levels;
        var hls = this.hls;
        if (type === CmcdObjectType_1.CmcdObjectType.AUDIO) {
            levels = hls.audioTracks;
        }
        else {
            var max = hls.maxAutoLevel;
            var len = max > -1 ? max + 1 : hls.levels.length;
            levels = hls.levels.slice(0, len);
        }
        for (var _i = 0, levels_1 = levels; _i < levels_1.length; _i++) {
            var level = levels_1[_i];
            if (level.bitrate > bitrate) {
                bitrate = level.bitrate;
            }
        }
        return bitrate > 0 ? bitrate : NaN;
    };
    /**
     * Get the buffer length for a media type in milliseconds
     */
    CMCDController.prototype.getBufferLength = function (type) {
        var media = this.hls.media;
        var buffer = type === CmcdObjectType_1.CmcdObjectType.AUDIO ? this.audioBuffer : this.videoBuffer;
        if (!buffer || !media) {
            return NaN;
        }
        var info = buffer_helper_1.BufferHelper.bufferInfo(buffer, media.currentTime, this.config.maxBufferHole);
        return info.len * 1000;
    };
    /**
     * Create a playlist loader
     */
    CMCDController.prototype.createPlaylistLoader = function () {
        var pLoader = this.config.pLoader;
        var apply = this.applyPlaylistData;
        var Ctor = pLoader || this.config.loader;
        return /** @class */ (function () {
            function CmcdPlaylistLoader(config) {
                this.loader = new Ctor(config);
            }
            Object.defineProperty(CmcdPlaylistLoader.prototype, "stats", {
                get: function () {
                    return this.loader.stats;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(CmcdPlaylistLoader.prototype, "context", {
                get: function () {
                    return this.loader.context;
                },
                enumerable: false,
                configurable: true
            });
            CmcdPlaylistLoader.prototype.destroy = function () {
                this.loader.destroy();
            };
            CmcdPlaylistLoader.prototype.abort = function () {
                this.loader.abort();
            };
            CmcdPlaylistLoader.prototype.load = function (context, config, callbacks) {
                apply(context);
                this.loader.load(context, config, callbacks);
            };
            return CmcdPlaylistLoader;
        }());
    };
    /**
     * Create a playlist loader
     */
    CMCDController.prototype.createFragmentLoader = function () {
        var fLoader = this.config.fLoader;
        var apply = this.applyFragmentData;
        var Ctor = fLoader || this.config.loader;
        return /** @class */ (function () {
            function CmcdFragmentLoader(config) {
                this.loader = new Ctor(config);
            }
            Object.defineProperty(CmcdFragmentLoader.prototype, "stats", {
                get: function () {
                    return this.loader.stats;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(CmcdFragmentLoader.prototype, "context", {
                get: function () {
                    return this.loader.context;
                },
                enumerable: false,
                configurable: true
            });
            CmcdFragmentLoader.prototype.destroy = function () {
                this.loader.destroy();
            };
            CmcdFragmentLoader.prototype.abort = function () {
                this.loader.abort();
            };
            CmcdFragmentLoader.prototype.load = function (context, config, callbacks) {
                apply(context);
                this.loader.load(context, config, callbacks);
            };
            return CmcdFragmentLoader;
        }());
    };
    return CMCDController;
}());
exports.default = CMCDController;
