"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.concatMapTo = concatMapTo;
var concatMap_1 = require("./concatMap");
var isFunction_1 = require("../util/isFunction");
/**
 * Projects each source value to the same Observable which is merged multiple
 * times in a serialized fashion on the output Observable.
 *
 * <span class="informal">It's like {@link concatMap}, but maps each value
 * always to the same inner Observable.</span>
 *
 * ![](concatMapTo.png)
 *
 * Maps each source value to the given Observable `innerObservable` regardless
 * of the source value, and then flattens those resulting Observables into one
 * single Observable, which is the output Observable. Each new `innerObservable`
 * instance emitted on the output Observable is concatenated with the previous
 * `innerObservable` instance.
 *
 * __Warning:__ if source values arrive endlessly and faster than their
 * corresponding inner Observables can complete, it will result in memory issues
 * as inner Observables amass in an unbounded buffer waiting for their turn to
 * be subscribed to.
 *
 * Note: `concatMapTo` is equivalent to `mergeMapTo` with concurrency parameter
 * set to `1`.
 *
 * ## Example
 *
 * For each click event, tick every second from 0 to 3, with no concurrency
 *
 * ```ts
 * import { fromEvent, concatMapTo, interval, take } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(
 *   concatMapTo(interval(1000).pipe(take(4)))
 * );
 * result.subscribe(x => console.log(x));
 *
 * // Results in the following:
 * // (results are not concurrent)
 * // For every click on the "document" it will emit values 0 to 3 spaced
 * // on a 1000ms interval
 * // one click = 1000ms-> 0 -1000ms-> 1 -1000ms-> 2 -1000ms-> 3
 * ```
 *
 * @see {@link concat}
 * @see {@link concatAll}
 * @see {@link concatMap}
 * @see {@link mergeMapTo}
 * @see {@link switchMapTo}
 *
 * @param innerObservable An `ObservableInput` to replace each value from the
 * source Observable.
 * @return A function that returns an Observable of values merged together by
 * joining the passed Observable with itself, one after the other, for each
 * value emitted from the source.
 * @deprecated Will be removed in v9. Use {@link concatMap} instead: `concatMap(() => result)`
 */
function concatMapTo(innerObservable, resultSelector) {
    return (0, isFunction_1.isFunction)(resultSelector) ? (0, concatMap_1.concatMap)(function () { return innerObservable; }, resultSelector) : (0, concatMap_1.concatMap)(function () { return innerObservable; });
}
