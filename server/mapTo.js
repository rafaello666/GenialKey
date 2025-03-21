"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapTo = mapTo;
var map_1 = require("./map");
/**
 * Emits the given constant value on the output Observable every time the source
 * Observable emits a value.
 *
 * <span class="informal">Like {@link map}, but it maps every source value to
 * the same output value every time.</span>
 *
 * ![](mapTo.png)
 *
 * Takes a constant `value` as argument, and emits that whenever the source
 * Observable emits a value. In other words, ignores the actual source value,
 * and simply uses the emission moment to know when to emit the given `value`.
 *
 * ## Example
 *
 * Map every click to the string `'Hi'`
 *
 * ```ts
 * import { fromEvent, mapTo } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const greetings = clicks.pipe(mapTo('Hi'));
 *
 * greetings.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link map}
 *
 * @param value The value to map each source value to.
 * @return A function that returns an Observable that emits the given `value`
 * every time the source Observable emits.
 * @deprecated To be removed in v9. Use {@link map} instead: `map(() => value)`.
 */
function mapTo(value) {
    return (0, map_1.map)(function () { return value; });
}
