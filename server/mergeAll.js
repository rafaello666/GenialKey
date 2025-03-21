"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeAll = mergeAll;
var mergeMap_1 = require("./mergeMap");
var identity_1 = require("../util/identity");
/**
 * Converts a higher-order Observable into a first-order Observable which
 * concurrently delivers all values that are emitted on the inner Observables.
 *
 * <span class="informal">Flattens an Observable-of-Observables.</span>
 *
 * ![](mergeAll.png)
 *
 * `mergeAll` subscribes to an Observable that emits Observables, also known as
 * a higher-order Observable. Each time it observes one of these emitted inner
 * Observables, it subscribes to that and delivers all the values from the
 * inner Observable on the output Observable. The output Observable only
 * completes once all inner Observables have completed. Any error delivered by
 * a inner Observable will be immediately emitted on the output Observable.
 *
 * ## Examples
 *
 * Spawn a new interval Observable for each click event, and blend their outputs as one Observable
 *
 * ```ts
 * import { fromEvent, map, interval, mergeAll } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const higherOrder = clicks.pipe(map(() => interval(1000)));
 * const firstOrder = higherOrder.pipe(mergeAll());
 *
 * firstOrder.subscribe(x => console.log(x));
 * ```
 *
 * Count from 0 to 9 every second for each click, but only allow 2 concurrent timers
 *
 * ```ts
 * import { fromEvent, map, interval, take, mergeAll } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const higherOrder = clicks.pipe(
 *   map(() => interval(1000).pipe(take(10)))
 * );
 * const firstOrder = higherOrder.pipe(mergeAll(2));
 *
 * firstOrder.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link combineLatestAll}
 * @see {@link concatAll}
 * @see {@link exhaustAll}
 * @see {@link merge}
 * @see {@link mergeMap}
 * @see {@link mergeMapTo}
 * @see {@link mergeScan}
 * @see {@link switchAll}
 * @see {@link switchMap}
 * @see {@link zipAll}
 *
 * @param concurrent Maximum number of inner Observables being subscribed to
 * concurrently.
 * @return A function that returns an Observable that emits values coming from
 * all the inner Observables emitted by the source Observable.
 */
function mergeAll(concurrent) {
    if (concurrent === void 0) { concurrent = Infinity; }
    return (0, mergeMap_1.mergeMap)(identity_1.identity, concurrent);
}
