"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findIndex = findIndex;
var lift_1 = require("../util/lift");
var find_1 = require("./find");
/**
 * Emits only the index of the first value emitted by the source Observable that
 * meets some condition.
 *
 * <span class="informal">It's like {@link find}, but emits the index of the
 * found value, not the value itself.</span>
 *
 * ![](findIndex.png)
 *
 * `findIndex` searches for the first item in the source Observable that matches
 * the specified condition embodied by the `predicate`, and returns the
 * (zero-based) index of the first occurrence in the source. Unlike
 * {@link first}, the `predicate` is required in `findIndex`, and does not emit
 * an error if a valid value is not found.
 *
 * ## Example
 *
 * Emit the index of first click that happens on a DIV element
 *
 * ```ts
 * import { fromEvent, findIndex } from 'rxjs';
 *
 * const div = document.createElement('div');
 * div.style.cssText = 'width: 200px; height: 200px; background: #09c;';
 * document.body.appendChild(div);
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(findIndex(ev => (<HTMLElement>ev.target).tagName === 'DIV'));
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link filter}
 * @see {@link find}
 * @see {@link first}
 * @see {@link take}
 *
 * @param predicate A function called with each item to test for condition matching.
 * @param thisArg An optional argument to determine the value of `this` in the
 * `predicate` function.
 * @return A function that returns an Observable that emits the index of the
 * first item that matches the condition.
 */
function findIndex(predicate, thisArg) {
    return (0, lift_1.operate)((0, find_1.createFind)(predicate, thisArg, 'index'));
}
