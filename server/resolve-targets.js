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
// Kind of gross, but essentially asserting that the exports of this module are the same as the
// exports of index-browser, since this file may be replaced at bundle time with index-browser.
({});
var path_1 = require("path");
var helper_compilation_targets_1 = require("@babel/helper-compilation-targets");
function resolveBrowserslistConfigFile(browserslistConfigFile, configFileDir) {
    return path_1.default.resolve(configFileDir, browserslistConfigFile);
}
function resolveTargets(options, root) {
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
    var browserslistConfigFile = options.browserslistConfigFile;
    var configFile;
    var ignoreBrowserslistConfig = false;
    if (typeof browserslistConfigFile === "string") {
        configFile = browserslistConfigFile;
    }
    else {
        ignoreBrowserslistConfig = browserslistConfigFile === false;
    }
    return (0, helper_compilation_targets_1.default)(targets, {
        ignoreBrowserslistConfig: ignoreBrowserslistConfig,
        configFile: configFile,
        configPath: root,
        browserslistEnv: options.browserslistEnv,
    });
}
