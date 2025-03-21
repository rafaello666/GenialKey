"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPackage = loadPackage;
var common_1 = require("@nestjs/common");
var MISSING_REQUIRED_DEPENDENCY = function (name, reason) {
    return "The \"".concat(name, "\" package is missing. Please, make sure to install this library ($ npm install ").concat(name, ") to take advantage of ").concat(reason, ".");
};
var logger = new common_1.Logger('PackageLoader');
function loadPackage(packageName, context, loaderFn) {
    try {
        return loaderFn ? loaderFn() : require(packageName);
    }
    catch (e) {
        logger.error(MISSING_REQUIRED_DEPENDENCY(packageName, context));
        process.exit(1);
    }
}
