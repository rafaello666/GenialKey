"use strict";
/**
 *  TimeRanges to string helper
 */
Object.defineProperty(exports, "__esModule", { value: true });
var TimeRanges = {
    toString: function (r) {
        var log = '';
        var len = r.length;
        for (var i = 0; i < len; i++) {
            log += "[".concat(r.start(i).toFixed(3), "-").concat(r.end(i).toFixed(3), "]");
        }
        return log;
    },
};
exports.default = TimeRanges;
