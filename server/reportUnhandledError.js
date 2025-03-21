"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportUnhandledError = reportUnhandledError;
var config_1 = require("../config");
var timeoutProvider_1 = require("../scheduler/timeoutProvider");
/**
 * Handles an error on another job either with the user-configured {@link onUnhandledError},
 * or by throwing it on that new job so it can be picked up by `window.onerror`, `process.on('error')`, etc.
 *
 * This should be called whenever there is an error that is out-of-band with the subscription
 * or when an error hits a terminal boundary of the subscription and no error handler was provided.
 *
 * @param err the error to report
 */
function reportUnhandledError(err) {
    timeoutProvider_1.timeoutProvider.setTimeout(function () {
        var onUnhandledError = config_1.config.onUnhandledError;
        if (onUnhandledError) {
            // Execute the user-configured error handler.
            onUnhandledError(err);
        }
        else {
            // Throw so it is picked up by the runtime's uncaught error mechanism.
            throw err;
        }
    });
}
