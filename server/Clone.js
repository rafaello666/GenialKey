"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneProcessCov = cloneProcessCov;
exports.cloneScriptCov = cloneScriptCov;
exports.cloneFunctionCov = cloneFunctionCov;
exports.cloneRangeCov = cloneRangeCov;
/**
 * Creates a deep copy of a process coverage.
 *
 * @param processCov Process coverage to clone.
 * @return Cloned process coverage.
 */
function cloneProcessCov(processCov) {
    var result = [];
    for (var _i = 0, _a = processCov.result; _i < _a.length; _i++) {
        var scriptCov = _a[_i];
        result.push(cloneScriptCov(scriptCov));
    }
    return {
        result: result,
    };
}
/**
 * Creates a deep copy of a script coverage.
 *
 * @param scriptCov Script coverage to clone.
 * @return Cloned script coverage.
 */
function cloneScriptCov(scriptCov) {
    var functions = [];
    for (var _i = 0, _a = scriptCov.functions; _i < _a.length; _i++) {
        var functionCov = _a[_i];
        functions.push(cloneFunctionCov(functionCov));
    }
    return {
        scriptId: scriptCov.scriptId,
        url: scriptCov.url,
        functions: functions,
    };
}
/**
 * Creates a deep copy of a function coverage.
 *
 * @param functionCov Function coverage to clone.
 * @return Cloned function coverage.
 */
function cloneFunctionCov(functionCov) {
    var ranges = [];
    for (var _i = 0, _a = functionCov.ranges; _i < _a.length; _i++) {
        var rangeCov = _a[_i];
        ranges.push(cloneRangeCov(rangeCov));
    }
    return {
        functionName: functionCov.functionName,
        ranges: ranges,
        isBlockCoverage: functionCov.isBlockCoverage,
    };
}
/**
 * Creates a deep copy of a function coverage.
 *
 * @param rangeCov Range coverage to clone.
 * @return Cloned range coverage.
 */
function cloneRangeCov(rangeCov) {
    return {
        startOffset: rangeCov.startOffset,
        endOffset: rangeCov.endOffset,
        count: rangeCov.count,
    };
}
