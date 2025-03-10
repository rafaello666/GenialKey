"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitForest = emitForest;
exports.emitForestLines = emitForestLines;
exports.parseFunctionRanges = parseFunctionRanges;
exports.parseOffsets = parseOffsets;
var compare_1 = require("./compare");
function emitForest(trees) {
    return emitForestLines(trees).join("\n");
}
function emitForestLines(trees) {
    var colMap = getColMap(trees);
    var header = emitOffsets(colMap);
    return __spreadArray([header], trees.map(function (tree) { return emitTree(tree, colMap).join("\n"); }), true);
}
function getColMap(trees) {
    var eventSet = new Set();
    for (var _i = 0, trees_1 = trees; _i < trees_1.length; _i++) {
        var tree = trees_1[_i];
        var stack = [tree];
        while (stack.length > 0) {
            var cur = stack.pop();
            eventSet.add(cur.start);
            eventSet.add(cur.end);
            for (var _a = 0, _b = cur.children; _a < _b.length; _a++) {
                var child = _b[_a];
                stack.push(child);
            }
        }
    }
    var events = __spreadArray([], eventSet, true);
    events.sort(function (a, b) { return a - b; });
    var maxDigits = 1;
    for (var _c = 0, events_1 = events; _c < events_1.length; _c++) {
        var event_1 = events_1[_c];
        maxDigits = Math.max(maxDigits, event_1.toString(10).length);
    }
    var colWidth = maxDigits + 3;
    var colMap = new Map();
    for (var _d = 0, _e = events.entries(); _d < _e.length; _d++) {
        var _f = _e[_d], i = _f[0], event_2 = _f[1];
        colMap.set(event_2, i * colWidth);
    }
    return colMap;
}
function emitTree(tree, colMap) {
    var layers = [];
    var nextLayer = [tree];
    while (nextLayer.length > 0) {
        var layer = nextLayer;
        layers.push(layer);
        nextLayer = [];
        for (var _i = 0, layer_1 = layer; _i < layer_1.length; _i++) {
            var node = layer_1[_i];
            for (var _a = 0, _b = node.children; _a < _b.length; _a++) {
                var child = _b[_a];
                nextLayer.push(child);
            }
        }
    }
    return layers.map(function (layer) { return emitTreeLayer(layer, colMap); });
}
function parseFunctionRanges(text, offsetMap) {
    var result = [];
    for (var _i = 0, _a = text.split("\n"); _i < _a.length; _i++) {
        var line = _a[_i];
        for (var _b = 0, _c = parseTreeLayer(line, offsetMap); _b < _c.length; _b++) {
            var range = _c[_b];
            result.push(range);
        }
    }
    result.sort(compare_1.compareRangeCovs);
    return result;
}
/**
 *
 * @param layer Sorted list of disjoint trees.
 * @param colMap
 */
function emitTreeLayer(layer, colMap) {
    var line = [];
    var curIdx = 0;
    for (var _i = 0, layer_2 = layer; _i < layer_2.length; _i++) {
        var _a = layer_2[_i], start = _a.start, end = _a.end, count = _a.count;
        var startIdx = colMap.get(start);
        var endIdx = colMap.get(end);
        if (startIdx > curIdx) {
            line.push(" ".repeat(startIdx - curIdx));
        }
        line.push(emitRange(count, endIdx - startIdx));
        curIdx = endIdx;
    }
    return line.join("");
}
function parseTreeLayer(text, offsetMap) {
    var result = [];
    var regex = /\[(\d+)-*\)/gs;
    while (true) {
        var match = regex.exec(text);
        if (match === null) {
            break;
        }
        var startIdx = match.index;
        var endIdx = startIdx + match[0].length;
        var count = parseInt(match[1], 10);
        var startOffset = offsetMap.get(startIdx);
        var endOffset = offsetMap.get(endIdx);
        if (startOffset === undefined || endOffset === undefined) {
            throw new Error("Invalid offsets for: ".concat(JSON.stringify(text)));
        }
        result.push({ startOffset: startOffset, endOffset: endOffset, count: count });
    }
    return result;
}
function emitRange(count, len) {
    var rangeStart = "[".concat(count.toString(10));
    var rangeEnd = ")";
    var hyphensLen = len - (rangeStart.length + rangeEnd.length);
    var hyphens = "-".repeat(Math.max(0, hyphensLen));
    return "".concat(rangeStart).concat(hyphens).concat(rangeEnd);
}
function emitOffsets(colMap) {
    var line = "";
    for (var _i = 0, colMap_1 = colMap; _i < colMap_1.length; _i++) {
        var _a = colMap_1[_i], event_3 = _a[0], col = _a[1];
        if (line.length < col) {
            line += " ".repeat(col - line.length);
        }
        line += event_3.toString(10);
    }
    return line;
}
function parseOffsets(text) {
    var result = new Map();
    var regex = /\d+/gs;
    while (true) {
        var match = regex.exec(text);
        if (match === null) {
            break;
        }
        result.set(match.index, parseInt(match[0], 10));
    }
    return result;
}
