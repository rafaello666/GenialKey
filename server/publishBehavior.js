"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishBehavior = publishBehavior;
var BehaviorSubject_1 = require("../BehaviorSubject");
var ConnectableObservable_1 = require("../observable/ConnectableObservable");
/**
 * Creates a {@link ConnectableObservable} that utilizes a {@link BehaviorSubject}.
 *
 * @param initialValue The initial value passed to the {@link BehaviorSubject}.
 * @return A function that returns a {@link ConnectableObservable}
 * @deprecated Will be removed in v8. To create a connectable observable that uses a
 * {@link BehaviorSubject} under the hood, use {@link connectable}.
 * `source.pipe(publishBehavior(initValue))` is equivalent to
 * `connectable(source, { connector: () => new BehaviorSubject(initValue), resetOnDisconnect: false })`.
 * If you're using {@link refCount} after `publishBehavior`, use the {@link share} operator instead.
 * `source.pipe(publishBehavior(initValue), refCount())` is equivalent to
 * `source.pipe(share({ connector: () => new BehaviorSubject(initValue), resetOnError: false, resetOnComplete: false, resetOnRefCountZero: false  }))`.
 * Details: https://rxjs.dev/deprecations/multicasting
 */
function publishBehavior(initialValue) {
    // Note that this has *never* supported the selector function.
    return function (source) {
        var subject = new BehaviorSubject_1.BehaviorSubject(initialValue);
        return new ConnectableObservable_1.ConnectableObservable(source, function () { return subject; });
    };
}
