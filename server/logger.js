"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.enableLogs = enableLogs;
var noop = function () { };
var fakeLogger = {
    trace: noop,
    debug: noop,
    log: noop,
    warn: noop,
    info: noop,
    error: noop,
};
var exportedLogger = fakeLogger;
// let lastCallTime;
// function formatMsgWithTimeInfo(type, msg) {
//   const now = Date.now();
//   const diff = lastCallTime ? '+' + (now - lastCallTime) : '0';
//   lastCallTime = now;
//   msg = (new Date(now)).toISOString() + ' | [' +  type + '] > ' + msg + ' ( ' + diff + ' ms )';
//   return msg;
// }
function consolePrintFn(type) {
    var func = self.console[type];
    if (func) {
        return func.bind(self.console, "[".concat(type, "] >"));
    }
    return noop;
}
function exportLoggerFunctions(debugConfig) {
    var functions = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        functions[_i - 1] = arguments[_i];
    }
    functions.forEach(function (type) {
        exportedLogger[type] = debugConfig[type]
            ? debugConfig[type].bind(debugConfig)
            : consolePrintFn(type);
    });
}
function enableLogs(debugConfig, id) {
    // check that console is available
    if ((typeof console === 'object' && debugConfig === true) ||
        typeof debugConfig === 'object') {
        exportLoggerFunctions(debugConfig, 
        // Remove out from list here to hard-disable a log-level
        // 'trace',
        'debug', 'log', 'info', 'warn', 'error');
        // Some browsers don't allow to use bind on console object anyway
        // fallback to default if needed
        try {
            exportedLogger.log("Debug logs enabled for \"".concat(id, "\" in hls.js version ").concat(__VERSION__));
        }
        catch (e) {
            exportedLogger = fakeLogger;
        }
    }
    else {
        exportedLogger = fakeLogger;
    }
}
exports.logger = exportedLogger;
