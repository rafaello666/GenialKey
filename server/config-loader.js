"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
exports.configLoader = configLoader;
var TsConfigLoader2 = require("./tsconfig-loader");
var path = require("path");
function loadConfig(cwd) {
    if (cwd === void 0) { cwd = process.cwd(); }
    return configLoader({ cwd: cwd });
}
function configLoader(_a) {
    var cwd = _a.cwd, explicitParams = _a.explicitParams, _b = _a.tsConfigLoader, tsConfigLoader = _b === void 0 ? TsConfigLoader2.tsConfigLoader : _b;
    if (explicitParams) {
        var absoluteBaseUrl = path.isAbsolute(explicitParams.baseUrl)
            ? explicitParams.baseUrl
            : path.join(cwd, explicitParams.baseUrl);
        return {
            resultType: "success",
            configFileAbsolutePath: "",
            baseUrl: explicitParams.baseUrl,
            absoluteBaseUrl: absoluteBaseUrl,
            paths: explicitParams.paths,
            mainFields: explicitParams.mainFields,
            addMatchAll: explicitParams.addMatchAll,
        };
    }
    // Load tsconfig and create path matching function
    var loadResult = tsConfigLoader({
        cwd: cwd,
        getEnv: function (key) { return process.env[key]; },
    });
    if (!loadResult.tsConfigPath) {
        return {
            resultType: "failed",
            message: "Couldn't find tsconfig.json",
        };
    }
    return {
        resultType: "success",
        configFileAbsolutePath: loadResult.tsConfigPath,
        baseUrl: loadResult.baseUrl,
        absoluteBaseUrl: path.resolve(path.dirname(loadResult.tsConfigPath), loadResult.baseUrl || ""),
        paths: loadResult.paths || {},
        addMatchAll: loadResult.baseUrl !== undefined,
    };
}
