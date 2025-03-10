"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zipAll = zipAll;
var zip_1 = require("../observable/zip");
var joinAllInternals_1 = require("./joinAllInternals");
function zipAll(project) {
    return (0, joinAllInternals_1.joinAllInternals)(zip_1.zip, project);
}
