"use strict";
/**
 *  hex dump helper class
 */
Object.defineProperty(exports, "__esModule", { value: true });
var Hex = {
    hexDump: function (array) {
        var str = '';
        for (var i = 0; i < array.length; i++) {
            var h = array[i].toString(16);
            if (h.length < 2) {
                h = '0' + h;
            }
            str += h;
        }
        return str;
    },
};
exports.default = Hex;
