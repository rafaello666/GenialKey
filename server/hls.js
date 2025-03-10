"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var url_toolkit_1 = require("url-toolkit");
var playlist_loader_1 = require("./loader/playlist-loader");
var id3_track_controller_1 = require("./controller/id3-track-controller");
var latency_controller_1 = require("./controller/latency-controller");
var level_controller_1 = require("./controller/level-controller");
var fragment_tracker_1 = require("./controller/fragment-tracker");
var key_loader_1 = require("./loader/key-loader");
var stream_controller_1 = require("./controller/stream-controller");
var is_supported_1 = require("./is-supported");
var mediasource_helper_1 = require("./utils/mediasource-helper");
var logger_1 = require("./utils/logger");
var config_1 = require("./config");
var eventemitter3_1 = require("eventemitter3");
var events_1 = require("./events");
var errors_1 = require("./errors");
var level_1 = require("./types/level");
/**
 * The `Hls` class is the core of the HLS.js library used to instantiate player instances.
 * @public
 */
var Hls = /** @class */ (function () {
    /**
     * Creates an instance of an HLS client that can attach to exactly one `HTMLMediaElement`.
     * @param userConfig - Configuration options applied over `Hls.DefaultConfig`
     */
    function Hls(userConfig) {
        if (userConfig === void 0) { userConfig = {}; }
        this.started = false;
        this._emitter = new eventemitter3_1.EventEmitter();
        this._autoLevelCapping = -1;
        this._maxHdcpLevel = null;
        this._media = null;
        this.url = null;
        (0, logger_1.enableLogs)(userConfig.debug || false, 'Hls instance');
        var config = (this.config = (0, config_1.mergeConfig)(Hls.DefaultConfig, userConfig));
        this.userConfig = userConfig;
        if (config.progressive) {
            (0, config_1.enableStreamingMode)(config);
        }
        // core controllers and network loaders
        var ConfigAbrController = config.abrController, ConfigBufferController = config.bufferController, ConfigCapLevelController = config.capLevelController, ConfigErrorController = config.errorController, ConfigFpsController = config.fpsController;
        var errorController = new ConfigErrorController(this);
        var abrController = (this.abrController = new ConfigAbrController(this));
        var bufferController = (this.bufferController =
            new ConfigBufferController(this));
        var capLevelController = (this.capLevelController =
            new ConfigCapLevelController(this));
        var fpsController = new ConfigFpsController(this);
        var playListLoader = new playlist_loader_1.default(this);
        var id3TrackController = new id3_track_controller_1.default(this);
        var ConfigContentSteeringController = config.contentSteeringController;
        // ConentSteeringController is defined before LevelController to receive Multivariant Playlist events first
        var contentSteering = ConfigContentSteeringController
            ? new ConfigContentSteeringController(this)
            : null;
        var levelController = (this.levelController = new level_controller_1.default(this, contentSteering));
        // FragmentTracker must be defined before StreamController because the order of event handling is important
        var fragmentTracker = new fragment_tracker_1.FragmentTracker(this);
        var keyLoader = new key_loader_1.default(this.config);
        var streamController = (this.streamController = new stream_controller_1.default(this, fragmentTracker, keyLoader));
        // Cap level controller uses streamController to flush the buffer
        capLevelController.setStreamController(streamController);
        // fpsController uses streamController to switch when frames are being dropped
        fpsController.setStreamController(streamController);
        var networkControllers = [
            playListLoader,
            levelController,
            streamController,
        ];
        if (contentSteering) {
            networkControllers.splice(1, 0, contentSteering);
        }
        this.networkControllers = networkControllers;
        var coreComponents = [
            abrController,
            bufferController,
            capLevelController,
            fpsController,
            id3TrackController,
            fragmentTracker,
        ];
        this.audioTrackController = this.createController(config.audioTrackController, networkControllers);
        var AudioStreamControllerClass = config.audioStreamController;
        if (AudioStreamControllerClass) {
            networkControllers.push(new AudioStreamControllerClass(this, fragmentTracker, keyLoader));
        }
        // subtitleTrackController must be defined before subtitleStreamController because the order of event handling is important
        this.subtitleTrackController = this.createController(config.subtitleTrackController, networkControllers);
        var SubtitleStreamControllerClass = config.subtitleStreamController;
        if (SubtitleStreamControllerClass) {
            networkControllers.push(new SubtitleStreamControllerClass(this, fragmentTracker, keyLoader));
        }
        this.createController(config.timelineController, coreComponents);
        keyLoader.emeController = this.emeController = this.createController(config.emeController, coreComponents);
        this.cmcdController = this.createController(config.cmcdController, coreComponents);
        this.latencyController = this.createController(latency_controller_1.default, coreComponents);
        this.coreComponents = coreComponents;
        // Error controller handles errors before and after all other controllers
        // This listener will be invoked after all other controllers error listeners
        networkControllers.push(errorController);
        var onErrorOut = errorController.onErrorOut;
        if (typeof onErrorOut === 'function') {
            this.on(events_1.Events.ERROR, onErrorOut, errorController);
        }
    }
    Object.defineProperty(Hls, "version", {
        /**
         * Get the video-dev/hls.js package version.
         */
        get: function () {
            return __VERSION__;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Check if the required MediaSource Extensions are available.
     */
    Hls.isMSESupported = function () {
        return (0, is_supported_1.isMSESupported)();
    };
    /**
     * Check if MediaSource Extensions are available and isTypeSupported checks pass for any baseline codecs.
     */
    Hls.isSupported = function () {
        return (0, is_supported_1.isSupported)();
    };
    /**
     * Get the MediaSource global used for MSE playback (ManagedMediaSource, MediaSource, or WebKitMediaSource).
     */
    Hls.getMediaSource = function () {
        return (0, mediasource_helper_1.getMediaSource)();
    };
    Object.defineProperty(Hls, "Events", {
        get: function () {
            return events_1.Events;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls, "ErrorTypes", {
        get: function () {
            return errors_1.ErrorTypes;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls, "ErrorDetails", {
        get: function () {
            return errors_1.ErrorDetails;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls, "DefaultConfig", {
        /**
         * Get the default configuration applied to new instances.
         */
        get: function () {
            if (!Hls.defaultConfig) {
                return config_1.hlsDefaultConfig;
            }
            return Hls.defaultConfig;
        },
        /**
         * Replace the default configuration applied to new instances.
         */
        set: function (defaultConfig) {
            Hls.defaultConfig = defaultConfig;
        },
        enumerable: false,
        configurable: true
    });
    Hls.prototype.createController = function (ControllerClass, components) {
        if (ControllerClass) {
            var controllerInstance = new ControllerClass(this);
            if (components) {
                components.push(controllerInstance);
            }
            return controllerInstance;
        }
        return null;
    };
    // Delegate the EventEmitter through the public API of Hls.js
    Hls.prototype.on = function (event, listener, context) {
        if (context === void 0) { context = this; }
        this._emitter.on(event, listener, context);
    };
    Hls.prototype.once = function (event, listener, context) {
        if (context === void 0) { context = this; }
        this._emitter.once(event, listener, context);
    };
    Hls.prototype.removeAllListeners = function (event) {
        this._emitter.removeAllListeners(event);
    };
    Hls.prototype.off = function (event, listener, context, once) {
        if (context === void 0) { context = this; }
        this._emitter.off(event, listener, context, once);
    };
    Hls.prototype.listeners = function (event) {
        return this._emitter.listeners(event);
    };
    Hls.prototype.emit = function (event, name, eventObject) {
        return this._emitter.emit(event, name, eventObject);
    };
    Hls.prototype.trigger = function (event, eventObject) {
        if (this.config.debug) {
            return this.emit(event, event, eventObject);
        }
        else {
            try {
                return this.emit(event, event, eventObject);
            }
            catch (error) {
                logger_1.logger.error('An internal error happened while handling event ' +
                    event +
                    '. Error message: "' +
                    error.message +
                    '". Here is a stacktrace:', error);
                // Prevent recursion in error event handlers that throw #5497
                if (!this.triggeringException) {
                    this.triggeringException = true;
                    var fatal = event === events_1.Events.ERROR;
                    this.trigger(events_1.Events.ERROR, {
                        type: errors_1.ErrorTypes.OTHER_ERROR,
                        details: errors_1.ErrorDetails.INTERNAL_EXCEPTION,
                        fatal: fatal,
                        event: event,
                        error: error,
                    });
                    this.triggeringException = false;
                }
            }
        }
        return false;
    };
    Hls.prototype.listenerCount = function (event) {
        return this._emitter.listenerCount(event);
    };
    /**
     * Dispose of the instance
     */
    Hls.prototype.destroy = function () {
        logger_1.logger.log('destroy');
        this.trigger(events_1.Events.DESTROYING, undefined);
        this.detachMedia();
        this.removeAllListeners();
        this._autoLevelCapping = -1;
        this.url = null;
        this.networkControllers.forEach(function (component) { return component.destroy(); });
        this.networkControllers.length = 0;
        this.coreComponents.forEach(function (component) { return component.destroy(); });
        this.coreComponents.length = 0;
        // Remove any references that could be held in config options or callbacks
        var config = this.config;
        config.xhrSetup = config.fetchSetup = undefined;
        // @ts-ignore
        this.userConfig = null;
    };
    /**
     * Attaches Hls.js to a media element
     */
    Hls.prototype.attachMedia = function (media) {
        logger_1.logger.log('attachMedia');
        this._media = media;
        this.trigger(events_1.Events.MEDIA_ATTACHING, { media: media });
    };
    /**
     * Detach Hls.js from the media
     */
    Hls.prototype.detachMedia = function () {
        logger_1.logger.log('detachMedia');
        this.trigger(events_1.Events.MEDIA_DETACHING, undefined);
        this._media = null;
    };
    /**
     * Set the source URL. Can be relative or absolute.
     */
    Hls.prototype.loadSource = function (url) {
        this.stopLoad();
        var media = this.media;
        var loadedSource = this.url;
        var loadingSource = (this.url = (0, url_toolkit_1.buildAbsoluteURL)(self.location.href, url, {
            alwaysNormalize: true,
        }));
        this._autoLevelCapping = -1;
        this._maxHdcpLevel = null;
        logger_1.logger.log("loadSource:".concat(loadingSource));
        if (media &&
            loadedSource &&
            (loadedSource !== loadingSource || this.bufferController.hasSourceTypes())) {
            this.detachMedia();
            this.attachMedia(media);
        }
        // when attaching to a source URL, trigger a playlist load
        this.trigger(events_1.Events.MANIFEST_LOADING, { url: url });
    };
    /**
     * Start loading data from the stream source.
     * Depending on default config, client starts loading automatically when a source is set.
     *
     * @param startPosition - Set the start position to stream from.
     * Defaults to -1 (None: starts from earliest point)
     */
    Hls.prototype.startLoad = function (startPosition) {
        if (startPosition === void 0) { startPosition = -1; }
        logger_1.logger.log("startLoad(".concat(startPosition, ")"));
        this.started = true;
        this.resumeBuffering();
        for (var i = 0; i < this.networkControllers.length; i++) {
            this.networkControllers[i].startLoad(startPosition);
            if (!this.started || !this.networkControllers) {
                break;
            }
        }
    };
    /**
     * Stop loading of any stream data.
     */
    Hls.prototype.stopLoad = function () {
        logger_1.logger.log('stopLoad');
        this.started = false;
        for (var i = 0; i < this.networkControllers.length; i++) {
            this.networkControllers[i].stopLoad();
            if (this.started || !this.networkControllers) {
                break;
            }
        }
    };
    /**
     * Resumes stream controller segment loading after `pauseBuffering` has been called.
     */
    Hls.prototype.resumeBuffering = function () {
        logger_1.logger.log("resume buffering");
        this.networkControllers.forEach(function (controller) {
            if (controller.resumeBuffering) {
                controller.resumeBuffering();
            }
        });
    };
    /**
     * Prevents stream controller from loading new segments until `resumeBuffering` is called.
     * This allows for media buffering to be paused without interupting playlist loading.
     */
    Hls.prototype.pauseBuffering = function () {
        logger_1.logger.log("pause buffering");
        this.networkControllers.forEach(function (controller) {
            if (controller.pauseBuffering) {
                controller.pauseBuffering();
            }
        });
    };
    /**
     * Swap through possible audio codecs in the stream (for example to switch from stereo to 5.1)
     */
    Hls.prototype.swapAudioCodec = function () {
        logger_1.logger.log('swapAudioCodec');
        this.streamController.swapAudioCodec();
    };
    /**
     * When the media-element fails, this allows to detach and then re-attach it
     * as one call (convenience method).
     *
     * Automatic recovery of media-errors by this process is configurable.
     */
    Hls.prototype.recoverMediaError = function () {
        logger_1.logger.log('recoverMediaError');
        var media = this._media;
        this.detachMedia();
        if (media) {
            this.attachMedia(media);
        }
    };
    Hls.prototype.removeLevel = function (levelIndex) {
        this.levelController.removeLevel(levelIndex);
    };
    Object.defineProperty(Hls.prototype, "levels", {
        /**
         * @returns an array of levels (variants) sorted by HDCP-LEVEL, RESOLUTION (height), FRAME-RATE, CODECS, VIDEO-RANGE, and BANDWIDTH
         */
        get: function () {
            var levels = this.levelController.levels;
            return levels ? levels : [];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "currentLevel", {
        /**
         * Index of quality level (variant) currently played
         */
        get: function () {
            return this.streamController.currentLevel;
        },
        /**
         * Set quality level index immediately. This will flush the current buffer to replace the quality asap. That means playback will interrupt at least shortly to re-buffer and re-sync eventually. Set to -1 for automatic level selection.
         */
        set: function (newLevel) {
            logger_1.logger.log("set currentLevel:".concat(newLevel));
            this.levelController.manualLevel = newLevel;
            this.streamController.immediateLevelSwitch();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "nextLevel", {
        /**
         * Index of next quality level loaded as scheduled by stream controller.
         */
        get: function () {
            return this.streamController.nextLevel;
        },
        /**
         * Set quality level index for next loaded data.
         * This will switch the video quality asap, without interrupting playback.
         * May abort current loading of data, and flush parts of buffer (outside currently played fragment region).
         * @param newLevel - Pass -1 for automatic level selection
         */
        set: function (newLevel) {
            logger_1.logger.log("set nextLevel:".concat(newLevel));
            this.levelController.manualLevel = newLevel;
            this.streamController.nextLevelSwitch();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "loadLevel", {
        /**
         * Return the quality level of the currently or last (of none is loaded currently) segment
         */
        get: function () {
            return this.levelController.level;
        },
        /**
         * Set quality level index for next loaded data in a conservative way.
         * This will switch the quality without flushing, but interrupt current loading.
         * Thus the moment when the quality switch will appear in effect will only be after the already existing buffer.
         * @param newLevel - Pass -1 for automatic level selection
         */
        set: function (newLevel) {
            logger_1.logger.log("set loadLevel:".concat(newLevel));
            this.levelController.manualLevel = newLevel;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "nextLoadLevel", {
        /**
         * get next quality level loaded
         */
        get: function () {
            return this.levelController.nextLoadLevel;
        },
        /**
         * Set quality level of next loaded segment in a fully "non-destructive" way.
         * Same as `loadLevel` but will wait for next switch (until current loading is done).
         */
        set: function (level) {
            this.levelController.nextLoadLevel = level;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "firstLevel", {
        /**
         * Return "first level": like a default level, if not set,
         * falls back to index of first level referenced in manifest
         */
        get: function () {
            return Math.max(this.levelController.firstLevel, this.minAutoLevel);
        },
        /**
         * Sets "first-level", see getter.
         */
        set: function (newLevel) {
            logger_1.logger.log("set firstLevel:".concat(newLevel));
            this.levelController.firstLevel = newLevel;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "startLevel", {
        /**
         * Return the desired start level for the first fragment that will be loaded.
         * The default value of -1 indicates automatic start level selection.
         * Setting hls.nextAutoLevel without setting a startLevel will result in
         * the nextAutoLevel value being used for one fragment load.
         */
        get: function () {
            var startLevel = this.levelController.startLevel;
            if (startLevel === -1 && this.abrController.forcedAutoLevel > -1) {
                return this.abrController.forcedAutoLevel;
            }
            return startLevel;
        },
        /**
         * set  start level (level of first fragment that will be played back)
         * if not overrided by user, first level appearing in manifest will be used as start level
         * if -1 : automatic start level selection, playback will start from level matching download bandwidth
         * (determined from download of first segment)
         */
        set: function (newLevel) {
            logger_1.logger.log("set startLevel:".concat(newLevel));
            // if not in automatic start level detection, ensure startLevel is greater than minAutoLevel
            if (newLevel !== -1) {
                newLevel = Math.max(newLevel, this.minAutoLevel);
            }
            this.levelController.startLevel = newLevel;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "capLevelToPlayerSize", {
        /**
         * Whether level capping is enabled.
         * Default value is set via `config.capLevelToPlayerSize`.
         */
        get: function () {
            return this.config.capLevelToPlayerSize;
        },
        /**
         * Enables or disables level capping. If disabled after previously enabled, `nextLevelSwitch` will be immediately called.
         */
        set: function (shouldStartCapping) {
            var newCapLevelToPlayerSize = !!shouldStartCapping;
            if (newCapLevelToPlayerSize !== this.config.capLevelToPlayerSize) {
                if (newCapLevelToPlayerSize) {
                    this.capLevelController.startCapping(); // If capping occurs, nextLevelSwitch will happen based on size.
                }
                else {
                    this.capLevelController.stopCapping();
                    this.autoLevelCapping = -1;
                    this.streamController.nextLevelSwitch(); // Now we're uncapped, get the next level asap.
                }
                this.config.capLevelToPlayerSize = newCapLevelToPlayerSize;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "autoLevelCapping", {
        /**
         * Capping/max level value that should be used by automatic level selection algorithm (`ABRController`)
         */
        get: function () {
            return this._autoLevelCapping;
        },
        /**
         * Capping/max level value that should be used by automatic level selection algorithm (`ABRController`)
         */
        set: function (newLevel) {
            if (this._autoLevelCapping !== newLevel) {
                logger_1.logger.log("set autoLevelCapping:".concat(newLevel));
                this._autoLevelCapping = newLevel;
                this.levelController.checkMaxAutoUpdated();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "bandwidthEstimate", {
        /**
         * Returns the current bandwidth estimate in bits per second, when available. Otherwise, `NaN` is returned.
         */
        get: function () {
            var bwEstimator = this.abrController.bwEstimator;
            if (!bwEstimator) {
                return NaN;
            }
            return bwEstimator.getEstimate();
        },
        set: function (abrEwmaDefaultEstimate) {
            this.abrController.resetEstimator(abrEwmaDefaultEstimate);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "ttfbEstimate", {
        /**
         * get time to first byte estimate
         * @type {number}
         */
        get: function () {
            var bwEstimator = this.abrController.bwEstimator;
            if (!bwEstimator) {
                return NaN;
            }
            return bwEstimator.getEstimateTTFB();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "maxHdcpLevel", {
        get: function () {
            return this._maxHdcpLevel;
        },
        set: function (value) {
            if ((0, level_1.isHdcpLevel)(value) && this._maxHdcpLevel !== value) {
                this._maxHdcpLevel = value;
                this.levelController.checkMaxAutoUpdated();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "autoLevelEnabled", {
        /**
         * True when automatic level selection enabled
         */
        get: function () {
            return this.levelController.manualLevel === -1;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "manualLevel", {
        /**
         * Level set manually (if any)
         */
        get: function () {
            return this.levelController.manualLevel;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "minAutoLevel", {
        /**
         * min level selectable in auto mode according to config.minAutoBitrate
         */
        get: function () {
            var _a = this, levels = _a.levels, minAutoBitrate = _a.config.minAutoBitrate;
            if (!levels)
                return 0;
            var len = levels.length;
            for (var i = 0; i < len; i++) {
                if (levels[i].maxBitrate >= minAutoBitrate) {
                    return i;
                }
            }
            return 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "maxAutoLevel", {
        /**
         * max level selectable in auto mode according to autoLevelCapping
         */
        get: function () {
            var _a = this, levels = _a.levels, autoLevelCapping = _a.autoLevelCapping, maxHdcpLevel = _a.maxHdcpLevel;
            var maxAutoLevel;
            if (autoLevelCapping === -1 && (levels === null || levels === void 0 ? void 0 : levels.length)) {
                maxAutoLevel = levels.length - 1;
            }
            else {
                maxAutoLevel = autoLevelCapping;
            }
            if (maxHdcpLevel) {
                for (var i = maxAutoLevel; i--;) {
                    var hdcpLevel = levels[i].attrs['HDCP-LEVEL'];
                    if (hdcpLevel && hdcpLevel <= maxHdcpLevel) {
                        return i;
                    }
                }
            }
            return maxAutoLevel;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "firstAutoLevel", {
        get: function () {
            return this.abrController.firstAutoLevel;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "nextAutoLevel", {
        /**
         * next automatically selected quality level
         */
        get: function () {
            return this.abrController.nextAutoLevel;
        },
        /**
         * this setter is used to force next auto level.
         * this is useful to force a switch down in auto mode:
         * in case of load error on level N, hls.js can set nextAutoLevel to N-1 for example)
         * forced value is valid for one fragment. upon successful frag loading at forced level,
         * this value will be resetted to -1 by ABR controller.
         */
        set: function (nextLevel) {
            this.abrController.nextAutoLevel = nextLevel;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "playingDate", {
        /**
         * get the datetime value relative to media.currentTime for the active level Program Date Time if present
         */
        get: function () {
            return this.streamController.currentProgramDateTime;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "mainForwardBufferInfo", {
        get: function () {
            return this.streamController.getMainFwdBufferInfo();
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Find and select the best matching audio track, making a level switch when a Group change is necessary.
     * Updates `hls.config.audioPreference`. Returns the selected track, or null when no matching track is found.
     */
    Hls.prototype.setAudioOption = function (audioOption) {
        var _a;
        return (_a = this.audioTrackController) === null || _a === void 0 ? void 0 : _a.setAudioOption(audioOption);
    };
    /**
     * Find and select the best matching subtitle track, making a level switch when a Group change is necessary.
     * Updates `hls.config.subtitlePreference`. Returns the selected track, or null when no matching track is found.
     */
    Hls.prototype.setSubtitleOption = function (subtitleOption) {
        var _a;
        (_a = this.subtitleTrackController) === null || _a === void 0 ? void 0 : _a.setSubtitleOption(subtitleOption);
        return null;
    };
    Object.defineProperty(Hls.prototype, "allAudioTracks", {
        /**
         * Get the complete list of audio tracks across all media groups
         */
        get: function () {
            var audioTrackController = this.audioTrackController;
            return audioTrackController ? audioTrackController.allAudioTracks : [];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "audioTracks", {
        /**
         * Get the list of selectable audio tracks
         */
        get: function () {
            var audioTrackController = this.audioTrackController;
            return audioTrackController ? audioTrackController.audioTracks : [];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "audioTrack", {
        /**
         * index of the selected audio track (index in audio track lists)
         */
        get: function () {
            var audioTrackController = this.audioTrackController;
            return audioTrackController ? audioTrackController.audioTrack : -1;
        },
        /**
         * selects an audio track, based on its index in audio track lists
         */
        set: function (audioTrackId) {
            var audioTrackController = this.audioTrackController;
            if (audioTrackController) {
                audioTrackController.audioTrack = audioTrackId;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "allSubtitleTracks", {
        /**
         * get the complete list of subtitle tracks across all media groups
         */
        get: function () {
            var subtitleTrackController = this.subtitleTrackController;
            return subtitleTrackController
                ? subtitleTrackController.allSubtitleTracks
                : [];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "subtitleTracks", {
        /**
         * get alternate subtitle tracks list from playlist
         */
        get: function () {
            var subtitleTrackController = this.subtitleTrackController;
            return subtitleTrackController
                ? subtitleTrackController.subtitleTracks
                : [];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "subtitleTrack", {
        /**
         * index of the selected subtitle track (index in subtitle track lists)
         */
        get: function () {
            var subtitleTrackController = this.subtitleTrackController;
            return subtitleTrackController ? subtitleTrackController.subtitleTrack : -1;
        },
        /**
         * select an subtitle track, based on its index in subtitle track lists
         */
        set: function (subtitleTrackId) {
            var subtitleTrackController = this.subtitleTrackController;
            if (subtitleTrackController) {
                subtitleTrackController.subtitleTrack = subtitleTrackId;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "media", {
        get: function () {
            return this._media;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "subtitleDisplay", {
        /**
         * Whether subtitle display is enabled or not
         */
        get: function () {
            var subtitleTrackController = this.subtitleTrackController;
            return subtitleTrackController
                ? subtitleTrackController.subtitleDisplay
                : false;
        },
        /**
         * Enable/disable subtitle display rendering
         */
        set: function (value) {
            var subtitleTrackController = this.subtitleTrackController;
            if (subtitleTrackController) {
                subtitleTrackController.subtitleDisplay = value;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "lowLatencyMode", {
        /**
         * get mode for Low-Latency HLS loading
         */
        get: function () {
            return this.config.lowLatencyMode;
        },
        /**
         * Enable/disable Low-Latency HLS part playlist and segment loading, and start live streams at playlist PART-HOLD-BACK rather than HOLD-BACK.
         */
        set: function (mode) {
            this.config.lowLatencyMode = mode;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "liveSyncPosition", {
        /**
         * Position (in seconds) of live sync point (ie edge of live position minus safety delay defined by ```hls.config.liveSyncDuration```)
         * @returns null prior to loading live Playlist
         */
        get: function () {
            return this.latencyController.liveSyncPosition;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "latency", {
        /**
         * Estimated position (in seconds) of live edge (ie edge of live playlist plus time sync playlist advanced)
         * @returns 0 before first playlist is loaded
         */
        get: function () {
            return this.latencyController.latency;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "maxLatency", {
        /**
         * maximum distance from the edge before the player seeks forward to ```hls.liveSyncPosition```
         * configured using ```liveMaxLatencyDurationCount``` (multiple of target duration) or ```liveMaxLatencyDuration```
         * @returns 0 before first playlist is loaded
         */
        get: function () {
            return this.latencyController.maxLatency;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "targetLatency", {
        /**
         * target distance from the edge as calculated by the latency controller
         */
        get: function () {
            return this.latencyController.targetLatency;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "drift", {
        /**
         * the rate at which the edge of the current live playlist is advancing or 1 if there is none
         */
        get: function () {
            return this.latencyController.drift;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hls.prototype, "forceStartLoad", {
        /**
         * set to true when startLoad is called before MANIFEST_PARSED event
         */
        get: function () {
            return this.streamController.forceStartLoad;
        },
        enumerable: false,
        configurable: true
    });
    return Hls;
}());
exports.default = Hls;
