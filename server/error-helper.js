"use strict";
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
exports.isTimeoutError = isTimeoutError;
exports.getRetryConfig = getRetryConfig;
exports.getRetryDelay = getRetryDelay;
exports.getLoaderConfigWithoutReties = getLoaderConfigWithoutReties;
exports.shouldRetry = shouldRetry;
exports.retryForHttpStatus = retryForHttpStatus;
var errors_1 = require("../errors");
function isTimeoutError(error) {
    switch (error.details) {
        case errors_1.ErrorDetails.FRAG_LOAD_TIMEOUT:
        case errors_1.ErrorDetails.KEY_LOAD_TIMEOUT:
        case errors_1.ErrorDetails.LEVEL_LOAD_TIMEOUT:
        case errors_1.ErrorDetails.MANIFEST_LOAD_TIMEOUT:
            return true;
    }
    return false;
}
function getRetryConfig(loadPolicy, error) {
    var isTimeout = isTimeoutError(error);
    return loadPolicy.default["".concat(isTimeout ? 'timeout' : 'error', "Retry")];
}
function getRetryDelay(retryConfig, retryCount) {
    // exponential backoff capped to max retry delay
    var backoffFactor = retryConfig.backoff === 'linear' ? 1 : Math.pow(2, retryCount);
    return Math.min(backoffFactor * retryConfig.retryDelayMs, retryConfig.maxRetryDelayMs);
}
function getLoaderConfigWithoutReties(loderConfig) {
    return __assign(__assign({}, loderConfig), {
        errorRetry: null,
        timeoutRetry: null,
    });
}
function shouldRetry(retryConfig, retryCount, isTimeout, loaderResponse) {
    if (!retryConfig) {
        return false;
    }
    var httpStatus = loaderResponse === null || loaderResponse === void 0 ? void 0 : loaderResponse.code;
    var retry = retryCount < retryConfig.maxNumRetry &&
        (retryForHttpStatus(httpStatus) || !!isTimeout);
    return retryConfig.shouldRetry
        ? retryConfig.shouldRetry(retryConfig, retryCount, isTimeout, loaderResponse, retry)
        : retry;
}
function retryForHttpStatus(httpStatus) {
    // Do not retry on status 4xx, status 0 (CORS error), or undefined (decrypt/gap/parse error)
    return ((httpStatus === 0 && navigator.onLine === false) ||
        (!!httpStatus && (httpStatus < 400 || httpStatus > 499)));
}
