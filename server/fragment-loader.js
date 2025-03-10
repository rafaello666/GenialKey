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
exports.LoadError = void 0;
var errors_1 = require("../errors");
var error_helper_1 = require("../utils/error-helper");
var MIN_CHUNK_SIZE = Math.pow(2, 17); // 128kb
var FragmentLoader = /** @class */ (function () {
    function FragmentLoader(config) {
        this.loader = null;
        this.partLoadTimeout = -1;
        this.config = config;
    }
    FragmentLoader.prototype.destroy = function () {
        if (this.loader) {
            this.loader.destroy();
            this.loader = null;
        }
    };
    FragmentLoader.prototype.abort = function () {
        if (this.loader) {
            // Abort the loader for current fragment. Only one may load at any given time
            this.loader.abort();
        }
    };
    FragmentLoader.prototype.load = function (frag, onProgress) {
        var _this = this;
        var url = frag.url;
        if (!url) {
            return Promise.reject(new LoadError({
                type: errors_1.ErrorTypes.NETWORK_ERROR,
                details: errors_1.ErrorDetails.FRAG_LOAD_ERROR,
                fatal: false,
                frag: frag,
                error: new Error("Fragment does not have a ".concat(url ? 'part list' : 'url')),
                networkDetails: null,
            }));
        }
        this.abort();
        var config = this.config;
        var FragmentILoader = config.fLoader;
        var DefaultILoader = config.loader;
        return new Promise(function (resolve, reject) {
            if (_this.loader) {
                _this.loader.destroy();
            }
            if (frag.gap) {
                if (frag.tagList.some(function (tags) { return tags[0] === 'GAP'; })) {
                    reject(createGapLoadError(frag));
                    return;
                }
                else {
                    // Reset temporary treatment as GAP tag
                    frag.gap = false;
                }
            }
            var loader = (_this.loader =
                frag.loader =
                    FragmentILoader
                        ? new FragmentILoader(config)
                        : new DefaultILoader(config));
            var loaderContext = createLoaderContext(frag);
            var loadPolicy = (0, error_helper_1.getLoaderConfigWithoutReties)(config.fragLoadPolicy.default);
            var loaderConfig = {
                loadPolicy: loadPolicy,
                timeout: loadPolicy.maxLoadTimeMs,
                maxRetry: 0,
                retryDelay: 0,
                maxRetryDelay: 0,
                highWaterMark: frag.sn === 'initSegment' ? Infinity : MIN_CHUNK_SIZE,
            };
            // Assign frag stats to the loader's stats reference
            frag.stats = loader.stats;
            loader.load(loaderContext, loaderConfig, {
                onSuccess: function (response, stats, context, networkDetails) {
                    _this.resetLoader(frag, loader);
                    var payload = response.data;
                    if (context.resetIV && frag.decryptdata) {
                        frag.decryptdata.iv = new Uint8Array(payload.slice(0, 16));
                        payload = payload.slice(16);
                    }
                    resolve({
                        frag: frag,
                        part: null,
                        payload: payload,
                        networkDetails: networkDetails,
                    });
                },
                onError: function (response, context, networkDetails, stats) {
                    _this.resetLoader(frag, loader);
                    reject(new LoadError({
                        type: errors_1.ErrorTypes.NETWORK_ERROR,
                        details: errors_1.ErrorDetails.FRAG_LOAD_ERROR,
                        fatal: false,
                        frag: frag,
                        response: __assign({ url: url, data: undefined }, response),
                        error: new Error("HTTP Error ".concat(response.code, " ").concat(response.text)),
                        networkDetails: networkDetails,
                        stats: stats,
                    }));
                },
                onAbort: function (stats, context, networkDetails) {
                    _this.resetLoader(frag, loader);
                    reject(new LoadError({
                        type: errors_1.ErrorTypes.NETWORK_ERROR,
                        details: errors_1.ErrorDetails.INTERNAL_ABORTED,
                        fatal: false,
                        frag: frag,
                        error: new Error('Aborted'),
                        networkDetails: networkDetails,
                        stats: stats,
                    }));
                },
                onTimeout: function (stats, context, networkDetails) {
                    _this.resetLoader(frag, loader);
                    reject(new LoadError({
                        type: errors_1.ErrorTypes.NETWORK_ERROR,
                        details: errors_1.ErrorDetails.FRAG_LOAD_TIMEOUT,
                        fatal: false,
                        frag: frag,
                        error: new Error("Timeout after ".concat(loaderConfig.timeout, "ms")),
                        networkDetails: networkDetails,
                        stats: stats,
                    }));
                },
                onProgress: function (stats, context, data, networkDetails) {
                    if (onProgress) {
                        onProgress({
                            frag: frag,
                            part: null,
                            payload: data,
                            networkDetails: networkDetails,
                        });
                    }
                },
            });
        });
    };
    FragmentLoader.prototype.loadPart = function (frag, part, onProgress) {
        var _this = this;
        this.abort();
        var config = this.config;
        var FragmentILoader = config.fLoader;
        var DefaultILoader = config.loader;
        return new Promise(function (resolve, reject) {
            if (_this.loader) {
                _this.loader.destroy();
            }
            if (frag.gap || part.gap) {
                reject(createGapLoadError(frag, part));
                return;
            }
            var loader = (_this.loader =
                frag.loader =
                    FragmentILoader
                        ? new FragmentILoader(config)
                        : new DefaultILoader(config));
            var loaderContext = createLoaderContext(frag, part);
            // Should we define another load policy for parts?
            var loadPolicy = (0, error_helper_1.getLoaderConfigWithoutReties)(config.fragLoadPolicy.default);
            var loaderConfig = {
                loadPolicy: loadPolicy,
                timeout: loadPolicy.maxLoadTimeMs,
                maxRetry: 0,
                retryDelay: 0,
                maxRetryDelay: 0,
                highWaterMark: MIN_CHUNK_SIZE,
            };
            // Assign part stats to the loader's stats reference
            part.stats = loader.stats;
            loader.load(loaderContext, loaderConfig, {
                onSuccess: function (response, stats, context, networkDetails) {
                    _this.resetLoader(frag, loader);
                    _this.updateStatsFromPart(frag, part);
                    var partLoadedData = {
                        frag: frag,
                        part: part,
                        payload: response.data,
                        networkDetails: networkDetails,
                    };
                    onProgress(partLoadedData);
                    resolve(partLoadedData);
                },
                onError: function (response, context, networkDetails, stats) {
                    _this.resetLoader(frag, loader);
                    reject(new LoadError({
                        type: errors_1.ErrorTypes.NETWORK_ERROR,
                        details: errors_1.ErrorDetails.FRAG_LOAD_ERROR,
                        fatal: false,
                        frag: frag,
                        part: part,
                        response: __assign({ url: loaderContext.url, data: undefined }, response),
                        error: new Error("HTTP Error ".concat(response.code, " ").concat(response.text)),
                        networkDetails: networkDetails,
                        stats: stats,
                    }));
                },
                onAbort: function (stats, context, networkDetails) {
                    frag.stats.aborted = part.stats.aborted;
                    _this.resetLoader(frag, loader);
                    reject(new LoadError({
                        type: errors_1.ErrorTypes.NETWORK_ERROR,
                        details: errors_1.ErrorDetails.INTERNAL_ABORTED,
                        fatal: false,
                        frag: frag,
                        part: part,
                        error: new Error('Aborted'),
                        networkDetails: networkDetails,
                        stats: stats,
                    }));
                },
                onTimeout: function (stats, context, networkDetails) {
                    _this.resetLoader(frag, loader);
                    reject(new LoadError({
                        type: errors_1.ErrorTypes.NETWORK_ERROR,
                        details: errors_1.ErrorDetails.FRAG_LOAD_TIMEOUT,
                        fatal: false,
                        frag: frag,
                        part: part,
                        error: new Error("Timeout after ".concat(loaderConfig.timeout, "ms")),
                        networkDetails: networkDetails,
                        stats: stats,
                    }));
                },
            });
        });
    };
    FragmentLoader.prototype.updateStatsFromPart = function (frag, part) {
        var fragStats = frag.stats;
        var partStats = part.stats;
        var partTotal = partStats.total;
        fragStats.loaded += partStats.loaded;
        if (partTotal) {
            var estTotalParts = Math.round(frag.duration / part.duration);
            var estLoadedParts = Math.min(Math.round(fragStats.loaded / partTotal), estTotalParts);
            var estRemainingParts = estTotalParts - estLoadedParts;
            var estRemainingBytes = estRemainingParts * Math.round(fragStats.loaded / estLoadedParts);
            fragStats.total = fragStats.loaded + estRemainingBytes;
        }
        else {
            fragStats.total = Math.max(fragStats.loaded, fragStats.total);
        }
        var fragLoading = fragStats.loading;
        var partLoading = partStats.loading;
        if (fragLoading.start) {
            // add to fragment loader latency
            fragLoading.first += partLoading.first - partLoading.start;
        }
        else {
            fragLoading.start = partLoading.start;
            fragLoading.first = partLoading.first;
        }
        fragLoading.end = partLoading.end;
    };
    FragmentLoader.prototype.resetLoader = function (frag, loader) {
        frag.loader = null;
        if (this.loader === loader) {
            self.clearTimeout(this.partLoadTimeout);
            this.loader = null;
        }
        loader.destroy();
    };
    return FragmentLoader;
}());
exports.default = FragmentLoader;
function createLoaderContext(frag, part) {
    var _a;
    if (part === void 0) { part = null; }
    var segment = part || frag;
    var loaderContext = {
        frag: frag,
        part: part,
        responseType: 'arraybuffer',
        url: segment.url,
        headers: {},
        rangeStart: 0,
        rangeEnd: 0,
    };
    var start = segment.byteRangeStartOffset;
    var end = segment.byteRangeEndOffset;
    if (Number.isFinite(start) && Number.isFinite(end)) {
        var byteRangeStart = start;
        var byteRangeEnd = end;
        if (frag.sn === 'initSegment' && ((_a = frag.decryptdata) === null || _a === void 0 ? void 0 : _a.method) === 'AES-128') {
            // MAP segment encrypted with method 'AES-128', when served with HTTP Range,
            // has the unencrypted size specified in the range.
            // Ref: https://tools.ietf.org/html/draft-pantos-hls-rfc8216bis-08#section-6.3.6
            var fragmentLen = end - start;
            if (fragmentLen % 16) {
                byteRangeEnd = end + (16 - (fragmentLen % 16));
            }
            if (start !== 0) {
                loaderContext.resetIV = true;
                byteRangeStart = start - 16;
            }
        }
        loaderContext.rangeStart = byteRangeStart;
        loaderContext.rangeEnd = byteRangeEnd;
    }
    return loaderContext;
}
function createGapLoadError(frag, part) {
    var error = new Error("GAP ".concat(frag.gap ? 'tag' : 'attribute', " found"));
    var errorData = {
        type: errors_1.ErrorTypes.MEDIA_ERROR,
        details: errors_1.ErrorDetails.FRAG_GAP,
        fatal: false,
        frag: frag,
        error: error,
        networkDetails: null,
    };
    if (part) {
        errorData.part = part;
    }
    (part ? part : frag).stats.aborted = true;
    return new LoadError(errorData);
}
var LoadError = /** @class */ (function (_super) {
    __extends(LoadError, _super);
    function LoadError(data) {
        var _this = _super.call(this, data.error.message) || this;
        _this.data = data;
        return _this;
    }
    return LoadError;
}(Error));
exports.LoadError = LoadError;
