"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequenceEqual = sequenceEqual;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var innerFrom_1 = require("../observable/innerFrom");
/**
 * Compares all values of two observables in sequence using an optional comparator function
 * and returns an observable of a single boolean value representing whether or not the two sequences
 * are equal.
 *
 * <span class="informal">Checks to see of all values emitted by both observables are equal, in order.</span>
 *
 * ![](sequenceEqual.png)
 *
 * `sequenceEqual` subscribes to source observable and `compareTo` `ObservableInput` (that internally
 * gets converted to an observable) and buffers incoming values from each observable. Whenever either
 * observable emits a value, the value is buffered and the buffers are shifted and compared from the bottom
 * up; If any value pair doesn't match, the returned observable will emit `false` and complete. If one of the
 * observables completes, the operator will wait for the other observable to complete; If the other
 * observable emits before completing, the returned observable will emit `false` and complete. If one observable never
 * completes or emits after the other completes, the returned observable will never complete.
 *
 * ## Example
 *
 * Figure out if the Konami code matches
 *
 * ```ts
 * import { from, fromEvent, map, bufferCount, mergeMap, sequenceEqual } from 'rxjs';
 *
 * const codes = from([
 *   'ArrowUp',
 *   'ArrowUp',
 *   'ArrowDown',
 *   'ArrowDown',
 *   'ArrowLeft',
 *   'ArrowRight',
 *   'ArrowLeft',
 *   'ArrowRight',
 *   'KeyB',
 *   'KeyA',
 *   'Enter', // no start key, clearly.
 * ]);
 *
 * const keys = fromEvent<KeyboardEvent>(document, 'keyup').pipe(map(e => e.code));
 * const matches = keys.pipe(
 *   bufferCount(11, 1),
 *   mergeMap(last11 => from(last11).pipe(sequenceEqual(codes)))
 * );
 * matches.subscribe(matched => console.log('Successful cheat at Contra? ', matched));
 * ```
 *
 * @see {@link combineLatest}
 * @see {@link zip}
 * @see {@link withLatestFrom}
 *
 * @param compareTo The `ObservableInput` sequence to compare the source sequence to.
 * @param comparator An optional function to compare each value pair.
 *
 * @return A function that returns an Observable that emits a single boolean
 * value representing whether or not the values emitted by the source
 * Observable and provided `ObservableInput` were equal in sequence.
 */
function sequenceEqual(compareTo, comparator) {
    if (comparator === void 0) { comparator = function (a, b) { return a === b; }; }
    return (0, lift_1.operate)(function (source, subscriber) {
        // The state for the source observable
        var aState = createState();
        // The state for the compareTo observable;
        var bState = createState();
        /** A utility to emit and complete */
        var emit = function (isEqual) {
            subscriber.next(isEqual);
            subscriber.complete();
        };
        /**
         * Creates a subscriber that subscribes to one of the sources, and compares its collected
         * state -- `selfState` -- to the other source's collected state -- `otherState`. This
         * is used for both streams.
         */
        var createSubscriber = function (selfState, otherState) {
            var sequenceEqualSubscriber = (0, OperatorSubscriber_1.createOperatorSubscriber)(subscriber, function (a) {
                var buffer = otherState.buffer, complete = otherState.complete;
                if (buffer.length === 0) {
                    // If there's no values in the other buffer
                    // and the other stream is complete, we know
                    // this isn't a match, because we got one more value.
                    // Otherwise, we push onto our buffer, so when the other
                    // stream emits, it can pull this value off our buffer and check it
                    // at the appropriate time.
                    complete ? emit(false) : selfState.buffer.push(a);
                }
                else {
                    // If the other stream *does* have values in its buffer,
                    // pull the oldest one off so we can compare it to what we
                    // just got. If it wasn't a match, emit `false` and complete.
                    !comparator(a, buffer.shift()) && emit(false);
                }
            }, function () {
                // Or observable completed
                selfState.complete = true;
                var complete = otherState.complete, buffer = otherState.buffer;
                // If the other observable is also complete, and there's
                // still stuff left in their buffer, it doesn't match, if their
                // buffer is empty, then it does match. This is because we can't
                // possibly get more values here anymore.
                complete && emit(buffer.length === 0);
                // Be sure to clean up our stream as soon as possible if we can.
                sequenceEqualSubscriber === null || sequenceEqualSubscriber === void 0 ? void 0 : sequenceEqualSubscriber.unsubscribe();
            });
            return sequenceEqualSubscriber;
        };
        // Subscribe to each source.
        source.subscribe(createSubscriber(aState, bState));
        (0, innerFrom_1.innerFrom)(compareTo).subscribe(createSubscriber(bState, aState));
    });
}
/**
 * Creates a simple structure that is used to represent
 * data used to test each sequence.
 */
function createState() {
    return {
        buffer: [],
        complete: false,
    };
}
