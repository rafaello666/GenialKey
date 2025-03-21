"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwError = throwError;
var Observable_1 = require("../Observable");
var isFunction_1 = require("../util/isFunction");
function throwError(errorOrErrorFactory, scheduler) {
    var errorFactory = (0, isFunction_1.isFunction)(errorOrErrorFactory) ? errorOrErrorFactory : function () { return errorOrErrorFactory; };
    var init = function (subscriber) { return subscriber.error(errorFactory()); };
    return new Observable_1.Observable(scheduler ? function (subscriber) { return scheduler.schedule(init, 0, subscriber); } : init);
}
