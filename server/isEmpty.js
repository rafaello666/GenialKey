"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmpty = isEmpty;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
/**
 * Emits `false` if the input Observable emits any values, or emits `true` if the
 * input Observable completes without emitting any values.
 *
 * <span class="informal">Tells whether any values are emitted by an Observable.</span>
 *
 * ![](isEmpty.png)
 *
 * `isEmpty` transforms an Observable that emits values into an Observable that
 * emits a single boolean value representing whether or not any values were
 * emitted by the source Observable. As soon as the source Observable emits a
 * value, `isEmpty` will emit a `false` and complete.  If the source Observable
 * completes having not emitted anything, `isEmpty` will emit a `true` and
 * complete.
 *
 * A similar effect could be achieved with {@link count}, but `isEmpty` can emit
 * a `false` value sooner.
 *
 * ## Examples
 *
 * Emit `false` for a non-empty Observable
 *
 * ```ts
 * import { Subject, isEmpty } from 'rxjs';
 *
 * const source = new Subject<string>();
 * const result = source.pipe(isEmpty());
 *
 * source.subscribe(x => console.log(x));
 * result.subscribe(x => console.log(x));
 *
 * source.next('a');
 * source.next('b');
 * source.next('c');
 * source.complete();
 *
 * // Outputs
 * // 'a'
 * // false
 * // 'b'
 * // 'c'
 * ```
 *
 * Emit `true` for an empty Observable
 *
 * ```ts
 * import { EMPTY, isEmpty } from 'rxjs';
 *
 * const result = EMPTY.pipe(isEmpty());
 * result.subscribe(x => console.log(x));
 *
 * // Outputs
 * // true
 * ```
 *
 * @see {@link count}
 * @see {@link EMPTY}
 *
 * @return A function that returns an Observable that emits boolean value
 * indicating whether the source Observable was empty or not.
 */
function isEmpty() {
    return (0, lift_1.operate)(function (source, subscriber) {
        source.subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function () {
            subscriber.next(false);
            subscriber.complete();
        }, function () {
            subscriber.next(true);
            subscriber.complete();
        }));
    });
}
