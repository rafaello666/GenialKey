"use strict";
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROOT_CONFIG_FILENAMES = void 0;
exports.findConfigUpwards = findConfigUpwards;
exports.findPackageData = findPackageData;
exports.findRelativeConfig = findRelativeConfig;
exports.findRootConfig = findRootConfig;
exports.loadConfig = loadConfig;
exports.resolveShowConfigPath = resolveShowConfigPath;
exports.resolvePlugin = resolvePlugin;
exports.resolvePreset = resolvePreset;
exports.loadPlugin = loadPlugin;
exports.loadPreset = loadPreset;
function findConfigUpwards(
// eslint-disable-next-line @typescript-eslint/no-unused-vars
rootDir) {
    return null;
}
// eslint-disable-next-line require-yield
function findPackageData(filepath) {
    return __generator(this, function (_a) {
        return [2 /*return*/, {
                filepath: filepath,
                directories: [],
                pkg: null,
                isPackage: false,
            }];
    });
}
// eslint-disable-next-line require-yield
function findRelativeConfig(
// eslint-disable-next-line @typescript-eslint/no-unused-vars
pkgData, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
envName, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
caller) {
    return __generator(this, function (_a) {
        return [2 /*return*/, { config: null, ignore: null }];
    });
}
// eslint-disable-next-line require-yield
function findRootConfig(
// eslint-disable-next-line @typescript-eslint/no-unused-vars
dirname, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
envName, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
caller) {
    return __generator(this, function (_a) {
        return [2 /*return*/, null];
    });
}
// eslint-disable-next-line require-yield
function loadConfig(name, dirname, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
envName, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
caller) {
    return __generator(this, function (_a) {
        throw new Error("Cannot load ".concat(name, " relative to ").concat(dirname, " in a browser"));
    });
}
// eslint-disable-next-line require-yield
function resolveShowConfigPath(
// eslint-disable-next-line @typescript-eslint/no-unused-vars
dirname) {
    return __generator(this, function (_a) {
        return [2 /*return*/, null];
    });
}
exports.ROOT_CONFIG_FILENAMES = [];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function resolvePlugin(name, dirname) {
    return null;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function resolvePreset(name, dirname) {
    return null;
}
function loadPlugin(name, dirname) {
    throw new Error("Cannot load plugin ".concat(name, " relative to ").concat(dirname, " in a browser"));
}
function loadPreset(name, dirname) {
    throw new Error("Cannot load preset ".concat(name, " relative to ").concat(dirname, " in a browser"));
}
