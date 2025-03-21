"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.first = first;
var EmptyError_1 = require("../util/EmptyError");
var filter_1 = require("./filter");
var take_1 = require("./take");
var defaultIfEmpty_1 = require("./defaultIfEmpty");
var throwIfEmpty_1 = require("./throwIfEmpty");
var identity_1 = require("../util/identity");
/**
 * Emits only the first value (or the first value that meets some condition)
 * emitted by the source Observable.
 *
 * <span class="informal">Emits only the first value. Or emits only the first
 * value that passes some test.</span>
 *
 * ![](first.png)
 *
 * If called with no arguments, `first` emits the first value of the source
 * Observable, then completes. If called with a `predicate` function, `first`
 * emits the first value of the source that matches the specified condition. Emits an error
 * notification if `defaultValue` was not provided and a matching element is not found.
 *
 * ## Examples
 *
 * Emit only the first click that happens on the DOM
 *
 * ```ts
 * import { fromEvent, first } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(first());
 * result.subscribe(x => console.log(x));
 * ```
 *
 * Emits the first click that happens on a DIV
 *
 * ```ts
 * import { fromEvent, first } from 'rxjs';
 *
 * const div = document.createElement('div');
 * div.style.cssText = 'width: 200px; height: 200px; background: #09c;';
 * document.body.appendChild(div);
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(first(ev => (<HTMLElement>ev.target).tagName === 'DIV'));
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link filter}
 * @see {@link find}
 * @see {@link take}
 * @see {@link last}
 *
 * @throws {EmptyError} Delivers an `EmptyError` to the Observer's `error`
 * callback if the Observable completes before any `next` notification was sent.
 * This is how `first()` is different from `take(1)` which completes instead.
 *
 * @param predicate An optional function called with each item to test for condition
 * matching.
 * @param defaultValue The default value emitted in case no valid value was found on
 * the source.
 * @return A function that returns an Observable that emits the first item that
 * matches the condition.
 */
function first(predicate, defaultValue) {
    var hasDefaultValue = arguments.length >= 2;
    return function (source) {
        return source.pipe(predicate ? (0, filter_1.filter)(function (v, i) { return predicate(v, i, source); }) : identity_1.identity, (0, take_1.take)(1), hasDefaultValue ? (0, defaultIfEmpty_1.defaultIfEmpty)(defaultValue) : (0, throwIfEmpty_1.throwIfEmpty)(function () { return new EmptyError_1.EmptyError(); }));
    };
}
