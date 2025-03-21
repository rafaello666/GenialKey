"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.distinctUntilKeyChanged = distinctUntilKeyChanged;
var distinctUntilChanged_1 = require("./distinctUntilChanged");
/**
 * Returns an Observable that emits all items emitted by the source Observable that
 * are distinct by comparison from the previous item, using a property accessed by
 * using the key provided to check if the two items are distinct.
 *
 * If a comparator function is provided, then it will be called for each item to
 * test for whether that value should be emitted or not.
 *
 * If a comparator function is not provided, an equality check is used by default.
 *
 * ## Examples
 *
 * An example comparing the name of persons
 *
 * ```ts
 * import { of, distinctUntilKeyChanged } from 'rxjs';
 *
 * of(
 *   { age: 4, name: 'Foo' },
 *   { age: 7, name: 'Bar' },
 *   { age: 5, name: 'Foo' },
 *   { age: 6, name: 'Foo' }
 * ).pipe(
 *   distinctUntilKeyChanged('name')
 * )
 * .subscribe(x => console.log(x));
 *
 * // displays:
 * // { age: 4, name: 'Foo' }
 * // { age: 7, name: 'Bar' }
 * // { age: 5, name: 'Foo' }
 * ```
 *
 * An example comparing the first letters of the name
 *
 * ```ts
 * import { of, distinctUntilKeyChanged } from 'rxjs';
 *
 * of(
 *   { age: 4, name: 'Foo1' },
 *   { age: 7, name: 'Bar' },
 *   { age: 5, name: 'Foo2' },
 *   { age: 6, name: 'Foo3' }
 * ).pipe(
 *   distinctUntilKeyChanged('name', (x, y) => x.substring(0, 3) === y.substring(0, 3))
 * )
 * .subscribe(x => console.log(x));
 *
 * // displays:
 * // { age: 4, name: 'Foo1' }
 * // { age: 7, name: 'Bar' }
 * // { age: 5, name: 'Foo2' }
 * ```
 *
 * @see {@link distinct}
 * @see {@link distinctUntilChanged}
 *
 * @param key String key for object property lookup on each item.
 * @param compare Optional comparison function called to test if an item is distinct
 * from the previous item in the source.
 * @return A function that returns an Observable that emits items from the source
 * Observable with distinct values based on the key specified.
 */
function distinctUntilKeyChanged(key, compare) {
    return (0, distinctUntilChanged_1.distinctUntilChanged)(function (x, y) { return (compare ? compare(x[key], y[key]) : x[key] === y[key]); });
}
