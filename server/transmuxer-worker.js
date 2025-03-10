"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var transmuxer_1 = require("../demux/transmuxer");
var events_1 = require("../events");
var logger_1 = require("../utils/logger");
var eventemitter3_1 = require("eventemitter3");
var errors_1 = require("../errors");
if (typeof __IN_WORKER__ !== 'undefined' && __IN_WORKER__) {
    startWorker(self);
}
function startWorker(self) {
    var observer = new eventemitter3_1.EventEmitter();
    var forwardMessage = function (ev, data) {
        self.postMessage({ event: ev, data: data });
    };
    // forward events to main thread
    observer.on(events_1.Events.FRAG_DECRYPTED, forwardMessage);
    observer.on(events_1.Events.ERROR, forwardMessage);
    // forward logger events to main thread
    var forwardWorkerLogs = function () {
        var _loop_1 = function (logFn) {
            var func = function (message) {
                forwardMessage('workerLog', {
                    logType: logFn,
                    message: message,
                });
            };
            logger_1.logger[logFn] = func;
        };
        for (var logFn in logger_1.logger) {
            _loop_1(logFn);
        }
    };
    self.addEventListener('message', function (ev) {
        var data = ev.data;
        switch (data.cmd) {
            case 'init': {
                var config = JSON.parse(data.config);
                self.transmuxer = new transmuxer_1.default(observer, data.typeSupported, config, '', data.id);
                (0, logger_1.enableLogs)(config.debug, data.id);
                forwardWorkerLogs();
                forwardMessage('init', null);
                break;
            }
            case 'configure': {
                self.transmuxer.configure(data.config);
                break;
            }
            case 'demux': {
                var transmuxResult = self.transmuxer.push(data.data, data.decryptdata, data.chunkMeta, data.state);
                if ((0, transmuxer_1.isPromise)(transmuxResult)) {
                    self.transmuxer.async = true;
                    transmuxResult
                        .then(function (data) {
                        emitTransmuxComplete(self, data);
                    })
                        .catch(function (error) {
                        forwardMessage(events_1.Events.ERROR, {
                            type: errors_1.ErrorTypes.MEDIA_ERROR,
                            details: errors_1.ErrorDetails.FRAG_PARSING_ERROR,
                            chunkMeta: data.chunkMeta,
                            fatal: false,
                            error: error,
                            err: error,
                            reason: "transmuxer-worker push error",
                        });
                    });
                }
                else {
                    self.transmuxer.async = false;
                    emitTransmuxComplete(self, transmuxResult);
                }
                break;
            }
            case 'flush': {
                var id_1 = data.chunkMeta;
                var transmuxResult = self.transmuxer.flush(id_1);
                var asyncFlush = (0, transmuxer_1.isPromise)(transmuxResult);
                if (asyncFlush || self.transmuxer.async) {
                    if (!(0, transmuxer_1.isPromise)(transmuxResult)) {
                        transmuxResult = Promise.resolve(transmuxResult);
                    }
                    transmuxResult
                        .then(function (results) {
                        handleFlushResult(self, results, id_1);
                    })
                        .catch(function (error) {
                        forwardMessage(events_1.Events.ERROR, {
                            type: errors_1.ErrorTypes.MEDIA_ERROR,
                            details: errors_1.ErrorDetails.FRAG_PARSING_ERROR,
                            chunkMeta: data.chunkMeta,
                            fatal: false,
                            error: error,
                            err: error,
                            reason: "transmuxer-worker flush error",
                        });
                    });
                }
                else {
                    handleFlushResult(self, transmuxResult, id_1);
                }
                break;
            }
            default:
                break;
        }
    });
}
function emitTransmuxComplete(self, transmuxResult) {
    if (isEmptyResult(transmuxResult.remuxResult)) {
        return false;
    }
    var transferable = [];
    var _a = transmuxResult.remuxResult, audio = _a.audio, video = _a.video;
    if (audio) {
        addToTransferable(transferable, audio);
    }
    if (video) {
        addToTransferable(transferable, video);
    }
    self.postMessage({ event: 'transmuxComplete', data: transmuxResult }, transferable);
    return true;
}
// Converts data to a transferable object https://developers.google.com/web/updates/2011/12/Transferable-Objects-Lightning-Fast)
// in order to minimize message passing overhead
function addToTransferable(transferable, track) {
    if (track.data1) {
        transferable.push(track.data1.buffer);
    }
    if (track.data2) {
        transferable.push(track.data2.buffer);
    }
}
function handleFlushResult(self, results, chunkMeta) {
    var parsed = results.reduce(function (parsed, result) { return emitTransmuxComplete(self, result) || parsed; }, false);
    if (!parsed) {
        // Emit at least one "transmuxComplete" message even if media is not found to update stream-controller state to PARSING
        self.postMessage({ event: 'transmuxComplete', data: results[0] });
    }
    self.postMessage({ event: 'flush', data: chunkMeta });
}
function isEmptyResult(remuxResult) {
    return (!remuxResult.audio &&
        !remuxResult.video &&
        !remuxResult.text &&
        !remuxResult.id3 &&
        !remuxResult.initSegment);
}
