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
exports.fetchSupported = fetchSupported;
var load_stats_1 = require("../loader/load-stats");
var chunk_cache_1 = require("../demux/chunk-cache");
function fetchSupported() {
    if (
    // @ts-ignore
    self.fetch &&
        self.AbortController &&
        self.ReadableStream &&
        self.Request) {
        try {
            new self.ReadableStream({}); // eslint-disable-line no-new
            return true;
        }
        catch (e) {
            /* noop */
        }
    }
    return false;
}
var BYTERANGE = /(\d+)-(\d+)\/(\d+)/;
var FetchLoader = /** @class */ (function () {
    function FetchLoader(config /* HlsConfig */) {
        this.request = null;
        this.response = null;
        this.context = null;
        this.config = null;
        this.callbacks = null;
        this.loader = null;
        this.fetchSetup = config.fetchSetup || getRequest;
        this.controller = new self.AbortController();
        this.stats = new load_stats_1.LoadStats();
    }
    FetchLoader.prototype.destroy = function () {
        this.loader =
            this.callbacks =
                this.context =
                    this.config =
                        this.request =
                            null;
        this.abortInternal();
        this.response = null;
        // @ts-ignore
        this.fetchSetup = this.controller = this.stats = null;
    };
    FetchLoader.prototype.abortInternal = function () {
        if (this.controller && !this.stats.loading.end) {
            this.stats.aborted = true;
            this.controller.abort();
        }
    };
    FetchLoader.prototype.abort = function () {
        var _a;
        this.abortInternal();
        if ((_a = this.callbacks) === null || _a === void 0 ? void 0 : _a.onAbort) {
            this.callbacks.onAbort(this.stats, this.context, this.response);
        }
    };
    FetchLoader.prototype.load = function (context, config, callbacks) {
        var _this = this;
        var stats = this.stats;
        if (stats.loading.start) {
            throw new Error('Loader can only be used once.');
        }
        stats.loading.start = self.performance.now();
        var initParams = getRequestParameters(context, this.controller.signal);
        var onProgress = callbacks.onProgress;
        var isArrayBuffer = context.responseType === 'arraybuffer';
        var LENGTH = isArrayBuffer ? 'byteLength' : 'length';
        var _a = config.loadPolicy, maxTimeToFirstByteMs = _a.maxTimeToFirstByteMs, maxLoadTimeMs = _a.maxLoadTimeMs;
        this.context = context;
        this.config = config;
        this.callbacks = callbacks;
        this.request = this.fetchSetup(context, initParams);
        self.clearTimeout(this.requestTimeout);
        config.timeout =
            maxTimeToFirstByteMs && Number.isFinite(maxTimeToFirstByteMs)
                ? maxTimeToFirstByteMs
                : maxLoadTimeMs;
        this.requestTimeout = self.setTimeout(function () {
            _this.abortInternal();
            callbacks.onTimeout(stats, context, _this.response);
        }, config.timeout);
        self
            .fetch(this.request)
            .then(function (response) {
            _this.response = _this.loader = response;
            var first = Math.max(self.performance.now(), stats.loading.start);
            self.clearTimeout(_this.requestTimeout);
            config.timeout = maxLoadTimeMs;
            _this.requestTimeout = self.setTimeout(function () {
                _this.abortInternal();
                callbacks.onTimeout(stats, context, _this.response);
            }, maxLoadTimeMs - (first - stats.loading.start));
            if (!response.ok) {
                var status_1 = response.status, statusText = response.statusText;
                throw new FetchError(statusText || 'fetch, bad network response', status_1, response);
            }
            stats.loading.first = first;
            stats.total = getContentLength(response.headers) || stats.total;
            if (onProgress && Number.isFinite(config.highWaterMark)) {
                return _this.loadProgressively(response, stats, context, config.highWaterMark, onProgress);
            }
            if (isArrayBuffer) {
                return response.arrayBuffer();
            }
            if (context.responseType === 'json') {
                return response.json();
            }
            return response.text();
        })
            .then(function (responseData) {
            var response = _this.response;
            if (!response) {
                throw new Error('loader destroyed');
            }
            self.clearTimeout(_this.requestTimeout);
            stats.loading.end = Math.max(self.performance.now(), stats.loading.first);
            var total = responseData[LENGTH];
            if (total) {
                stats.loaded = stats.total = total;
            }
            var loaderResponse = {
                url: response.url,
                data: responseData,
                code: response.status,
            };
            if (onProgress && !Number.isFinite(config.highWaterMark)) {
                onProgress(stats, context, responseData, response);
            }
            callbacks.onSuccess(loaderResponse, stats, context, response);
        })
            .catch(function (error) {
            self.clearTimeout(_this.requestTimeout);
            if (stats.aborted) {
                return;
            }
            // CORS errors result in an undefined code. Set it to 0 here to align with XHR's behavior
            // when destroying, 'error' itself can be undefined
            var code = !error ? 0 : error.code || 0;
            var text = !error ? null : error.message;
            callbacks.onError({ code: code, text: text }, context, error ? error.details : null, stats);
        });
    };
    FetchLoader.prototype.getCacheAge = function () {
        var result = null;
        if (this.response) {
            var ageHeader = this.response.headers.get('age');
            result = ageHeader ? parseFloat(ageHeader) : null;
        }
        return result;
    };
    FetchLoader.prototype.getResponseHeader = function (name) {
        return this.response ? this.response.headers.get(name) : null;
    };
    FetchLoader.prototype.loadProgressively = function (response, stats, context, highWaterMark, onProgress) {
        if (highWaterMark === void 0) { highWaterMark = 0; }
        var chunkCache = new chunk_cache_1.default();
        var reader = response.body.getReader();
        var pump = function () {
            return reader
                .read()
                .then(function (data) {
                if (data.done) {
                    if (chunkCache.dataLength) {
                        onProgress(stats, context, chunkCache.flush(), response);
                    }
                    return Promise.resolve(new ArrayBuffer(0));
                }
                var chunk = data.value;
                var len = chunk.length;
                stats.loaded += len;
                if (len < highWaterMark || chunkCache.dataLength) {
                    // The current chunk is too small to to be emitted or the cache already has data
                    // Push it to the cache
                    chunkCache.push(chunk);
                    if (chunkCache.dataLength >= highWaterMark) {
                        // flush in order to join the typed arrays
                        onProgress(stats, context, chunkCache.flush(), response);
                    }
                }
                else {
                    // If there's nothing cached already, and the chache is large enough
                    // just emit the progress event
                    onProgress(stats, context, chunk, response);
                }
                return pump();
            })
                .catch(function () {
                /* aborted */
                return Promise.reject();
            });
        };
        return pump();
    };
    return FetchLoader;
}());
function getRequestParameters(context, signal) {
    var initParams = {
        method: 'GET',
        mode: 'cors',
        credentials: 'same-origin',
        signal: signal,
        headers: new self.Headers(Object.assign({}, context.headers)),
    };
    if (context.rangeEnd) {
        initParams.headers.set('Range', 'bytes=' + context.rangeStart + '-' + String(context.rangeEnd - 1));
    }
    return initParams;
}
function getByteRangeLength(byteRangeHeader) {
    var result = BYTERANGE.exec(byteRangeHeader);
    if (result) {
        return parseInt(result[2]) - parseInt(result[1]) + 1;
    }
}
function getContentLength(headers) {
    var contentRange = headers.get('Content-Range');
    if (contentRange) {
        var byteRangeLength = getByteRangeLength(contentRange);
        if (Number.isFinite(byteRangeLength)) {
            return byteRangeLength;
        }
    }
    var contentLength = headers.get('Content-Length');
    if (contentLength) {
        return parseInt(contentLength);
    }
}
function getRequest(context, initParams) {
    return new self.Request(context.url, initParams);
}
var FetchError = /** @class */ (function (_super) {
    __extends(FetchError, _super);
    function FetchError(message, code, details) {
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.details = details;
        return _this;
    }
    return FetchError;
}(Error));
exports.default = FetchLoader;
