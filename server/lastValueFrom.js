"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lastValueFrom = lastValueFrom;
var EmptyError_1 = require("./util/EmptyError");
/**
 * Converts an observable to a promise by subscribing to the observable,
 * waiting for it to complete, and resolving the returned promise with the
 * last value from the observed stream.
 *
 * If the observable stream completes before any values were emitted, the
 * returned promise will reject with {@link EmptyError} or will resolve
 * with the default value if a default was specified.
 *
 * If the observable stream emits an error, the returned promise will reject
 * with that error.
 *
 * **WARNING**: Only use this with observables you *know* will complete. If the source
 * observable does not complete, you will end up with a promise that is hung up, and
 * potentially all of the state of an async function hanging out in memory. To avoid
 * this situation, look into adding something like {@link timeout}, {@link take},
 * {@link takeWhile}, or {@link takeUntil} amongst others.
 *
 * ## Example
 *
 * Wait for the last value from a stream and emit it from a promise in
 * an async function
 *
 * ```ts
 * import { interval, take, lastValueFrom } from 'rxjs';
 *
 * async function execute() {
 *   const source$ = interval(2000).pipe(take(10));
 *   const finalNumber = await lastValueFrom(source$);
 *   console.log(`The final number is ${ finalNumber }`);
 * }
 *
 * execute();
 *
 * // Expected output:
 * // 'The final number is 9'
 * ```
 *
 * @see {@link firstValueFrom}
 *
 * @param source the observable to convert to a promise
 * @param config a configuration object to define the `defaultValue` to use if the source completes without emitting a value
 */
function lastValueFrom(source, config) {
    var hasConfig = typeof config === 'object';
    return new Promise(function (resolve, reject) {
        var _hasValue = false;
        var _value;
        source.subscribe({
            next: function (value) {
                _value = value;
                _hasValue = true;
            },
            error: reject,
            complete: function () {
                if (_hasValue) {
                    resolve(_value);
                }
                else if (hasConfig) {
                    resolve(config.defaultValue);
                }
                else {
                    reject(new EmptyError_1.EmptyError());
                }
            },
        });
    });
}
