"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exhaustMap = exhaustMap;
var map_1 = require("./map");
var innerFrom_1 = require("../observable/innerFrom");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
/* tslint:enable:max-line-length */
/**
 * Projects each source value to an Observable which is merged in the output
 * Observable only if the previous projected Observable has completed.
 *
 * <span class="informal">Maps each value to an Observable, then flattens all of
 * these inner Observables using {@link exhaustAll}.</span>
 *
 * ![](exhaustMap.png)
 *
 * Returns an Observable that emits items based on applying a function that you
 * supply to each item emitted by the source Observable, where that function
 * returns an (so-called "inner") Observable. When it projects a source value to
 * an Observable, the output Observable begins emitting the items emitted by
 * that projected Observable. However, `exhaustMap` ignores every new projected
 * Observable if the previous projected Observable has not yet completed. Once
 * that one completes, it will accept and flatten the next projected Observable
 * and repeat this process.
 *
 * ## Example
 *
 * Run a finite timer for each click, only if there is no currently active timer
 *
 * ```ts
 * import { fromEvent, exhaustMap, interval, take } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(
 *   exhaustMap(() => interval(1000).pipe(take(5)))
 * );
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link concatMap}
 * @see {@link exhaust}
 * @see {@link mergeMap}
 * @see {@link switchMap}
 *
 * @param project A function that, when applied to an item emitted by the source
 * Observable, returns an Observable.
 * @return A function that returns an Observable containing projected
 * Observables of each item of the source, ignoring projected Observables that
 * start before their preceding Observable has completed.
 */
function exhaustMap(project, resultSelector) {
    if (resultSelector) {
        // DEPRECATED PATH
        return function (source) {
            return source.pipe(exhaustMap(function (a, i) { return (0, innerFrom_1.innerFrom)(project(a, i)).pipe((0, map_1.map)(function (b, ii) { return resultSelector(a, b, i, ii); })); }));
        };
    }
    return (0, lift_1.operate)(function (source, subscriber) {
        var index = 0;
        var innerSub = null;
        var isComplete = false;
        source.subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function (outerValue) {
            if (!innerSub) {
                innerSub = (0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, undefined, function () {
                    innerSub = null;
                    isComplete && subscriber.complete();
                });
                (0, innerFrom_1.innerFrom)(project(outerValue, index++)).subscribe(innerSub);
            }
        }, function () {
            isComplete = true;
            !innerSub && subscriber.complete();
        }));
    });
}
