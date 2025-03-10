"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ucs2length;
// https://mathiasbynens.be/notes/javascript-encoding
// https://github.com/bestiejs/punycode.js - punycode.ucs2.decode
function ucs2length(str) {
    var len = str.length;
    var length = 0;
    var pos = 0;
    var value;
    while (pos < len) {
        length++;
        value = str.charCodeAt(pos++);
        if (value >= 0xd800 && value <= 0xdbff && pos < len) {
            // high surrogate, and there is a next character
            value = str.charCodeAt(pos);
            if ((value & 0xfc00) === 0xdc00)
                pos++; // low surrogate
        }
    }
    return length;
}
ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
