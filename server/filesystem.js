"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileExistsSync = fileExistsSync;
exports.readJsonFromDiskSync = readJsonFromDiskSync;
exports.readJsonFromDiskAsync = readJsonFromDiskAsync;
exports.fileExistsAsync = fileExistsAsync;
exports.removeExtension = removeExtension;
var fs = require("fs");
function fileExistsSync(path) {
    // If the file doesn't exist, avoid throwing an exception over the native barrier for every miss
    if (!fs.existsSync(path)) {
        return false;
    }
    try {
        var stats = fs.statSync(path);
        return stats.isFile();
    }
    catch (err) {
        // If error, assume file did not exist
        return false;
    }
}
/**
 * Reads package.json from disk
 *
 * @param file Path to package.json
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function readJsonFromDiskSync(packageJsonPath) {
    if (!fs.existsSync(packageJsonPath)) {
        return undefined;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(packageJsonPath);
}
function readJsonFromDiskAsync(path, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
callback) {
    fs.readFile(path, "utf8", function (err, result) {
        // If error, assume file did not exist
        if (err || !result) {
            return callback();
        }
        var json = JSON.parse(result);
        return callback(undefined, json);
    });
}
function fileExistsAsync(path2, callback2) {
    fs.stat(path2, function (err, stats) {
        if (err) {
            // If error assume file does not exist
            return callback2(undefined, false);
        }
        callback2(undefined, stats ? stats.isFile() : false);
    });
}
function removeExtension(path) {
    return path.substring(0, path.lastIndexOf(".")) || path;
}
