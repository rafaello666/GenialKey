"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveBrowserslistConfigFile = resolveBrowserslistConfigFile;
exports.resolveTargets = resolveTargets;
var helper_compilation_targets_1 = require("@babel/helper-compilation-targets");
function resolveBrowserslistConfigFile(
// eslint-disable-next-line @typescript-eslint/no-unused-vars
browserslistConfigFile, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
configFilePath) {
    return undefined;
}
function resolveTargets(options, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
root) {
    var optTargets = options.targets;
    var targets;
    if (typeof optTargets === "string" || Array.isArray(optTargets)) {
        targets = { browsers: optTargets };
    }
    else if (optTargets) {
        if ("esmodules" in optTargets) {
            targets = __assign(__assign({}, optTargets), { esmodules: "intersect" });
        }
        else {
            // https://github.com/microsoft/TypeScript/issues/17002
            targets = optTargets;
        }
    }
    return (0, helper_compilation_targets_1.default)(targets, {
        ignoreBrowserslistConfig: true,
        browserslistEnv: options.browserslistEnv,
    });
}
