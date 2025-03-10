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
/**
 * @author Stephan Hesse <disparat@gmail.com> | <tchakabam@gmail.com>
 *
 * DRM support for Hls.js
 */
var events_1 = require("../events");
var errors_1 = require("../errors");
var logger_1 = require("../utils/logger");
var mediakeys_helper_1 = require("../utils/mediakeys-helper");
var keysystem_util_1 = require("../utils/keysystem-util");
var numeric_encoding_utils_1 = require("../utils/numeric-encoding-utils");
var level_key_1 = require("../loader/level-key");
var hex_1 = require("../utils/hex");
var mp4_tools_1 = require("../utils/mp4-tools");
var eventemitter3_1 = require("eventemitter3");
var LOGGER_PREFIX = '[eme]';
/**
 * Controller to deal with encrypted media extensions (EME)
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Encrypted_Media_Extensions_API
 *
 * @class
 * @constructor
 */
var EMEController = /** @class */ (function () {
    function EMEController(hls) {
        var _this = this;
        this.media = null;
        this.keyFormatPromise = null;
        this.keySystemAccessPromises = {};
        this._requestLicenseFailureCount = 0;
        this.mediaKeySessions = [];
        this.keyIdToKeySessionPromise = {};
        this.setMediaKeysQueue = EMEController.CDMCleanupPromise
            ? [EMEController.CDMCleanupPromise]
            : [];
        this.debug = logger_1.logger.debug.bind(logger_1.logger, LOGGER_PREFIX);
        this.log = logger_1.logger.log.bind(logger_1.logger, LOGGER_PREFIX);
        this.warn = logger_1.logger.warn.bind(logger_1.logger, LOGGER_PREFIX);
        this.error = logger_1.logger.error.bind(logger_1.logger, LOGGER_PREFIX);
        this.onMediaEncrypted = function (event) {
            var initDataType = event.initDataType, initData = event.initData;
            var logMessage = "\"".concat(event.type, "\" event: init data type: \"").concat(initDataType, "\"");
            _this.debug(logMessage);
            // Ignore event when initData is null
            if (initData === null) {
                return;
            }
            if (!_this.keyFormatPromise) {
                var keySystems = Object.keys(_this.keySystemAccessPromises);
                if (!keySystems.length) {
                    keySystems = (0, mediakeys_helper_1.getKeySystemsForConfig)(_this.config);
                }
                var keyFormats = keySystems
                    .map(mediakeys_helper_1.keySystemDomainToKeySystemFormat)
                    .filter(function (k) { return !!k; });
                _this.keyFormatPromise = _this.getKeyFormatPromise(keyFormats);
            }
            _this.keyFormatPromise.then(function (keySystemFormat) {
                var keySystem = (0, mediakeys_helper_1.keySystemFormatToKeySystemDomain)(keySystemFormat);
                var keyId;
                var keySystemDomain;
                if (initDataType === 'sinf') {
                    if (keySystem !== mediakeys_helper_1.KeySystems.FAIRPLAY) {
                        _this.warn("Ignoring unexpected \"".concat(event.type, "\" event with init data type: \"").concat(initDataType, "\" for selected key-system ").concat(keySystem));
                        return;
                    }
                    // Match sinf keyId to playlist skd://keyId=
                    var json = (0, mp4_tools_1.bin2str)(new Uint8Array(initData));
                    try {
                        var sinf = (0, numeric_encoding_utils_1.base64Decode)(JSON.parse(json).sinf);
                        var tenc = (0, mp4_tools_1.parseSinf)(sinf);
                        if (!tenc) {
                            throw new Error("'schm' box missing or not cbcs/cenc with schi > tenc");
                        }
                        keyId = tenc.subarray(8, 24);
                        keySystemDomain = mediakeys_helper_1.KeySystems.FAIRPLAY;
                    }
                    catch (error) {
                        _this.warn("".concat(logMessage, " Failed to parse sinf: ").concat(error));
                        return;
                    }
                }
                else {
                    if (keySystem !== mediakeys_helper_1.KeySystems.WIDEVINE &&
                        keySystem !== mediakeys_helper_1.KeySystems.PLAYREADY) {
                        _this.warn("Ignoring unexpected \"".concat(event.type, "\" event with init data type: \"").concat(initDataType, "\" for selected key-system ").concat(keySystem));
                        return;
                    }
                    // Support Widevine/PlayReady clear-lead key-session creation (otherwise depend on playlist keys)
                    var psshResults = (0, mp4_tools_1.parseMultiPssh)(initData);
                    var psshInfos = psshResults.filter(function (pssh) {
                        return !!pssh.systemId &&
                            (0, mediakeys_helper_1.keySystemIdToKeySystemDomain)(pssh.systemId) === keySystem;
                    });
                    if (psshInfos.length > 1) {
                        _this.warn("".concat(logMessage, " Using first of ").concat(psshInfos.length, " pssh found for selected key-system ").concat(keySystem));
                    }
                    var psshInfo = psshInfos[0];
                    if (!psshInfo) {
                        if (psshResults.length === 0 ||
                            psshResults.some(function (pssh) { return !pssh.systemId; })) {
                            _this.warn("".concat(logMessage, " contains incomplete or invalid pssh data"));
                        }
                        else {
                            _this.log("ignoring ".concat(logMessage, " for ").concat(psshResults
                                .map(function (pssh) { return (0, mediakeys_helper_1.keySystemIdToKeySystemDomain)(pssh.systemId); })
                                .join(','), " pssh data in favor of playlist keys"));
                        }
                        return;
                    }
                    keySystemDomain = (0, mediakeys_helper_1.keySystemIdToKeySystemDomain)(psshInfo.systemId);
                    if (psshInfo.version === 0 && psshInfo.data) {
                        if (keySystemDomain === mediakeys_helper_1.KeySystems.WIDEVINE) {
                            var offset = psshInfo.data.length - 22;
                            keyId = psshInfo.data.subarray(offset, offset + 16);
                        }
                        else if (keySystemDomain === mediakeys_helper_1.KeySystems.PLAYREADY) {
                            keyId = (0, mediakeys_helper_1.parsePlayReadyWRM)(psshInfo.data);
                        }
                    }
                }
                if (!keySystemDomain || !keyId) {
                    _this.log("Unable to handle ".concat(logMessage, " with key-system ").concat(keySystem));
                    return;
                }
                var keyIdHex = hex_1.default.hexDump(keyId);
                var _a = _this, keyIdToKeySessionPromise = _a.keyIdToKeySessionPromise, mediaKeySessions = _a.mediaKeySessions;
                var keySessionContextPromise = keyIdToKeySessionPromise[keyIdHex];
                var _loop_1 = function (i) {
                    // Match playlist key
                    var keyContext = mediaKeySessions[i];
                    var decryptdata = keyContext.decryptdata;
                    if (!decryptdata.keyId) {
                        return "continue";
                    }
                    var oldKeyIdHex = hex_1.default.hexDump(decryptdata.keyId);
                    if (keyIdHex === oldKeyIdHex ||
                        decryptdata.uri.replace(/-/g, '').indexOf(keyIdHex) !== -1) {
                        keySessionContextPromise = keyIdToKeySessionPromise[oldKeyIdHex];
                        if (decryptdata.pssh) {
                            return "break";
                        }
                        delete keyIdToKeySessionPromise[oldKeyIdHex];
                        decryptdata.pssh = new Uint8Array(initData);
                        decryptdata.keyId = keyId;
                        keySessionContextPromise = keyIdToKeySessionPromise[keyIdHex] =
                            keySessionContextPromise.then(function () {
                                return _this.generateRequestWithPreferredKeySession(keyContext, initDataType, initData, 'encrypted-event-key-match');
                            });
                        keySessionContextPromise.catch(function (error) { return _this.handleError(error); });
                        return "break";
                    }
                };
                for (var i = 0; i < mediaKeySessions.length; i++) {
                    var state_1 = _loop_1(i);
                    if (state_1 === "break")
                        break;
                }
                if (!keySessionContextPromise) {
                    if (keySystemDomain !== keySystem) {
                        _this.log("Ignoring \"".concat(logMessage, "\" with ").concat(keySystemDomain, " init data for selected key-system ").concat(keySystem));
                        return;
                    }
                    // "Clear-lead" (misc key not encountered in playlist)
                    keySessionContextPromise = keyIdToKeySessionPromise[keyIdHex] =
                        _this.getKeySystemSelectionPromise([keySystemDomain]).then(function (_a) {
                            var _b;
                            var keySystem = _a.keySystem, mediaKeys = _a.mediaKeys;
                            _this.throwIfDestroyed();
                            var decryptdata = new level_key_1.LevelKey('ISO-23001-7', keyIdHex, (_b = (0, mediakeys_helper_1.keySystemDomainToKeySystemFormat)(keySystem)) !== null && _b !== void 0 ? _b : '');
                            decryptdata.pssh = new Uint8Array(initData);
                            decryptdata.keyId = keyId;
                            return _this.attemptSetMediaKeys(keySystem, mediaKeys).then(function () {
                                _this.throwIfDestroyed();
                                var keySessionContext = _this.createMediaKeySessionContext({
                                    decryptdata: decryptdata,
                                    keySystem: keySystem,
                                    mediaKeys: mediaKeys,
                                });
                                return _this.generateRequestWithPreferredKeySession(keySessionContext, initDataType, initData, 'encrypted-event-no-match');
                            });
                        });
                    keySessionContextPromise.catch(function (error) { return _this.handleError(error); });
                }
            });
        };
        this.onWaitingForKey = function (event) {
            _this.log("\"".concat(event.type, "\" event"));
        };
        this.hls = hls;
        this.config = hls.config;
        this.registerListeners();
    }
    EMEController.prototype.destroy = function () {
        this.unregisterListeners();
        this.onMediaDetached();
        // Remove any references that could be held in config options or callbacks
        var config = this.config;
        config.requestMediaKeySystemAccessFunc = null;
        config.licenseXhrSetup = config.licenseResponseCallback = undefined;
        config.drmSystems = config.drmSystemOptions = {};
        // @ts-ignore
        this.hls = this.config = this.keyIdToKeySessionPromise = null;
        // @ts-ignore
        this.onMediaEncrypted = this.onWaitingForKey = null;
    };
    EMEController.prototype.registerListeners = function () {
        this.hls.on(events_1.Events.MEDIA_ATTACHED, this.onMediaAttached, this);
        this.hls.on(events_1.Events.MEDIA_DETACHED, this.onMediaDetached, this);
        this.hls.on(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        this.hls.on(events_1.Events.MANIFEST_LOADED, this.onManifestLoaded, this);
    };
    EMEController.prototype.unregisterListeners = function () {
        this.hls.off(events_1.Events.MEDIA_ATTACHED, this.onMediaAttached, this);
        this.hls.off(events_1.Events.MEDIA_DETACHED, this.onMediaDetached, this);
        this.hls.off(events_1.Events.MANIFEST_LOADING, this.onManifestLoading, this);
        this.hls.off(events_1.Events.MANIFEST_LOADED, this.onManifestLoaded, this);
    };
    EMEController.prototype.getLicenseServerUrl = function (keySystem) {
        var _a = this.config, drmSystems = _a.drmSystems, widevineLicenseUrl = _a.widevineLicenseUrl;
        var keySystemConfiguration = drmSystems[keySystem];
        if (keySystemConfiguration) {
            return keySystemConfiguration.licenseUrl;
        }
        // For backward compatibility
        if (keySystem === mediakeys_helper_1.KeySystems.WIDEVINE && widevineLicenseUrl) {
            return widevineLicenseUrl;
        }
    };
    EMEController.prototype.getLicenseServerUrlOrThrow = function (keySystem) {
        var url = this.getLicenseServerUrl(keySystem);
        if (url === undefined) {
            throw new Error("no license server URL configured for key-system \"".concat(keySystem, "\""));
        }
        return url;
    };
    EMEController.prototype.getServerCertificateUrl = function (keySystem) {
        var drmSystems = this.config.drmSystems;
        var keySystemConfiguration = drmSystems[keySystem];
        if (keySystemConfiguration) {
            return keySystemConfiguration.serverCertificateUrl;
        }
        else {
            this.log("No Server Certificate in config.drmSystems[\"".concat(keySystem, "\"]"));
        }
    };
    EMEController.prototype.attemptKeySystemAccess = function (keySystemsToAttempt) {
        var _this = this;
        var levels = this.hls.levels;
        var uniqueCodec = function (value, i, a) {
            return !!value && a.indexOf(value) === i;
        };
        var audioCodecs = levels
            .map(function (level) { return level.audioCodec; })
            .filter(uniqueCodec);
        var videoCodecs = levels
            .map(function (level) { return level.videoCodec; })
            .filter(uniqueCodec);
        if (audioCodecs.length + videoCodecs.length === 0) {
            videoCodecs.push('avc1.42e01e');
        }
        return new Promise(function (resolve, reject) {
            var attempt = function (keySystems) {
                var keySystem = keySystems.shift();
                _this.getMediaKeysPromise(keySystem, audioCodecs, videoCodecs)
                    .then(function (mediaKeys) { return resolve({ keySystem: keySystem, mediaKeys: mediaKeys }); })
                    .catch(function (error) {
                    if (keySystems.length) {
                        attempt(keySystems);
                    }
                    else if (error instanceof EMEKeyError) {
                        reject(error);
                    }
                    else {
                        reject(new EMEKeyError({
                            type: errors_1.ErrorTypes.KEY_SYSTEM_ERROR,
                            details: errors_1.ErrorDetails.KEY_SYSTEM_NO_ACCESS,
                            error: error,
                            fatal: true,
                        }, error.message));
                    }
                });
            };
            attempt(keySystemsToAttempt);
        });
    };
    EMEController.prototype.requestMediaKeySystemAccess = function (keySystem, supportedConfigurations) {
        var requestMediaKeySystemAccessFunc = this.config.requestMediaKeySystemAccessFunc;
        if (!(typeof requestMediaKeySystemAccessFunc === 'function')) {
            var errMessage = "Configured requestMediaKeySystemAccess is not a function ".concat(requestMediaKeySystemAccessFunc);
            if (mediakeys_helper_1.requestMediaKeySystemAccess === null &&
                self.location.protocol === 'http:') {
                errMessage = "navigator.requestMediaKeySystemAccess is not available over insecure protocol ".concat(location.protocol);
            }
            return Promise.reject(new Error(errMessage));
        }
        return requestMediaKeySystemAccessFunc(keySystem, supportedConfigurations);
    };
    EMEController.prototype.getMediaKeysPromise = function (keySystem, audioCodecs, videoCodecs) {
        var _this = this;
        // This can throw, but is caught in event handler callpath
        var mediaKeySystemConfigs = (0, mediakeys_helper_1.getSupportedMediaKeySystemConfigurations)(keySystem, audioCodecs, videoCodecs, this.config.drmSystemOptions);
        var keySystemAccessPromises = this.keySystemAccessPromises[keySystem];
        var keySystemAccess = keySystemAccessPromises === null || keySystemAccessPromises === void 0 ? void 0 : keySystemAccessPromises.keySystemAccess;
        if (!keySystemAccess) {
            this.log("Requesting encrypted media \"".concat(keySystem, "\" key-system access with config: ").concat(JSON.stringify(mediaKeySystemConfigs)));
            keySystemAccess = this.requestMediaKeySystemAccess(keySystem, mediaKeySystemConfigs);
            var keySystemAccessPromises_1 = (this.keySystemAccessPromises[keySystem] = {
                keySystemAccess: keySystemAccess,
            });
            keySystemAccess.catch(function (error) {
                _this.log("Failed to obtain access to key-system \"".concat(keySystem, "\": ").concat(error));
            });
            return keySystemAccess.then(function (mediaKeySystemAccess) {
                _this.log("Access for key-system \"".concat(mediaKeySystemAccess.keySystem, "\" obtained"));
                var certificateRequest = _this.fetchServerCertificate(keySystem);
                _this.log("Create media-keys for \"".concat(keySystem, "\""));
                keySystemAccessPromises_1.mediaKeys = mediaKeySystemAccess
                    .createMediaKeys()
                    .then(function (mediaKeys) {
                    _this.log("Media-keys created for \"".concat(keySystem, "\""));
                    return certificateRequest.then(function (certificate) {
                        if (certificate) {
                            return _this.setMediaKeysServerCertificate(mediaKeys, keySystem, certificate);
                        }
                        return mediaKeys;
                    });
                });
                keySystemAccessPromises_1.mediaKeys.catch(function (error) {
                    _this.error("Failed to create media-keys for \"".concat(keySystem, "\"}: ").concat(error));
                });
                return keySystemAccessPromises_1.mediaKeys;
            });
        }
        return keySystemAccess.then(function () { return keySystemAccessPromises.mediaKeys; });
    };
    EMEController.prototype.createMediaKeySessionContext = function (_a) {
        var decryptdata = _a.decryptdata, keySystem = _a.keySystem, mediaKeys = _a.mediaKeys;
        this.log("Creating key-system session \"".concat(keySystem, "\" keyId: ").concat(hex_1.default.hexDump(decryptdata.keyId || [])));
        var mediaKeysSession = mediaKeys.createSession();
        var mediaKeySessionContext = {
            decryptdata: decryptdata,
            keySystem: keySystem,
            mediaKeys: mediaKeys,
            mediaKeysSession: mediaKeysSession,
            keyStatus: 'status-pending',
        };
        this.mediaKeySessions.push(mediaKeySessionContext);
        return mediaKeySessionContext;
    };
    EMEController.prototype.renewKeySession = function (mediaKeySessionContext) {
        var decryptdata = mediaKeySessionContext.decryptdata;
        if (decryptdata.pssh) {
            var keySessionContext = this.createMediaKeySessionContext(mediaKeySessionContext);
            var keyId = this.getKeyIdString(decryptdata);
            var scheme = 'cenc';
            this.keyIdToKeySessionPromise[keyId] =
                this.generateRequestWithPreferredKeySession(keySessionContext, scheme, decryptdata.pssh, 'expired');
        }
        else {
            this.warn("Could not renew expired session. Missing pssh initData.");
        }
        this.removeSession(mediaKeySessionContext);
    };
    EMEController.prototype.getKeyIdString = function (decryptdata) {
        if (!decryptdata) {
            throw new Error('Could not read keyId of undefined decryptdata');
        }
        if (decryptdata.keyId === null) {
            throw new Error('keyId is null');
        }
        return hex_1.default.hexDump(decryptdata.keyId);
    };
    EMEController.prototype.updateKeySession = function (mediaKeySessionContext, data) {
        var _a;
        var keySession = mediaKeySessionContext.mediaKeysSession;
        this.log("Updating key-session \"".concat(keySession.sessionId, "\" for keyID ").concat(hex_1.default.hexDump(((_a = mediaKeySessionContext.decryptdata) === null || _a === void 0 ? void 0 : _a.keyId) || []), "\n      } (data length: ").concat(data ? data.byteLength : data, ")"));
        return keySession.update(data);
    };
    EMEController.prototype.selectKeySystemFormat = function (frag) {
        var keyFormats = Object.keys(frag.levelkeys || {});
        if (!this.keyFormatPromise) {
            this.log("Selecting key-system from fragment (sn: ".concat(frag.sn, " ").concat(frag.type, ": ").concat(frag.level, ") key formats ").concat(keyFormats.join(', ')));
            this.keyFormatPromise = this.getKeyFormatPromise(keyFormats);
        }
        return this.keyFormatPromise;
    };
    EMEController.prototype.getKeyFormatPromise = function (keyFormats) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var keySystemsInConfig = (0, mediakeys_helper_1.getKeySystemsForConfig)(_this.config);
            var keySystemsToAttempt = keyFormats
                .map(mediakeys_helper_1.keySystemFormatToKeySystemDomain)
                .filter(function (value) { return !!value && keySystemsInConfig.indexOf(value) !== -1; });
            return _this.getKeySystemSelectionPromise(keySystemsToAttempt)
                .then(function (_a) {
                var keySystem = _a.keySystem;
                var keySystemFormat = (0, mediakeys_helper_1.keySystemDomainToKeySystemFormat)(keySystem);
                if (keySystemFormat) {
                    resolve(keySystemFormat);
                }
                else {
                    reject(new Error("Unable to find format for key-system \"".concat(keySystem, "\"")));
                }
            })
                .catch(reject);
        });
    };
    EMEController.prototype.loadKey = function (data) {
        var _this = this;
        var decryptdata = data.keyInfo.decryptdata;
        var keyId = this.getKeyIdString(decryptdata);
        var keyDetails = "(keyId: ".concat(keyId, " format: \"").concat(decryptdata.keyFormat, "\" method: ").concat(decryptdata.method, " uri: ").concat(decryptdata.uri, ")");
        this.log("Starting session for key ".concat(keyDetails));
        var keySessionContextPromise = this.keyIdToKeySessionPromise[keyId];
        if (!keySessionContextPromise) {
            keySessionContextPromise = this.keyIdToKeySessionPromise[keyId] =
                this.getKeySystemForKeyPromise(decryptdata).then(function (_a) {
                    var keySystem = _a.keySystem, mediaKeys = _a.mediaKeys;
                    _this.throwIfDestroyed();
                    _this.log("Handle encrypted media sn: ".concat(data.frag.sn, " ").concat(data.frag.type, ": ").concat(data.frag.level, " using key ").concat(keyDetails));
                    return _this.attemptSetMediaKeys(keySystem, mediaKeys).then(function () {
                        _this.throwIfDestroyed();
                        var keySessionContext = _this.createMediaKeySessionContext({
                            keySystem: keySystem,
                            mediaKeys: mediaKeys,
                            decryptdata: decryptdata,
                        });
                        var scheme = 'cenc';
                        return _this.generateRequestWithPreferredKeySession(keySessionContext, scheme, decryptdata.pssh, 'playlist-key');
                    });
                });
            keySessionContextPromise.catch(function (error) { return _this.handleError(error); });
        }
        return keySessionContextPromise;
    };
    EMEController.prototype.throwIfDestroyed = function (message) {
        if (message === void 0) { message = 'Invalid state'; }
        if (!this.hls) {
            throw new Error('invalid state');
        }
    };
    EMEController.prototype.handleError = function (error) {
        if (!this.hls) {
            return;
        }
        this.error(error.message);
        if (error instanceof EMEKeyError) {
            this.hls.trigger(events_1.Events.ERROR, error.data);
        }
        else {
            this.hls.trigger(events_1.Events.ERROR, {
                type: errors_1.ErrorTypes.KEY_SYSTEM_ERROR,
                details: errors_1.ErrorDetails.KEY_SYSTEM_NO_KEYS,
                error: error,
                fatal: true,
            });
        }
    };
    EMEController.prototype.getKeySystemForKeyPromise = function (decryptdata) {
        var keyId = this.getKeyIdString(decryptdata);
        var mediaKeySessionContext = this.keyIdToKeySessionPromise[keyId];
        if (!mediaKeySessionContext) {
            var keySystem = (0, mediakeys_helper_1.keySystemFormatToKeySystemDomain)(decryptdata.keyFormat);
            var keySystemsToAttempt = keySystem
                ? [keySystem]
                : (0, mediakeys_helper_1.getKeySystemsForConfig)(this.config);
            return this.attemptKeySystemAccess(keySystemsToAttempt);
        }
        return mediaKeySessionContext;
    };
    EMEController.prototype.getKeySystemSelectionPromise = function (keySystemsToAttempt) {
        if (!keySystemsToAttempt.length) {
            keySystemsToAttempt = (0, mediakeys_helper_1.getKeySystemsForConfig)(this.config);
        }
        if (keySystemsToAttempt.length === 0) {
            throw new EMEKeyError({
                type: errors_1.ErrorTypes.KEY_SYSTEM_ERROR,
                details: errors_1.ErrorDetails.KEY_SYSTEM_NO_CONFIGURED_LICENSE,
                fatal: true,
            }, "Missing key-system license configuration options ".concat(JSON.stringify({
                drmSystems: this.config.drmSystems,
            })));
        }
        return this.attemptKeySystemAccess(keySystemsToAttempt);
    };
    EMEController.prototype.attemptSetMediaKeys = function (keySystem, mediaKeys) {
        var _this = this;
        var queue = this.setMediaKeysQueue.slice();
        this.log("Setting media-keys for \"".concat(keySystem, "\""));
        // Only one setMediaKeys() can run at one time, and multiple setMediaKeys() operations
        // can be queued for execution for multiple key sessions.
        var setMediaKeysPromise = Promise.all(queue).then(function () {
            if (!_this.media) {
                throw new Error('Attempted to set mediaKeys without media element attached');
            }
            return _this.media.setMediaKeys(mediaKeys);
        });
        this.setMediaKeysQueue.push(setMediaKeysPromise);
        return setMediaKeysPromise.then(function () {
            _this.log("Media-keys set for \"".concat(keySystem, "\""));
            queue.push(setMediaKeysPromise);
            _this.setMediaKeysQueue = _this.setMediaKeysQueue.filter(function (p) { return queue.indexOf(p) === -1; });
        });
    };
    EMEController.prototype.generateRequestWithPreferredKeySession = function (context, initDataType, initData, reason) {
        var _this = this;
        var _a, _b, _c;
        var generateRequestFilter = (_b = (_a = this.config.drmSystems) === null || _a === void 0 ? void 0 : _a[context.keySystem]) === null || _b === void 0 ? void 0 : _b.generateRequest;
        if (generateRequestFilter) {
            try {
                var mappedInitData = generateRequestFilter.call(this.hls, initDataType, initData, context);
                if (!mappedInitData) {
                    throw new Error('Invalid response from configured generateRequest filter');
                }
                initDataType = mappedInitData.initDataType;
                initData = context.decryptdata.pssh = mappedInitData.initData
                    ? new Uint8Array(mappedInitData.initData)
                    : null;
            }
            catch (error) {
                this.warn(error.message);
                if ((_c = this.hls) === null || _c === void 0 ? void 0 : _c.config.debug) {
                    throw error;
                }
            }
        }
        if (initData === null) {
            this.log("Skipping key-session request for \"".concat(reason, "\" (no initData)"));
            return Promise.resolve(context);
        }
        var keyId = this.getKeyIdString(context.decryptdata);
        this.log("Generating key-session request for \"".concat(reason, "\": ").concat(keyId, " (init data type: ").concat(initDataType, " length: ").concat(initData ? initData.byteLength : null, ")"));
        var licenseStatus = new eventemitter3_1.EventEmitter();
        var onmessage = (context._onmessage = function (event) {
            var keySession = context.mediaKeysSession;
            if (!keySession) {
                licenseStatus.emit('error', new Error('invalid state'));
                return;
            }
            var messageType = event.messageType, message = event.message;
            _this.log("\"".concat(messageType, "\" message event for session \"").concat(keySession.sessionId, "\" message size: ").concat(message.byteLength));
            if (messageType === 'license-request' ||
                messageType === 'license-renewal') {
                _this.renewLicense(context, message).catch(function (error) {
                    _this.handleError(error);
                    licenseStatus.emit('error', error);
                });
            }
            else if (messageType === 'license-release') {
                if (context.keySystem === mediakeys_helper_1.KeySystems.FAIRPLAY) {
                    _this.updateKeySession(context, (0, keysystem_util_1.strToUtf8array)('acknowledged'));
                    _this.removeSession(context);
                }
            }
            else {
                _this.warn("unhandled media key message type \"".concat(messageType, "\""));
            }
        });
        var onkeystatuseschange = (context._onkeystatuseschange = function (event) {
            var keySession = context.mediaKeysSession;
            if (!keySession) {
                licenseStatus.emit('error', new Error('invalid state'));
                return;
            }
            _this.onKeyStatusChange(context);
            var keyStatus = context.keyStatus;
            licenseStatus.emit('keyStatus', keyStatus);
            if (keyStatus === 'expired') {
                _this.warn("".concat(context.keySystem, " expired for key ").concat(keyId));
                _this.renewKeySession(context);
            }
        });
        context.mediaKeysSession.addEventListener('message', onmessage);
        context.mediaKeysSession.addEventListener('keystatuseschange', onkeystatuseschange);
        var keyUsablePromise = new Promise(function (resolve, reject) {
            licenseStatus.on('error', reject);
            licenseStatus.on('keyStatus', function (keyStatus) {
                if (keyStatus.startsWith('usable')) {
                    resolve();
                }
                else if (keyStatus === 'output-restricted') {
                    reject(new EMEKeyError({
                        type: errors_1.ErrorTypes.KEY_SYSTEM_ERROR,
                        details: errors_1.ErrorDetails.KEY_SYSTEM_STATUS_OUTPUT_RESTRICTED,
                        fatal: false,
                    }, 'HDCP level output restricted'));
                }
                else if (keyStatus === 'internal-error') {
                    reject(new EMEKeyError({
                        type: errors_1.ErrorTypes.KEY_SYSTEM_ERROR,
                        details: errors_1.ErrorDetails.KEY_SYSTEM_STATUS_INTERNAL_ERROR,
                        fatal: true,
                    }, "key status changed to \"".concat(keyStatus, "\"")));
                }
                else if (keyStatus === 'expired') {
                    reject(new Error('key expired while generating request'));
                }
                else {
                    _this.warn("unhandled key status change \"".concat(keyStatus, "\""));
                }
            });
        });
        return context.mediaKeysSession
            .generateRequest(initDataType, initData)
            .then(function () {
            var _a;
            _this.log("Request generated for key-session \"".concat((_a = context.mediaKeysSession) === null || _a === void 0 ? void 0 : _a.sessionId, "\" keyId: ").concat(keyId));
        })
            .catch(function (error) {
            throw new EMEKeyError({
                type: errors_1.ErrorTypes.KEY_SYSTEM_ERROR,
                details: errors_1.ErrorDetails.KEY_SYSTEM_NO_SESSION,
                error: error,
                fatal: false,
            }, "Error generating key-session request: ".concat(error));
        })
            .then(function () { return keyUsablePromise; })
            .catch(function (error) {
            licenseStatus.removeAllListeners();
            _this.removeSession(context);
            throw error;
        })
            .then(function () {
            licenseStatus.removeAllListeners();
            return context;
        });
    };
    EMEController.prototype.onKeyStatusChange = function (mediaKeySessionContext) {
        var _this = this;
        mediaKeySessionContext.mediaKeysSession.keyStatuses.forEach(function (status, keyId) {
            _this.log("key status change \"".concat(status, "\" for keyStatuses keyId: ").concat(hex_1.default.hexDump('buffer' in keyId
                ? new Uint8Array(keyId.buffer, keyId.byteOffset, keyId.byteLength)
                : new Uint8Array(keyId)), " session keyId: ").concat(hex_1.default.hexDump(new Uint8Array(mediaKeySessionContext.decryptdata.keyId || [])), " uri: ").concat(mediaKeySessionContext.decryptdata.uri));
            mediaKeySessionContext.keyStatus = status;
        });
    };
    EMEController.prototype.fetchServerCertificate = function (keySystem) {
        var config = this.config;
        var Loader = config.loader;
        var certLoader = new Loader(config);
        var url = this.getServerCertificateUrl(keySystem);
        if (!url) {
            return Promise.resolve();
        }
        this.log("Fetching server certificate for \"".concat(keySystem, "\""));
        return new Promise(function (resolve, reject) {
            var loaderContext = {
                responseType: 'arraybuffer',
                url: url,
            };
            var loadPolicy = config.certLoadPolicy.default;
            var loaderConfig = {
                loadPolicy: loadPolicy,
                timeout: loadPolicy.maxLoadTimeMs,
                maxRetry: 0,
                retryDelay: 0,
                maxRetryDelay: 0,
            };
            var loaderCallbacks = {
                onSuccess: function (response, stats, context, networkDetails) {
                    resolve(response.data);
                },
                onError: function (response, contex, networkDetails, stats) {
                    reject(new EMEKeyError({
                        type: errors_1.ErrorTypes.KEY_SYSTEM_ERROR,
                        details: errors_1.ErrorDetails.KEY_SYSTEM_SERVER_CERTIFICATE_REQUEST_FAILED,
                        fatal: true,
                        networkDetails: networkDetails,
                        response: __assign({ url: loaderContext.url, data: undefined }, response),
                    }, "\"".concat(keySystem, "\" certificate request failed (").concat(url, "). Status: ").concat(response.code, " (").concat(response.text, ")")));
                },
                onTimeout: function (stats, context, networkDetails) {
                    reject(new EMEKeyError({
                        type: errors_1.ErrorTypes.KEY_SYSTEM_ERROR,
                        details: errors_1.ErrorDetails.KEY_SYSTEM_SERVER_CERTIFICATE_REQUEST_FAILED,
                        fatal: true,
                        networkDetails: networkDetails,
                        response: {
                            url: loaderContext.url,
                            data: undefined,
                        },
                    }, "\"".concat(keySystem, "\" certificate request timed out (").concat(url, ")")));
                },
                onAbort: function (stats, context, networkDetails) {
                    reject(new Error('aborted'));
                },
            };
            certLoader.load(loaderContext, loaderConfig, loaderCallbacks);
        });
    };
    EMEController.prototype.setMediaKeysServerCertificate = function (mediaKeys, keySystem, cert) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            mediaKeys
                .setServerCertificate(cert)
                .then(function (success) {
                _this.log("setServerCertificate ".concat(success ? 'success' : 'not supported by CDM', " (").concat(cert === null || cert === void 0 ? void 0 : cert.byteLength, ") on \"").concat(keySystem, "\""));
                resolve(mediaKeys);
            })
                .catch(function (error) {
                reject(new EMEKeyError({
                    type: errors_1.ErrorTypes.KEY_SYSTEM_ERROR,
                    details: errors_1.ErrorDetails.KEY_SYSTEM_SERVER_CERTIFICATE_UPDATE_FAILED,
                    error: error,
                    fatal: true,
                }, error.message));
            });
        });
    };
    EMEController.prototype.renewLicense = function (context, keyMessage) {
        var _this = this;
        return this.requestLicense(context, new Uint8Array(keyMessage)).then(function (data) {
            return _this.updateKeySession(context, new Uint8Array(data)).catch(function (error) {
                throw new EMEKeyError({
                    type: errors_1.ErrorTypes.KEY_SYSTEM_ERROR,
                    details: errors_1.ErrorDetails.KEY_SYSTEM_SESSION_UPDATE_FAILED,
                    error: error,
                    fatal: true,
                }, error.message);
            });
        });
    };
    EMEController.prototype.unpackPlayReadyKeyMessage = function (xhr, licenseChallenge) {
        var _a, _b;
        // On Edge, the raw license message is UTF-16-encoded XML.  We need
        // to unpack the Challenge element (base64-encoded string containing the
        // actual license request) and any HttpHeader elements (sent as request
        // headers).
        // For PlayReady CDMs, we need to dig the Challenge out of the XML.
        var xmlString = String.fromCharCode.apply(null, new Uint16Array(licenseChallenge.buffer));
        if (!xmlString.includes('PlayReadyKeyMessage')) {
            // This does not appear to be a wrapped message as on Edge.  Some
            // clients do not need this unwrapping, so we will assume this is one of
            // them.  Note that "xml" at this point probably looks like random
            // garbage, since we interpreted UTF-8 as UTF-16.
            xhr.setRequestHeader('Content-Type', 'text/xml; charset=utf-8');
            return licenseChallenge;
        }
        var keyMessageXml = new DOMParser().parseFromString(xmlString, 'application/xml');
        // Set request headers.
        var headers = keyMessageXml.querySelectorAll('HttpHeader');
        if (headers.length > 0) {
            var header = void 0;
            for (var i = 0, len = headers.length; i < len; i++) {
                header = headers[i];
                var name_1 = (_a = header.querySelector('name')) === null || _a === void 0 ? void 0 : _a.textContent;
                var value = (_b = header.querySelector('value')) === null || _b === void 0 ? void 0 : _b.textContent;
                if (name_1 && value) {
                    xhr.setRequestHeader(name_1, value);
                }
            }
        }
        var challengeElement = keyMessageXml.querySelector('Challenge');
        var challengeText = challengeElement === null || challengeElement === void 0 ? void 0 : challengeElement.textContent;
        if (!challengeText) {
            throw new Error("Cannot find <Challenge> in key message");
        }
        return (0, keysystem_util_1.strToUtf8array)(atob(challengeText));
    };
    EMEController.prototype.setupLicenseXHR = function (xhr, url, keysListItem, licenseChallenge) {
        var _this = this;
        var licenseXhrSetup = this.config.licenseXhrSetup;
        if (!licenseXhrSetup) {
            xhr.open('POST', url, true);
            return Promise.resolve({ xhr: xhr, licenseChallenge: licenseChallenge });
        }
        return Promise.resolve()
            .then(function () {
            if (!keysListItem.decryptdata) {
                throw new Error('Key removed');
            }
            return licenseXhrSetup.call(_this.hls, xhr, url, keysListItem, licenseChallenge);
        })
            .catch(function (error) {
            if (!keysListItem.decryptdata) {
                // Key session removed. Cancel license request.
                throw error;
            }
            // let's try to open before running setup
            xhr.open('POST', url, true);
            return licenseXhrSetup.call(_this.hls, xhr, url, keysListItem, licenseChallenge);
        })
            .then(function (licenseXhrSetupResult) {
            // if licenseXhrSetup did not yet call open, let's do it now
            if (!xhr.readyState) {
                xhr.open('POST', url, true);
            }
            var finalLicenseChallenge = licenseXhrSetupResult
                ? licenseXhrSetupResult
                : licenseChallenge;
            return { xhr: xhr, licenseChallenge: finalLicenseChallenge };
        });
    };
    EMEController.prototype.requestLicense = function (keySessionContext, licenseChallenge) {
        var _this = this;
        var keyLoadPolicy = this.config.keyLoadPolicy.default;
        return new Promise(function (resolve, reject) {
            var url = _this.getLicenseServerUrlOrThrow(keySessionContext.keySystem);
            _this.log("Sending license request to URL: ".concat(url));
            var xhr = new XMLHttpRequest();
            xhr.responseType = 'arraybuffer';
            xhr.onreadystatechange = function () {
                if (!_this.hls || !keySessionContext.mediaKeysSession) {
                    return reject(new Error('invalid state'));
                }
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        _this._requestLicenseFailureCount = 0;
                        var data = xhr.response;
                        _this.log("License received ".concat(data instanceof ArrayBuffer ? data.byteLength : data));
                        var licenseResponseCallback = _this.config.licenseResponseCallback;
                        if (licenseResponseCallback) {
                            try {
                                data = licenseResponseCallback.call(_this.hls, xhr, url, keySessionContext);
                            }
                            catch (error) {
                                _this.error(error);
                            }
                        }
                        resolve(data);
                    }
                    else {
                        var retryConfig = keyLoadPolicy.errorRetry;
                        var maxNumRetry = retryConfig ? retryConfig.maxNumRetry : 0;
                        _this._requestLicenseFailureCount++;
                        if (_this._requestLicenseFailureCount > maxNumRetry ||
                            (xhr.status >= 400 && xhr.status < 500)) {
                            reject(new EMEKeyError({
                                type: errors_1.ErrorTypes.KEY_SYSTEM_ERROR,
                                details: errors_1.ErrorDetails.KEY_SYSTEM_LICENSE_REQUEST_FAILED,
                                fatal: true,
                                networkDetails: xhr,
                                response: {
                                    url: url,
                                    data: undefined,
                                    code: xhr.status,
                                    text: xhr.statusText,
                                },
                            }, "License Request XHR failed (".concat(url, "). Status: ").concat(xhr.status, " (").concat(xhr.statusText, ")")));
                        }
                        else {
                            var attemptsLeft = maxNumRetry - _this._requestLicenseFailureCount + 1;
                            _this.warn("Retrying license request, ".concat(attemptsLeft, " attempts left"));
                            _this.requestLicense(keySessionContext, licenseChallenge).then(resolve, reject);
                        }
                    }
                }
            };
            if (keySessionContext.licenseXhr &&
                keySessionContext.licenseXhr.readyState !== XMLHttpRequest.DONE) {
                keySessionContext.licenseXhr.abort();
            }
            keySessionContext.licenseXhr = xhr;
            _this.setupLicenseXHR(xhr, url, keySessionContext, licenseChallenge).then(function (_a) {
                var xhr = _a.xhr, licenseChallenge = _a.licenseChallenge;
                if (keySessionContext.keySystem == mediakeys_helper_1.KeySystems.PLAYREADY) {
                    licenseChallenge = _this.unpackPlayReadyKeyMessage(xhr, licenseChallenge);
                }
                xhr.send(licenseChallenge);
            });
        });
    };
    EMEController.prototype.onMediaAttached = function (event, data) {
        if (!this.config.emeEnabled) {
            return;
        }
        var media = data.media;
        // keep reference of media
        this.media = media;
        media.removeEventListener('encrypted', this.onMediaEncrypted);
        media.removeEventListener('waitingforkey', this.onWaitingForKey);
        media.addEventListener('encrypted', this.onMediaEncrypted);
        media.addEventListener('waitingforkey', this.onWaitingForKey);
    };
    EMEController.prototype.onMediaDetached = function () {
        var _this = this;
        var media = this.media;
        var mediaKeysList = this.mediaKeySessions;
        if (media) {
            media.removeEventListener('encrypted', this.onMediaEncrypted);
            media.removeEventListener('waitingforkey', this.onWaitingForKey);
            this.media = null;
        }
        this._requestLicenseFailureCount = 0;
        this.setMediaKeysQueue = [];
        this.mediaKeySessions = [];
        this.keyIdToKeySessionPromise = {};
        level_key_1.LevelKey.clearKeyUriToKeyIdMap();
        // Close all sessions and remove media keys from the video element.
        var keySessionCount = mediaKeysList.length;
        EMEController.CDMCleanupPromise = Promise.all(mediaKeysList
            .map(function (mediaKeySessionContext) {
            return _this.removeSession(mediaKeySessionContext);
        })
            .concat(media === null || media === void 0 ? void 0 : media.setMediaKeys(null).catch(function (error) {
            _this.log("Could not clear media keys: ".concat(error));
        })))
            .then(function () {
            if (keySessionCount) {
                _this.log('finished closing key sessions and clearing media keys');
                mediaKeysList.length = 0;
            }
        })
            .catch(function (error) {
            _this.log("Could not close sessions and clear media keys: ".concat(error));
        });
    };
    EMEController.prototype.onManifestLoading = function () {
        this.keyFormatPromise = null;
    };
    EMEController.prototype.onManifestLoaded = function (event, _a) {
        var sessionKeys = _a.sessionKeys;
        if (!sessionKeys || !this.config.emeEnabled) {
            return;
        }
        if (!this.keyFormatPromise) {
            var keyFormats = sessionKeys.reduce(function (formats, sessionKey) {
                if (formats.indexOf(sessionKey.keyFormat) === -1) {
                    formats.push(sessionKey.keyFormat);
                }
                return formats;
            }, []);
            this.log("Selecting key-system from session-keys ".concat(keyFormats.join(', ')));
            this.keyFormatPromise = this.getKeyFormatPromise(keyFormats);
        }
    };
    EMEController.prototype.removeSession = function (mediaKeySessionContext) {
        var _this = this;
        var mediaKeysSession = mediaKeySessionContext.mediaKeysSession, licenseXhr = mediaKeySessionContext.licenseXhr;
        if (mediaKeysSession) {
            this.log("Remove licenses and keys and close session ".concat(mediaKeysSession.sessionId));
            if (mediaKeySessionContext._onmessage) {
                mediaKeysSession.removeEventListener('message', mediaKeySessionContext._onmessage);
                mediaKeySessionContext._onmessage = undefined;
            }
            if (mediaKeySessionContext._onkeystatuseschange) {
                mediaKeysSession.removeEventListener('keystatuseschange', mediaKeySessionContext._onkeystatuseschange);
                mediaKeySessionContext._onkeystatuseschange = undefined;
            }
            if (licenseXhr && licenseXhr.readyState !== XMLHttpRequest.DONE) {
                licenseXhr.abort();
            }
            mediaKeySessionContext.mediaKeysSession =
                mediaKeySessionContext.decryptdata =
                    mediaKeySessionContext.licenseXhr =
                        undefined;
            var index = this.mediaKeySessions.indexOf(mediaKeySessionContext);
            if (index > -1) {
                this.mediaKeySessions.splice(index, 1);
            }
            return mediaKeysSession
                .remove()
                .catch(function (error) {
                _this.log("Could not remove session: ".concat(error));
            })
                .then(function () {
                return mediaKeysSession.close();
            })
                .catch(function (error) {
                _this.log("Could not close session: ".concat(error));
            });
        }
    };
    return EMEController;
}());
var EMEKeyError = /** @class */ (function (_super) {
    __extends(EMEKeyError, _super);
    function EMEKeyError(data, message) {
        var _this = _super.call(this, message) || this;
        data.error || (data.error = new Error(message));
        _this.data = data;
        data.err = data.error;
        return _this;
    }
    return EMEKeyError;
}(Error));
exports.default = EMEController;
