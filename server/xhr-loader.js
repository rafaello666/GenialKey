"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var logger_1 = require("../utils/logger");
var load_stats_1 = require("../loader/load-stats");
var error_helper_1 = require("./error-helper");
var AGE_HEADER_LINE_REGEX = /^age:\s*[\d.]+\s*$/im;
var XhrLoader = /** @class */ (function () {
    function XhrLoader(config) {
        this.config = null;
        this.callbacks = null;
        this.context = null;
        this.loader = null;
        this.xhrSetup = config ? config.xhrSetup || null : null;
        this.stats = new load_stats_1.LoadStats();
        this.retryDelay = 0;
    }
    XhrLoader.prototype.destroy = function () {
        this.callbacks = null;
        this.abortInternal();
        this.loader = null;
        this.config = null;
        this.context = null;
        this.xhrSetup = null;
    };
    XhrLoader.prototype.abortInternal = function () {
        var loader = this.loader;
        self.clearTimeout(this.requestTimeout);
        self.clearTimeout(this.retryTimeout);
        if (loader) {
            loader.onreadystatechange = null;
            loader.onprogress = null;
            if (loader.readyState !== 4) {
                this.stats.aborted = true;
                loader.abort();
            }
        }
    };
    XhrLoader.prototype.abort = function () {
        var _a;
        this.abortInternal();
        if ((_a = this.callbacks) === null || _a === void 0 ? void 0 : _a.onAbort) {
            this.callbacks.onAbort(this.stats, this.context, this.loader);
        }
    };
    XhrLoader.prototype.load = function (context, config, callbacks) {
        if (this.stats.loading.start) {
            throw new Error('Loader can only be used once.');
        }
        this.stats.loading.start = self.performance.now();
        this.context = context;
        this.config = config;
        this.callbacks = callbacks;
        this.loadInternal();
    };
    XhrLoader.prototype.loadInternal = function () {
        var _this = this;
        var _a = this, config = _a.config, context = _a.context;
        if (!config || !context) {
            return;
        }
        var xhr = (this.loader = new self.XMLHttpRequest());
        var stats = this.stats;
        stats.loading.first = 0;
        stats.loaded = 0;
        stats.aborted = false;
        var xhrSetup = this.xhrSetup;
        if (xhrSetup) {
            Promise.resolve()
                .then(function () {
                if (_this.loader !== xhr || _this.stats.aborted)
                    return;
                return xhrSetup(xhr, context.url);
            })
                .catch(function (error) {
                if (_this.loader !== xhr || _this.stats.aborted)
                    return;
                xhr.open('GET', context.url, true);
                return xhrSetup(xhr, context.url);
            })
                .then(function () {
                if (_this.loader !== xhr || _this.stats.aborted)
                    return;
                _this.openAndSendXhr(xhr, context, config);
            })
                .catch(function (error) {
                // IE11 throws an exception on xhr.open if attempting to access an HTTP resource over HTTPS
                _this.callbacks.onError({ code: xhr.status, text: error.message }, context, xhr, stats);
                return;
            });
        }
        else {
            this.openAndSendXhr(xhr, context, config);
        }
    };
    XhrLoader.prototype.openAndSendXhr = function (xhr, context, config) {
        if (!xhr.readyState) {
            xhr.open('GET', context.url, true);
        }
        var headers = context.headers;
        var _a = config.loadPolicy, maxTimeToFirstByteMs = _a.maxTimeToFirstByteMs, maxLoadTimeMs = _a.maxLoadTimeMs;
        if (headers) {
            for (var header in headers) {
                xhr.setRequestHeader(header, headers[header]);
            }
        }
        if (context.rangeEnd) {
            xhr.setRequestHeader('Range', 'bytes=' + context.rangeStart + '-' + (context.rangeEnd - 1));
        }
        xhr.onreadystatechange = this.readystatechange.bind(this);
        xhr.onprogress = this.loadprogress.bind(this);
        xhr.responseType = context.responseType;
        // setup timeout before we perform request
        self.clearTimeout(this.requestTimeout);
        config.timeout =
            maxTimeToFirstByteMs && Number.isFinite(maxTimeToFirstByteMs)
                ? maxTimeToFirstByteMs
                : maxLoadTimeMs;
        this.requestTimeout = self.setTimeout(this.loadtimeout.bind(this), config.timeout);
        xhr.send();
    };
    XhrLoader.prototype.readystatechange = function () {
        var _a = this, context = _a.context, xhr = _a.loader, stats = _a.stats;
        if (!context || !xhr) {
            return;
        }
        var readyState = xhr.readyState;
        var config = this.config;
        // don't proceed if xhr has been aborted
        if (stats.aborted) {
            return;
        }
        // >= HEADERS_RECEIVED
        if (readyState >= 2) {
            if (stats.loading.first === 0) {
                stats.loading.first = Math.max(self.performance.now(), stats.loading.start);
                // readyState >= 2 AND readyState !==4 (readyState = HEADERS_RECEIVED || LOADING) rearm timeout as xhr not finished yet
                if (config.timeout !== config.loadPolicy.maxLoadTimeMs) {
                    self.clearTimeout(this.requestTimeout);
                    config.timeout = config.loadPolicy.maxLoadTimeMs;
                    this.requestTimeout = self.setTimeout(this.loadtimeout.bind(this), config.loadPolicy.maxLoadTimeMs -
                        (stats.loading.first - stats.loading.start));
                }
            }
            if (readyState === 4) {
                self.clearTimeout(this.requestTimeout);
                xhr.onreadystatechange = null;
                xhr.onprogress = null;
                var status_1 = xhr.status;
                // http status between 200 to 299 are all successful
                var useResponseText = xhr.responseType === 'text' ? xhr.responseText : null;
                if (status_1 >= 200 && status_1 < 300) {
                    var data = useResponseText !== null && useResponseText !== void 0 ? useResponseText : xhr.response;
                    if (data != null) {
                        stats.loading.end = Math.max(self.performance.now(), stats.loading.first);
                        var len = xhr.responseType === 'arraybuffer'
                            ? data.byteLength
                            : data.length;
                        stats.loaded = stats.total = len;
                        stats.bwEstimate =
                            (stats.total * 8000) / (stats.loading.end - stats.loading.first);
                        if (!this.callbacks) {
                            return;
                        }
                        var onProgress = this.callbacks.onProgress;
                        if (onProgress) {
                            onProgress(stats, context, data, xhr);
                        }
                        if (!this.callbacks) {
                            return;
                        }
                        var response_1 = {
                            url: xhr.responseURL,
                            data: data,
                            code: status_1,
                        };
                        this.callbacks.onSuccess(response_1, stats, context, xhr);
                        return;
                    }
                }
                // Handle bad status or nullish response
                var retryConfig = config.loadPolicy.errorRetry;
                var retryCount = stats.retry;
                // if max nb of retries reached or if http status between 400 and 499 (such error cannot be recovered, retrying is useless), return error
                var response = {
                    url: context.url,
                    data: undefined,
                    code: status_1,
                };
                if ((0, error_helper_1.shouldRetry)(retryConfig, retryCount, false, response)) {
                    this.retry(retryConfig);
                }
                else {
                    logger_1.logger.error("".concat(status_1, " while loading ").concat(context.url));
                    this.callbacks.onError({ code: status_1, text: xhr.statusText }, context, xhr, stats);
                }
            }
        }
    };
    XhrLoader.prototype.loadtimeout = function () {
        var _a;
        if (!this.config)
            return;
        var retryConfig = this.config.loadPolicy.timeoutRetry;
        var retryCount = this.stats.retry;
        if ((0, error_helper_1.shouldRetry)(retryConfig, retryCount, true)) {
            this.retry(retryConfig);
        }
        else {
            logger_1.logger.warn("timeout while loading ".concat((_a = this.context) === null || _a === void 0 ? void 0 : _a.url));
            var callbacks = this.callbacks;
            if (callbacks) {
                this.abortInternal();
                callbacks.onTimeout(this.stats, this.context, this.loader);
            }
        }
    };
    XhrLoader.prototype.retry = function (retryConfig) {
        var _a = this, context = _a.context, stats = _a.stats;
        this.retryDelay = (0, error_helper_1.getRetryDelay)(retryConfig, stats.retry);
        stats.retry++;
        logger_1.logger.warn("".concat(status ? 'HTTP Status ' + status : 'Timeout', " while loading ").concat(context === null || context === void 0 ? void 0 : context.url, ", retrying ").concat(stats.retry, "/").concat(retryConfig.maxNumRetry, " in ").concat(this.retryDelay, "ms"));
        // abort and reset internal state
        this.abortInternal();
        this.loader = null;
        // schedule retry
        self.clearTimeout(this.retryTimeout);
        this.retryTimeout = self.setTimeout(this.loadInternal.bind(this), this.retryDelay);
    };
    XhrLoader.prototype.loadprogress = function (event) {
        var stats = this.stats;
        stats.loaded = event.loaded;
        if (event.lengthComputable) {
            stats.total = event.total;
        }
    };
    XhrLoader.prototype.getCacheAge = function () {
        var result = null;
        if (this.loader &&
            AGE_HEADER_LINE_REGEX.test(this.loader.getAllResponseHeaders())) {
            var ageHeader = this.loader.getResponseHeader('age');
            result = ageHeader ? parseFloat(ageHeader) : null;
        }
        return result;
    };
    XhrLoader.prototype.getResponseHeader = function (name) {
        if (this.loader &&
            new RegExp("^".concat(name, ":\\s*[\\d.]+\\s*$"), 'im').test(this.loader.getAllResponseHeaders())) {
            return this.loader.getResponseHeader(name);
        }
        return null;
    };
    return XhrLoader;
}());
exports.default = XhrLoader;
