"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endWith = endWith;
var concat_1 = require("../observable/concat");
var of_1 = require("../observable/of");
/**
 * Returns an observable that will emit all values from the source, then synchronously emit
 * the provided value(s) immediately after the source completes.
 *
 * NOTE: Passing a last argument of a Scheduler is _deprecated_, and may result in incorrect
 * types in TypeScript.
 *
 * This is useful for knowing when an observable ends. Particularly when paired with an
 * operator like {@link takeUntil}
 *
 * ![](endWith.png)
 *
 * ## Example
 *
 * Emit values to know when an interval starts and stops. The interval will
 * stop when a user clicks anywhere on the document.
 *
 * ```ts
 * import { interval, map, fromEvent, startWith, takeUntil, endWith } from 'rxjs';
 *
 * const ticker$ = interval(5000).pipe(
 *   map(() => 'tick')
 * );
 *
 * const documentClicks$ = fromEvent(document, 'click');
 *
 * ticker$.pipe(
 *   startWith('interval started'),
 *   takeUntil(documentClicks$),
 *   endWith('interval ended by click')
 * )
 * .subscribe(x => console.log(x));
 *
 * // Result (assuming a user clicks after 15 seconds)
 * // 'interval started'
 * // 'tick'
 * // 'tick'
 * // 'tick'
 * // 'interval ended by click'
 * ```
 *
 * @see {@link startWith}
 * @see {@link concat}
 * @see {@link takeUntil}
 *
 * @param values Items you want the modified Observable to emit last.
 * @return A function that returns an Observable that emits all values from the
 * source, then synchronously emits the provided value(s) immediately after the
 * source completes.
 */
function endWith() {
    var values = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        values[_i] = arguments[_i];
    }
    return function (source) { return (0, concat_1.concat)(source, of_1.of.apply(void 0, values)); };
}
