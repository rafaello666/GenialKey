"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var logger_1 = require("../utils/logger");
var BufferOperationQueue = /** @class */ (function () {
    function BufferOperationQueue(sourceBufferReference) {
        this.queues = {
            video: [],
            audio: [],
            audiovideo: [],
        };
        this.buffers = sourceBufferReference;
    }
    BufferOperationQueue.prototype.append = function (operation, type, pending) {
        var queue = this.queues[type];
        queue.push(operation);
        if (queue.length === 1 && !pending) {
            this.executeNext(type);
        }
    };
    BufferOperationQueue.prototype.insertAbort = function (operation, type) {
        var queue = this.queues[type];
        queue.unshift(operation);
        this.executeNext(type);
    };
    BufferOperationQueue.prototype.appendBlocker = function (type) {
        var execute;
        var promise = new Promise(function (resolve) {
            execute = resolve;
        });
        var operation = {
            execute: execute,
            onStart: function () { },
            onComplete: function () { },
            onError: function () { },
        };
        this.append(operation, type);
        return promise;
    };
    BufferOperationQueue.prototype.executeNext = function (type) {
        var queue = this.queues[type];
        if (queue.length) {
            var operation = queue[0];
            try {
                // Operations are expected to result in an 'updateend' event being fired. If not, the queue will lock. Operations
                // which do not end with this event must call _onSBUpdateEnd manually
                operation.execute();
            }
            catch (error) {
                logger_1.logger.warn("[buffer-operation-queue]: Exception executing \"".concat(type, "\" SourceBuffer operation: ").concat(error));
                operation.onError(error);
                // Only shift the current operation off, otherwise the updateend handler will do this for us
                var sb = this.buffers[type];
                if (!(sb === null || sb === void 0 ? void 0 : sb.updating)) {
                    this.shiftAndExecuteNext(type);
                }
            }
        }
    };
    BufferOperationQueue.prototype.shiftAndExecuteNext = function (type) {
        this.queues[type].shift();
        this.executeNext(type);
    };
    BufferOperationQueue.prototype.current = function (type) {
        return this.queues[type][0];
    };
    return BufferOperationQueue;
}());
exports.default = BufferOperationQueue;
