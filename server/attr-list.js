"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttrList = void 0;
var DECIMAL_RESOLUTION_REGEX = /^(\d+)x(\d+)$/;
var ATTR_LIST_REGEX = /(.+?)=(".*?"|.*?)(?:,|$)/g;
// adapted from https://github.com/kanongil/node-m3u8parse/blob/master/attrlist.js
var AttrList = /** @class */ (function () {
    function AttrList(attrs) {
        if (typeof attrs === 'string') {
            attrs = AttrList.parseAttrList(attrs);
        }
        Object.assign(this, attrs);
    }
    Object.defineProperty(AttrList.prototype, "clientAttrs", {
        get: function () {
            return Object.keys(this).filter(function (attr) { return attr.substring(0, 2) === 'X-'; });
        },
        enumerable: false,
        configurable: true
    });
    AttrList.prototype.decimalInteger = function (attrName) {
        var intValue = parseInt(this[attrName], 10);
        if (intValue > Number.MAX_SAFE_INTEGER) {
            return Infinity;
        }
        return intValue;
    };
    AttrList.prototype.hexadecimalInteger = function (attrName) {
        if (this[attrName]) {
            var stringValue = (this[attrName] || '0x').slice(2);
            stringValue = (stringValue.length & 1 ? '0' : '') + stringValue;
            var value = new Uint8Array(stringValue.length / 2);
            for (var i = 0; i < stringValue.length / 2; i++) {
                value[i] = parseInt(stringValue.slice(i * 2, i * 2 + 2), 16);
            }
            return value;
        }
        else {
            return null;
        }
    };
    AttrList.prototype.hexadecimalIntegerAsNumber = function (attrName) {
        var intValue = parseInt(this[attrName], 16);
        if (intValue > Number.MAX_SAFE_INTEGER) {
            return Infinity;
        }
        return intValue;
    };
    AttrList.prototype.decimalFloatingPoint = function (attrName) {
        return parseFloat(this[attrName]);
    };
    AttrList.prototype.optionalFloat = function (attrName, defaultValue) {
        var value = this[attrName];
        return value ? parseFloat(value) : defaultValue;
    };
    AttrList.prototype.enumeratedString = function (attrName) {
        return this[attrName];
    };
    AttrList.prototype.bool = function (attrName) {
        return this[attrName] === 'YES';
    };
    AttrList.prototype.decimalResolution = function (attrName) {
        var res = DECIMAL_RESOLUTION_REGEX.exec(this[attrName]);
        if (res === null) {
            return undefined;
        }
        return {
            width: parseInt(res[1], 10),
            height: parseInt(res[2], 10),
        };
    };
    AttrList.parseAttrList = function (input) {
        var match;
        var attrs = {};
        var quote = '"';
        ATTR_LIST_REGEX.lastIndex = 0;
        while ((match = ATTR_LIST_REGEX.exec(input)) !== null) {
            var value = match[2];
            if (value.indexOf(quote) === 0 &&
                value.lastIndexOf(quote) === value.length - 1) {
                value = value.slice(1, -1);
            }
            var name_1 = match[1].trim();
            attrs[name_1] = value;
        }
        return attrs;
    };
    return AttrList;
}());
exports.AttrList = AttrList;
