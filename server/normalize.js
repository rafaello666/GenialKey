"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeProcessCov = normalizeProcessCov;
exports.deepNormalizeProcessCov = deepNormalizeProcessCov;
exports.normalizeScriptCov = normalizeScriptCov;
exports.deepNormalizeScriptCov = deepNormalizeScriptCov;
exports.normalizeFunctionCov = normalizeFunctionCov;
exports.normalizeRangeTree = normalizeRangeTree;
var compare_1 = require("./compare");
var range_tree_1 = require("./range-tree");
/**
 * Normalizes a process coverage.
 *
 * Sorts the scripts alphabetically by `url`.
 * Reassigns script ids: the script at index `0` receives `"0"`, the script at
 * index `1` receives `"1"` etc.
 * This does not normalize the script coverages.
 *
 * @param processCov Process coverage to normalize.
 */
function normalizeProcessCov(processCov) {
    processCov.result.sort(compare_1.compareScriptCovs);
    for (var _i = 0, _a = processCov.result.entries(); _i < _a.length; _i++) {
        var _b = _a[_i], scriptId = _b[0], scriptCov = _b[1];
        scriptCov.scriptId = scriptId.toString(10);
    }
}
/**
 * Normalizes a process coverage deeply.
 *
 * Normalizes the script coverages deeply, then normalizes the process coverage
 * itself.
 *
 * @param processCov Process coverage to normalize.
 */
function deepNormalizeProcessCov(processCov) {
    for (var _i = 0, _a = processCov.result; _i < _a.length; _i++) {
        var scriptCov = _a[_i];
        deepNormalizeScriptCov(scriptCov);
    }
    normalizeProcessCov(processCov);
}
/**
 * Normalizes a script coverage.
 *
 * Sorts the function by root range (pre-order sort).
 * This does not normalize the function coverages.
 *
 * @param scriptCov Script coverage to normalize.
 */
function normalizeScriptCov(scriptCov) {
    scriptCov.functions.sort(compare_1.compareFunctionCovs);
}
/**
 * Normalizes a script coverage deeply.
 *
 * Normalizes the function coverages deeply, then normalizes the script coverage
 * itself.
 *
 * @param scriptCov Script coverage to normalize.
 */
function deepNormalizeScriptCov(scriptCov) {
    for (var _i = 0, _a = scriptCov.functions; _i < _a.length; _i++) {
        var funcCov = _a[_i];
        normalizeFunctionCov(funcCov);
    }
    normalizeScriptCov(scriptCov);
}
/**
 * Normalizes a function coverage.
 *
 * Sorts the ranges (pre-order sort).
 * TODO: Tree-based normalization of the ranges.
 *
 * @param funcCov Function coverage to normalize.
 */
function normalizeFunctionCov(funcCov) {
    funcCov.ranges.sort(compare_1.compareRangeCovs);
    var tree = range_tree_1.RangeTree.fromSortedRanges(funcCov.ranges);
    normalizeRangeTree(tree);
    funcCov.ranges = tree.toRanges();
}
/**
 * @internal
 */
function normalizeRangeTree(tree) {
    tree.normalize();
}
