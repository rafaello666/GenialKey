"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = validTimestamp;
var DT_SEPARATOR = /t|\s/i;
var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
var TIME = /^(\d\d):(\d\d):(\d\d)(?:\.\d+)?(?:z|([+-]\d\d)(?::?(\d\d))?)$/i;
var DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function validTimestamp(str, allowDate) {
    // http://tools.ietf.org/html/rfc3339#section-5.6
    var dt = str.split(DT_SEPARATOR);
    return ((dt.length === 2 && validDate(dt[0]) && validTime(dt[1])) ||
        (allowDate && dt.length === 1 && validDate(dt[0])));
}
function validDate(str) {
    var matches = DATE.exec(str);
    if (!matches)
        return false;
    var y = +matches[1];
    var m = +matches[2];
    var d = +matches[3];
    return (m >= 1 &&
        m <= 12 &&
        d >= 1 &&
        (d <= DAYS[m] ||
            // leap year: https://tools.ietf.org/html/rfc3339#appendix-C
            (m === 2 && d === 29 && (y % 100 === 0 ? y % 400 === 0 : y % 4 === 0))));
}
function validTime(str) {
    var matches = TIME.exec(str);
    if (!matches)
        return false;
    var hr = +matches[1];
    var min = +matches[2];
    var sec = +matches[3];
    var tzH = +(matches[4] || 0);
    var tzM = +(matches[5] || 0);
    return ((hr <= 23 && min <= 59 && sec <= 59) ||
        // leap second
        (hr - tzH === 23 && min - tzM === 59 && sec === 60));
}
validTimestamp.code = 'require("ajv/dist/runtime/timestamp").default';
