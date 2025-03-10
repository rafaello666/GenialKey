"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeEndianness = changeEndianness;
exports.convertDataUriToArrayBytes = convertDataUriToArrayBytes;
exports.strToUtf8array = strToUtf8array;
var numeric_encoding_utils_1 = require("./numeric-encoding-utils");
function getKeyIdBytes(str) {
    var keyIdbytes = strToUtf8array(str).subarray(0, 16);
    var paddedkeyIdbytes = new Uint8Array(16);
    paddedkeyIdbytes.set(keyIdbytes, 16 - keyIdbytes.length);
    return paddedkeyIdbytes;
}
function changeEndianness(keyId) {
    var swap = function (array, from, to) {
        var cur = array[from];
        array[from] = array[to];
        array[to] = cur;
    };
    swap(keyId, 0, 3);
    swap(keyId, 1, 2);
    swap(keyId, 4, 5);
    swap(keyId, 6, 7);
}
function convertDataUriToArrayBytes(uri) {
    // data:[<media type][;attribute=value][;base64],<data>
    var colonsplit = uri.split(':');
    var keydata = null;
    if (colonsplit[0] === 'data' && colonsplit.length === 2) {
        var semicolonsplit = colonsplit[1].split(';');
        var commasplit = semicolonsplit[semicolonsplit.length - 1].split(',');
        if (commasplit.length === 2) {
            var isbase64 = commasplit[0] === 'base64';
            var data = commasplit[1];
            if (isbase64) {
                semicolonsplit.splice(-1, 1); // remove from processing
                keydata = (0, numeric_encoding_utils_1.base64Decode)(data);
            }
            else {
                keydata = getKeyIdBytes(data);
            }
        }
    }
    return keydata;
}
function strToUtf8array(str) {
    return Uint8Array.from(unescape(encodeURIComponent(str)), function (c) {
        return c.charCodeAt(0);
    });
}
