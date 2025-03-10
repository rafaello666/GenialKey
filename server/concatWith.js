"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.concatWith = concatWith;
var concat_1 = require("./concat");
/**
 * Emits all of the values from the source observable, then, once it completes, subscribes
 * to each observable source provided, one at a time, emitting all of their values, and not subscribing
 * to the next one until it completes.
 *
 * `concat(a$, b$, c$)` is the same as `a$.pipe(concatWith(b$, c$))`.
 *
 * ## Example
 *
 * Listen for one mouse click, then listen for all mouse moves.
 *
 * ```ts
 * import { fromEvent, map, take, concatWith } from 'rxjs';
 *
 * const clicks$ = fromEvent(document, 'click');
 * const moves$ = fromEvent(document, 'mousemove');
 *
 * clicks$.pipe(
 *   map(() => 'click'),
 *   take(1),
 *   concatWith(
 *     moves$.pipe(
 *       map(() => 'move')
 *     )
 *   )
 * )
 * .subscribe(x => console.log(x));
 *
 * // 'click'
 * // 'move'
 * // 'move'
 * // 'move'
 * // ...
 * ```
 *
 * @param otherSources Other observable sources to subscribe to, in sequence, after the original source is complete.
 * @return A function that returns an Observable that concatenates
 * subscriptions to the source and provided Observables subscribing to the next
 * only once the current subscription completes.
 */
function concatWith() {
    var otherSources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        otherSources[_i] = arguments[_i];
    }
    return concat_1.concat.apply(void 0, otherSources);
}
