"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJson = parseJson;
exports.parseJsonNumber = parseJsonNumber;
exports.parseJsonString = parseJsonString;
var rxParseJson = /position\s(\d+)(?: \(line \d+ column \d+\))?$/;
function parseJson(s, pos) {
    var endPos;
    parseJson.message = undefined;
    var matches;
    if (pos)
        s = s.slice(pos);
    try {
        parseJson.position = pos + s.length;
        return JSON.parse(s);
    }
    catch (e) {
        matches = rxParseJson.exec(e.message);
        if (!matches) {
            parseJson.message = "unexpected end";
            return undefined;
        }
        endPos = +matches[1];
        var c = s[endPos];
        s = s.slice(0, endPos);
        parseJson.position = pos + endPos;
        try {
            return JSON.parse(s);
        }
        catch (e1) {
            parseJson.message = "unexpected token ".concat(c);
            return undefined;
        }
    }
}
parseJson.message = undefined;
parseJson.position = 0;
parseJson.code = 'require("ajv/dist/runtime/parseJson").parseJson';
function parseJsonNumber(s, pos, maxDigits) {
    var numStr = "";
    var c;
    parseJsonNumber.message = undefined;
    if (s[pos] === "-") {
        numStr += "-";
        pos++;
    }
    if (s[pos] === "0") {
        numStr += "0";
        pos++;
    }
    else {
        if (!parseDigits(maxDigits)) {
            errorMessage();
            return undefined;
        }
    }
    if (maxDigits) {
        parseJsonNumber.position = pos;
        return +numStr;
    }
    if (s[pos] === ".") {
        numStr += ".";
        pos++;
        if (!parseDigits()) {
            errorMessage();
            return undefined;
        }
    }
    if (((c = s[pos]), c === "e" || c === "E")) {
        numStr += "e";
        pos++;
        if (((c = s[pos]), c === "+" || c === "-")) {
            numStr += c;
            pos++;
        }
        if (!parseDigits()) {
            errorMessage();
            return undefined;
        }
    }
    parseJsonNumber.position = pos;
    return +numStr;
    function parseDigits(maxLen) {
        var digit = false;
        while (((c = s[pos]), c >= "0" && c <= "9" && (maxLen === undefined || maxLen-- > 0))) {
            digit = true;
            numStr += c;
            pos++;
        }
        return digit;
    }
    function errorMessage() {
        parseJsonNumber.position = pos;
        parseJsonNumber.message = pos < s.length ? "unexpected token ".concat(s[pos]) : "unexpected end";
    }
}
parseJsonNumber.message = undefined;
parseJsonNumber.position = 0;
parseJsonNumber.code = 'require("ajv/dist/runtime/parseJson").parseJsonNumber';
var escapedChars = {
    b: "\b",
    f: "\f",
    n: "\n",
    r: "\r",
    t: "\t",
    '"': '"',
    "/": "/",
    "\\": "\\",
};
var CODE_A = "a".charCodeAt(0);
var CODE_0 = "0".charCodeAt(0);
function parseJsonString(s, pos) {
    var str = "";
    var c;
    parseJsonString.message = undefined;
    // eslint-disable-next-line no-constant-condition, @typescript-eslint/no-unnecessary-condition
    while (true) {
        c = s[pos++];
        if (c === '"')
            break;
        if (c === "\\") {
            c = s[pos];
            if (c in escapedChars) {
                str += escapedChars[c];
                pos++;
            }
            else if (c === "u") {
                pos++;
                var count = 4;
                var code = 0;
                while (count--) {
                    code <<= 4;
                    c = s[pos];
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (c === undefined) {
                        errorMessage("unexpected end");
                        return undefined;
                    }
                    c = c.toLowerCase();
                    if (c >= "a" && c <= "f") {
                        code += c.charCodeAt(0) - CODE_A + 10;
                    }
                    else if (c >= "0" && c <= "9") {
                        code += c.charCodeAt(0) - CODE_0;
                    }
                    else {
                        errorMessage("unexpected token ".concat(c));
                        return undefined;
                    }
                    pos++;
                }
                str += String.fromCharCode(code);
            }
            else {
                errorMessage("unexpected token ".concat(c));
                return undefined;
            }
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        }
        else if (c === undefined) {
            errorMessage("unexpected end");
            return undefined;
        }
        else {
            if (c.charCodeAt(0) >= 0x20) {
                str += c;
            }
            else {
                errorMessage("unexpected token ".concat(c));
                return undefined;
            }
        }
    }
    parseJsonString.position = pos;
    return str;
    function errorMessage(msg) {
        parseJsonString.position = pos;
        parseJsonString.message = msg;
    }
}
parseJsonString.message = undefined;
parseJsonString.position = 0;
parseJsonString.code = 'require("ajv/dist/runtime/parseJson").parseJsonString';
