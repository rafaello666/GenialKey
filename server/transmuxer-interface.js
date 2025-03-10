"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var inject_worker_1 = require("./inject-worker");
var events_1 = require("../events");
var transmuxer_1 = require("../demux/transmuxer");
var logger_1 = require("../utils/logger");
var errors_1 = require("../errors");
var mediasource_helper_1 = require("../utils/mediasource-helper");
var eventemitter3_1 = require("eventemitter3");
var TransmuxerInterface = /** @class */ (function () {
    function TransmuxerInterface(hls, id, onTransmuxComplete, onFlush) {
        var _this = this;
        this.error = null;
        this.frag = null;
        this.part = null;
        this.workerContext = null;
        this.transmuxer = null;
        var config = hls.config;
        this.hls = hls;
        this.id = id;
        this.useWorker = !!config.enableWorker;
        this.onTransmuxComplete = onTransmuxComplete;
        this.onFlush = onFlush;
        var forwardMessage = function (ev, data) {
            data = data || {};
            data.frag = _this.frag;
            data.id = _this.id;
            if (ev === events_1.Events.ERROR) {
                _this.error = data.error;
            }
            _this.hls.trigger(ev, data);
        };
        // forward events to main thread
        this.observer = new eventemitter3_1.EventEmitter();
        this.observer.on(events_1.Events.FRAG_DECRYPTED, forwardMessage);
        this.observer.on(events_1.Events.ERROR, forwardMessage);
        var MediaSource = (0, mediasource_helper_1.getMediaSource)(config.preferManagedMediaSource) || {
            isTypeSupported: function () { return false; },
        };
        var m2tsTypeSupported = {
            mpeg: MediaSource.isTypeSupported('audio/mpeg'),
            mp3: MediaSource.isTypeSupported('audio/mp4; codecs="mp3"'),
            ac3: __USE_M2TS_ADVANCED_CODECS__
                ? MediaSource.isTypeSupported('audio/mp4; codecs="ac-3"')
                : false,
        };
        if (this.useWorker && typeof Worker !== 'undefined') {
            var canCreateWorker = config.workerPath || (0, inject_worker_1.hasUMDWorker)();
            if (canCreateWorker) {
                try {
                    if (config.workerPath) {
                        logger_1.logger.log("loading Web Worker ".concat(config.workerPath, " for \"").concat(id, "\""));
                        this.workerContext = (0, inject_worker_1.loadWorker)(config.workerPath);
                    }
                    else {
                        logger_1.logger.log("injecting Web Worker for \"".concat(id, "\""));
                        this.workerContext = (0, inject_worker_1.injectWorker)();
                    }
                    this.onwmsg = function (event) { return _this.onWorkerMessage(event); };
                    var worker = this.workerContext.worker;
                    worker.addEventListener('message', this.onwmsg);
                    worker.onerror = function (event) {
                        var error = new Error("".concat(event.message, "  (").concat(event.filename, ":").concat(event.lineno, ")"));
                        config.enableWorker = false;
                        logger_1.logger.warn("Error in \"".concat(id, "\" Web Worker, fallback to inline"));
                        _this.hls.trigger(events_1.Events.ERROR, {
                            type: errors_1.ErrorTypes.OTHER_ERROR,
                            details: errors_1.ErrorDetails.INTERNAL_EXCEPTION,
                            fatal: false,
                            event: 'demuxerWorker',
                            error: error,
                        });
                    };
                    worker.postMessage({
                        cmd: 'init',
                        typeSupported: m2tsTypeSupported,
                        vendor: '',
                        id: id,
                        config: JSON.stringify(config),
                    });
                }
                catch (err) {
                    logger_1.logger.warn("Error setting up \"".concat(id, "\" Web Worker, fallback to inline"), err);
                    this.resetWorker();
                    this.error = null;
                    this.transmuxer = new transmuxer_1.default(this.observer, m2tsTypeSupported, config, '', id);
                }
                return;
            }
        }
        this.transmuxer = new transmuxer_1.default(this.observer, m2tsTypeSupported, config, '', id);
    }
    TransmuxerInterface.prototype.resetWorker = function () {
        if (this.workerContext) {
            var _a = this.workerContext, worker = _a.worker, objectURL = _a.objectURL;
            if (objectURL) {
                // revoke the Object URL that was used to create transmuxer worker, so as not to leak it
                self.URL.revokeObjectURL(objectURL);
            }
            worker.removeEventListener('message', this.onwmsg);
            worker.onerror = null;
            worker.terminate();
            this.workerContext = null;
        }
    };
    TransmuxerInterface.prototype.destroy = function () {
        if (this.workerContext) {
            this.resetWorker();
            this.onwmsg = undefined;
        }
        else {
            var transmuxer = this.transmuxer;
            if (transmuxer) {
                transmuxer.destroy();
                this.transmuxer = null;
            }
        }
        var observer = this.observer;
        if (observer) {
            observer.removeAllListeners();
        }
        this.frag = null;
        // @ts-ignore
        this.observer = null;
        // @ts-ignore
        this.hls = null;
    };
    TransmuxerInterface.prototype.push = function (data, initSegmentData, audioCodec, videoCodec, frag, part, duration, accurateTimeOffset, chunkMeta, defaultInitPTS) {
        var _this = this;
        var _a, _b;
        chunkMeta.transmuxing.start = self.performance.now();
        var transmuxer = this.transmuxer;
        var timeOffset = part ? part.start : frag.start;
        // TODO: push "clear-lead" decrypt data for unencrypted fragments in streams with encrypted ones
        var decryptdata = frag.decryptdata;
        var lastFrag = this.frag;
        var discontinuity = !(lastFrag && frag.cc === lastFrag.cc);
        var trackSwitch = !(lastFrag && chunkMeta.level === lastFrag.level);
        var snDiff = lastFrag ? chunkMeta.sn - lastFrag.sn : -1;
        var partDiff = this.part ? chunkMeta.part - this.part.index : -1;
        var progressive = snDiff === 0 &&
            chunkMeta.id > 1 &&
            chunkMeta.id === (lastFrag === null || lastFrag === void 0 ? void 0 : lastFrag.stats.chunkCount);
        var contiguous = !trackSwitch &&
            (snDiff === 1 ||
                (snDiff === 0 && (partDiff === 1 || (progressive && partDiff <= 0))));
        var now = self.performance.now();
        if (trackSwitch || snDiff || frag.stats.parsing.start === 0) {
            frag.stats.parsing.start = now;
        }
        if (part && (partDiff || !contiguous)) {
            part.stats.parsing.start = now;
        }
        var initSegmentChange = !(lastFrag && ((_a = frag.initSegment) === null || _a === void 0 ? void 0 : _a.url) === ((_b = lastFrag.initSegment) === null || _b === void 0 ? void 0 : _b.url));
        var state = new transmuxer_1.TransmuxState(discontinuity, contiguous, accurateTimeOffset, trackSwitch, timeOffset, initSegmentChange);
        if (!contiguous || discontinuity || initSegmentChange) {
            logger_1.logger.log("[transmuxer-interface, ".concat(frag.type, "]: Starting new transmux session for sn: ").concat(chunkMeta.sn, " p: ").concat(chunkMeta.part, " level: ").concat(chunkMeta.level, " id: ").concat(chunkMeta.id, "\n        discontinuity: ").concat(discontinuity, "\n        trackSwitch: ").concat(trackSwitch, "\n        contiguous: ").concat(contiguous, "\n        accurateTimeOffset: ").concat(accurateTimeOffset, "\n        timeOffset: ").concat(timeOffset, "\n        initSegmentChange: ").concat(initSegmentChange));
            var config = new transmuxer_1.TransmuxConfig(audioCodec, videoCodec, initSegmentData, duration, defaultInitPTS);
            this.configureTransmuxer(config);
        }
        this.frag = frag;
        this.part = part;
        // Frags with sn of 'initSegment' are not transmuxed
        if (this.workerContext) {
            // post fragment payload as transferable objects for ArrayBuffer (no copy)
            this.workerContext.worker.postMessage({
                cmd: 'demux',
                data: data,
                decryptdata: decryptdata,
                chunkMeta: chunkMeta,
                state: state,
            }, data instanceof ArrayBuffer ? [data] : []);
        }
        else if (transmuxer) {
            var transmuxResult = transmuxer.push(data, decryptdata, chunkMeta, state);
            if ((0, transmuxer_1.isPromise)(transmuxResult)) {
                transmuxer.async = true;
                transmuxResult
                    .then(function (data) {
                    _this.handleTransmuxComplete(data);
                })
                    .catch(function (error) {
                    _this.transmuxerError(error, chunkMeta, 'transmuxer-interface push error');
                });
            }
            else {
                transmuxer.async = false;
                this.handleTransmuxComplete(transmuxResult);
            }
        }
    };
    TransmuxerInterface.prototype.flush = function (chunkMeta) {
        var _this = this;
        chunkMeta.transmuxing.start = self.performance.now();
        var transmuxer = this.transmuxer;
        if (this.workerContext) {
            1;
            this.workerContext.worker.postMessage({
                cmd: 'flush',
                chunkMeta: chunkMeta,
            });
        }
        else if (transmuxer) {
            var transmuxResult = transmuxer.flush(chunkMeta);
            var asyncFlush = (0, transmuxer_1.isPromise)(transmuxResult);
            if (asyncFlush || transmuxer.async) {
                if (!(0, transmuxer_1.isPromise)(transmuxResult)) {
                    transmuxResult = Promise.resolve(transmuxResult);
                }
                transmuxResult
                    .then(function (data) {
                    _this.handleFlushResult(data, chunkMeta);
                })
                    .catch(function (error) {
                    _this.transmuxerError(error, chunkMeta, 'transmuxer-interface flush error');
                });
            }
            else {
                this.handleFlushResult(transmuxResult, chunkMeta);
            }
        }
    };
    TransmuxerInterface.prototype.transmuxerError = function (error, chunkMeta, reason) {
        if (!this.hls) {
            return;
        }
        this.error = error;
        this.hls.trigger(events_1.Events.ERROR, {
            type: errors_1.ErrorTypes.MEDIA_ERROR,
            details: errors_1.ErrorDetails.FRAG_PARSING_ERROR,
            chunkMeta: chunkMeta,
            frag: this.frag || undefined,
            fatal: false,
            error: error,
            err: error,
            reason: reason,
        });
    };
    TransmuxerInterface.prototype.handleFlushResult = function (results, chunkMeta) {
        var _this = this;
        results.forEach(function (result) {
            _this.handleTransmuxComplete(result);
        });
        this.onFlush(chunkMeta);
    };
    TransmuxerInterface.prototype.onWorkerMessage = function (event) {
        var _a;
        var data = event.data;
        if (!(data === null || data === void 0 ? void 0 : data.event)) {
            logger_1.logger.warn("worker message received with no ".concat(data ? 'event name' : 'data'));
            return;
        }
        var hls = this.hls;
        if (!this.hls) {
            return;
        }
        switch (data.event) {
            case 'init': {
                var objectURL = (_a = this.workerContext) === null || _a === void 0 ? void 0 : _a.objectURL;
                if (objectURL) {
                    // revoke the Object URL that was used to create transmuxer worker, so as not to leak it
                    self.URL.revokeObjectURL(objectURL);
                }
                break;
            }
            case 'transmuxComplete': {
                this.handleTransmuxComplete(data.data);
                break;
            }
            case 'flush': {
                this.onFlush(data.data);
                break;
            }
            // pass logs from the worker thread to the main logger
            case 'workerLog':
                if (logger_1.logger[data.data.logType]) {
                    logger_1.logger[data.data.logType](data.data.message);
                }
                break;
            default: {
                data.data = data.data || {};
                data.data.frag = this.frag;
                data.data.id = this.id;
                hls.trigger(data.event, data.data);
                break;
            }
        }
    };
    TransmuxerInterface.prototype.configureTransmuxer = function (config) {
        var transmuxer = this.transmuxer;
        if (this.workerContext) {
            this.workerContext.worker.postMessage({
                cmd: 'configure',
                config: config,
            });
        }
        else if (transmuxer) {
            transmuxer.configure(config);
        }
    };
    TransmuxerInterface.prototype.handleTransmuxComplete = function (result) {
        result.chunkMeta.transmuxing.end = self.performance.now();
        this.onTransmuxComplete(result);
    };
    return TransmuxerInterface;
}());
exports.default = TransmuxerInterface;
