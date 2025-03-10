"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.raceWith = raceWith;
var race_1 = require("../observable/race");
var lift_1 = require("../util/lift");
var identity_1 = require("../util/identity");
/**
 * Creates an Observable that mirrors the first source Observable to emit a next,
 * error or complete notification from the combination of the Observable to which
 * the operator is applied and supplied Observables.
 *
 * ## Example
 *
 * ```ts
 * import { interval, map, raceWith } from 'rxjs';
 *
 * const obs1 = interval(7000).pipe(map(() => 'slow one'));
 * const obs2 = interval(3000).pipe(map(() => 'fast one'));
 * const obs3 = interval(5000).pipe(map(() => 'medium one'));
 *
 * obs1
 *   .pipe(raceWith(obs2, obs3))
 *   .subscribe(winner => console.log(winner));
 *
 * // Outputs
 * // a series of 'fast one'
 * ```
 *
 * @param otherSources Sources used to race for which Observable emits first.
 * @return A function that returns an Observable that mirrors the output of the
 * first Observable to emit an item.
 */
function raceWith() {
    var otherSources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        otherSources[_i] = arguments[_i];
    }
    return !otherSources.length
        ? identity_1.identity
        : (0, lift_1.operate)(function (source, subscriber) {
            (0, race_1.raceInit)(__spreadArray([source], otherSources, true))(subscriber);
        });
}
