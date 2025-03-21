"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.of = of;
var args_1 = require("../util/args");
var from_1 = require("./from");
/**
 * Converts the arguments to an observable sequence.
 *
 * <span class="informal">Each argument becomes a `next` notification.</span>
 *
 * ![](of.png)
 *
 * Unlike {@link from}, it does not do any flattening and emits each argument in whole
 * as a separate `next` notification.
 *
 * ## Examples
 *
 * Emit the values `10, 20, 30`
 *
 * ```ts
 * import { of } from 'rxjs';
 *
 * of(10, 20, 30)
 *   .subscribe({
 *     next: value => console.log('next:', value),
 *     error: err => console.log('error:', err),
 *     complete: () => console.log('the end'),
 *   });
 *
 * // Outputs
 * // next: 10
 * // next: 20
 * // next: 30
 * // the end
 * ```
 *
 * Emit the array `[1, 2, 3]`
 *
 * ```ts
 * import { of } from 'rxjs';
 *
 * of([1, 2, 3])
 *   .subscribe({
 *     next: value => console.log('next:', value),
 *     error: err => console.log('error:', err),
 *     complete: () => console.log('the end'),
 *   });
 *
 * // Outputs
 * // next: [1, 2, 3]
 * // the end
 * ```
 *
 * @see {@link from}
 * @see {@link range}
 *
 * @param args A comma separated list of arguments you want to be emitted.
 * @return An Observable that synchronously emits the arguments described
 * above and then immediately completes.
 */
function of() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var scheduler = (0, args_1.popScheduler)(args);
    return (0, from_1.from)(args, scheduler);
}
