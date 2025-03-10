"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasUMDWorker = hasUMDWorker;
exports.injectWorker = injectWorker;
exports.loadWorker = loadWorker;
// ensure the worker ends up in the bundle
// If the worker should not be included this gets aliased to empty.js
require("./transmuxer-worker");
function hasUMDWorker() {
    return typeof __HLS_WORKER_BUNDLE__ === 'function';
}
function injectWorker() {
    var blob = new self.Blob([
        "var exports={};var module={exports:exports};function define(f){f()};define.amd=true;(".concat(__HLS_WORKER_BUNDLE__.toString(), ")(true);"),
    ], {
        type: 'text/javascript',
    });
    var objectURL = self.URL.createObjectURL(blob);
    var worker = new self.Worker(objectURL);
    return {
        worker: worker,
        objectURL: objectURL,
    };
}
function loadWorker(path) {
    var scriptURL = new self.URL(path, self.location.href).href;
    var worker = new self.Worker(scriptURL);
    return {
        worker: worker,
        scriptURL: scriptURL,
    };
}
