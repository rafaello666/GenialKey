"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jest_1 = require("@nx/jest");
exports.default = async () => ({
    projects: await (0, jest_1.getJestProjectsAsync)()
});
