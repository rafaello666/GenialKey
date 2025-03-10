"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.race = race;
var argsOrArgArray_1 = require("../util/argsOrArgArray");
var raceWith_1 = require("./raceWith");
/**
 * Returns an Observable that mirrors the first source Observable to emit a next,
 * error or complete notification from the combination of this Observable and supplied Observables.
 * @param args Sources used to race for which Observable emits first.
 * @return A function that returns an Observable that mirrors the output of the
 * first Observable to emit an item.
 * @deprecated Replaced with {@link raceWith}. Will be removed in v8.
 */
function race() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return raceWith_1.raceWith.apply(void 0, (0, argsOrArgArray_1.argsOrArgArray)(args));
}
