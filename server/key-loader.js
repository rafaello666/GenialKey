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
var errors_1 = require("../errors");
var fragment_loader_1 = require("./fragment-loader");
var KeyLoader = /** @class */ (function () {
    function KeyLoader(config) {
        this.keyUriToKeyInfo = {};
        this.emeController = null;
        this.config = config;
    }
    KeyLoader.prototype.abort = function (type) {
        var _a;
        for (var uri in this.keyUriToKeyInfo) {
            var loader = this.keyUriToKeyInfo[uri].loader;
            if (loader) {
                if (type && type !== ((_a = loader.context) === null || _a === void 0 ? void 0 : _a.frag.type)) {
                    return;
                }
                loader.abort();
            }
        }
    };
    KeyLoader.prototype.detach = function () {
        for (var uri in this.keyUriToKeyInfo) {
            var keyInfo = this.keyUriToKeyInfo[uri];
            // Remove cached EME keys on detach
            if (keyInfo.mediaKeySessionContext ||
                keyInfo.decryptdata.isCommonEncryption) {
                delete this.keyUriToKeyInfo[uri];
            }
        }
    };
    KeyLoader.prototype.destroy = function () {
        this.detach();
        for (var uri in this.keyUriToKeyInfo) {
            var loader = this.keyUriToKeyInfo[uri].loader;
            if (loader) {
                loader.destroy();
            }
        }
        this.keyUriToKeyInfo = {};
    };
    KeyLoader.prototype.createKeyLoadError = function (frag, details, error, networkDetails, response) {
        if (details === void 0) { details = errors_1.ErrorDetails.KEY_LOAD_ERROR; }
        return new fragment_loader_1.LoadError({
            type: errors_1.ErrorTypes.NETWORK_ERROR,
            details: details,
            fatal: false,
            frag: frag,
            response: response,
            error: error,
            networkDetails: networkDetails,
        });
    };
    KeyLoader.prototype.loadClear = function (loadingFrag, encryptedFragments) {
        if (this.emeController && this.config.emeEnabled) {
            // access key-system with nearest key on start (loaidng frag is unencrypted)
            var sn = loadingFrag.sn, cc = loadingFrag.cc;
            var _loop_1 = function (i) {
                var frag = encryptedFragments[i];
                if (cc <= frag.cc &&
                    (sn === 'initSegment' || frag.sn === 'initSegment' || sn < frag.sn)) {
                    this_1.emeController
                        .selectKeySystemFormat(frag)
                        .then(function (keySystemFormat) {
                        frag.setKeyFormat(keySystemFormat);
                    });
                    return "break";
                }
            };
            var this_1 = this;
            for (var i = 0; i < encryptedFragments.length; i++) {
                var state_1 = _loop_1(i);
                if (state_1 === "break")
                    break;
            }
        }
    };
    KeyLoader.prototype.load = function (frag) {
        var _this = this;
        if (!frag.decryptdata &&
            frag.encrypted &&
            this.emeController &&
            this.config.emeEnabled) {
            // Multiple keys, but none selected, resolve in eme-controller
            return this.emeController
                .selectKeySystemFormat(frag)
                .then(function (keySystemFormat) {
                return _this.loadInternal(frag, keySystemFormat);
            });
        }
        return this.loadInternal(frag);
    };
    KeyLoader.prototype.loadInternal = function (frag, keySystemFormat) {
        var _a;
        if (keySystemFormat) {
            frag.setKeyFormat(keySystemFormat);
        }
        var decryptdata = frag.decryptdata;
        if (!decryptdata) {
            var error = new Error(keySystemFormat
                ? "Expected frag.decryptdata to be defined after setting format ".concat(keySystemFormat)
                : 'Missing decryption data on fragment in onKeyLoading');
            return Promise.reject(this.createKeyLoadError(frag, errors_1.ErrorDetails.KEY_LOAD_ERROR, error));
        }
        var uri = decryptdata.uri;
        if (!uri) {
            return Promise.reject(this.createKeyLoadError(frag, errors_1.ErrorDetails.KEY_LOAD_ERROR, new Error("Invalid key URI: \"".concat(uri, "\""))));
        }
        var keyInfo = this.keyUriToKeyInfo[uri];
        if (keyInfo === null || keyInfo === void 0 ? void 0 : keyInfo.decryptdata.key) {
            decryptdata.key = keyInfo.decryptdata.key;
            return Promise.resolve({ frag: frag, keyInfo: keyInfo });
        }
        // Return key load promise as long as it does not have a mediakey session with an unusable key status
        if (keyInfo === null || keyInfo === void 0 ? void 0 : keyInfo.keyLoadPromise) {
            switch ((_a = keyInfo.mediaKeySessionContext) === null || _a === void 0 ? void 0 : _a.keyStatus) {
                case undefined:
                case 'status-pending':
                case 'usable':
                case 'usable-in-future':
                    return keyInfo.keyLoadPromise.then(function (keyLoadedData) {
                        // Return the correct fragment with updated decryptdata key and loaded keyInfo
                        decryptdata.key = keyLoadedData.keyInfo.decryptdata.key;
                        return { frag: frag, keyInfo: keyInfo };
                    });
            }
            // If we have a key session and status and it is not pending or usable, continue
            // This will go back to the eme-controller for expired keys to get a new keyLoadPromise
        }
        // Load the key or return the loading promise
        keyInfo = this.keyUriToKeyInfo[uri] = {
            decryptdata: decryptdata,
            keyLoadPromise: null,
            loader: null,
            mediaKeySessionContext: null,
        };
        switch (decryptdata.method) {
            case 'ISO-23001-7':
            case 'SAMPLE-AES':
            case 'SAMPLE-AES-CENC':
            case 'SAMPLE-AES-CTR':
                if (decryptdata.keyFormat === 'identity') {
                    // loadKeyHTTP handles http(s) and data URLs
                    return this.loadKeyHTTP(keyInfo, frag);
                }
                return this.loadKeyEME(keyInfo, frag);
            case 'AES-128':
                return this.loadKeyHTTP(keyInfo, frag);
            default:
                return Promise.reject(this.createKeyLoadError(frag, errors_1.ErrorDetails.KEY_LOAD_ERROR, new Error("Key supplied with unsupported METHOD: \"".concat(decryptdata.method, "\""))));
        }
    };
    KeyLoader.prototype.loadKeyEME = function (keyInfo, frag) {
        var keyLoadedData = { frag: frag, keyInfo: keyInfo };
        if (this.emeController && this.config.emeEnabled) {
            var keySessionContextPromise = this.emeController.loadKey(keyLoadedData);
            if (keySessionContextPromise) {
                return (keyInfo.keyLoadPromise = keySessionContextPromise.then(function (keySessionContext) {
                    keyInfo.mediaKeySessionContext = keySessionContext;
                    return keyLoadedData;
                })).catch(function (error) {
                    // Remove promise for license renewal or retry
                    keyInfo.keyLoadPromise = null;
                    throw error;
                });
            }
        }
        return Promise.resolve(keyLoadedData);
    };
    KeyLoader.prototype.loadKeyHTTP = function (keyInfo, frag) {
        var _this = this;
        var config = this.config;
        var Loader = config.loader;
        var keyLoader = new Loader(config);
        frag.keyLoader = keyInfo.loader = keyLoader;
        return (keyInfo.keyLoadPromise = new Promise(function (resolve, reject) {
            var loaderContext = {
                keyInfo: keyInfo,
                frag: frag,
                responseType: 'arraybuffer',
                url: keyInfo.decryptdata.uri,
            };
            // maxRetry is 0 so that instead of retrying the same key on the same variant multiple times,
            // key-loader will trigger an error and rely on stream-controller to handle retry logic.
            // this will also align retry logic with fragment-loader
            var loadPolicy = config.keyLoadPolicy.default;
            var loaderConfig = {
                loadPolicy: loadPolicy,
                timeout: loadPolicy.maxLoadTimeMs,
                maxRetry: 0,
                retryDelay: 0,
                maxRetryDelay: 0,
            };
            var loaderCallbacks = {
                onSuccess: function (response, stats, context, networkDetails) {
                    var frag = context.frag, keyInfo = context.keyInfo, uri = context.url;
                    if (!frag.decryptdata || keyInfo !== _this.keyUriToKeyInfo[uri]) {
                        return reject(_this.createKeyLoadError(frag, errors_1.ErrorDetails.KEY_LOAD_ERROR, new Error('after key load, decryptdata unset or changed'), networkDetails));
                    }
                    keyInfo.decryptdata.key = frag.decryptdata.key = new Uint8Array(response.data);
                    // detach fragment key loader on load success
                    frag.keyLoader = null;
                    keyInfo.loader = null;
                    resolve({ frag: frag, keyInfo: keyInfo });
                },
                onError: function (response, context, networkDetails, stats) {
                    _this.resetLoader(context);
                    reject(_this.createKeyLoadError(frag, errors_1.ErrorDetails.KEY_LOAD_ERROR, new Error("HTTP Error ".concat(response.code, " loading key ").concat(response.text)), networkDetails, __assign({ url: loaderContext.url, data: undefined }, response)));
                },
                onTimeout: function (stats, context, networkDetails) {
                    _this.resetLoader(context);
                    reject(_this.createKeyLoadError(frag, errors_1.ErrorDetails.KEY_LOAD_TIMEOUT, new Error('key loading timed out'), networkDetails));
                },
                onAbort: function (stats, context, networkDetails) {
                    _this.resetLoader(context);
                    reject(_this.createKeyLoadError(frag, errors_1.ErrorDetails.INTERNAL_ABORTED, new Error('key loading aborted'), networkDetails));
                },
            };
            keyLoader.load(loaderContext, loaderConfig, loaderCallbacks);
        }));
    };
    KeyLoader.prototype.resetLoader = function (context) {
        var frag = context.frag, keyInfo = context.keyInfo, uri = context.url;
        var loader = keyInfo.loader;
        if (frag.keyLoader === loader) {
            frag.keyLoader = null;
            keyInfo.loader = null;
        }
        delete this.keyUriToKeyInfo[uri];
        if (loader) {
            loader.destroy();
        }
    };
    return KeyLoader;
}());
exports.default = KeyLoader;
