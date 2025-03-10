"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.base64ToBase64Url = base64ToBase64Url;
exports.strToBase64Encode = strToBase64Encode;
exports.base64DecodeToStr = base64DecodeToStr;
exports.base64Encode = base64Encode;
exports.base64UrlEncode = base64UrlEncode;
exports.base64Decode = base64Decode;
function base64ToBase64Url(base64encodedStr) {
    return base64encodedStr
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
function strToBase64Encode(str) {
    return btoa(str);
}
function base64DecodeToStr(str) {
    return atob(str);
}
function base64Encode(input) {
    return btoa(String.fromCharCode.apply(String, input));
}
function base64UrlEncode(input) {
    return base64ToBase64Url(base64Encode(input));
}
function base64Decode(base64encodedStr) {
    return Uint8Array.from(atob(base64encodedStr), function (c) { return c.charCodeAt(0); });
}
