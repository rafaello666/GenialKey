"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = exports.NotificationKind = void 0;
exports.observeNotification = observeNotification;
var empty_1 = require("./observable/empty");
var of_1 = require("./observable/of");
var throwError_1 = require("./observable/throwError");
var isFunction_1 = require("./util/isFunction");
// TODO: When this enum is removed, replace it with a type alias. See #4556.
/**
 * @deprecated Use a string literal instead. `NotificationKind` will be replaced with a type alias in v8.
 * It will not be replaced with a const enum as those are not compatible with isolated modules.
 */
var NotificationKind;
(function (NotificationKind) {
    NotificationKind["NEXT"] = "N";
    NotificationKind["ERROR"] = "E";
    NotificationKind["COMPLETE"] = "C";
})(NotificationKind || (exports.NotificationKind = NotificationKind = {}));
/**
 * Represents a push-based event or value that an {@link Observable} can emit.
 * This class is particularly useful for operators that manage notifications,
 * like {@link materialize}, {@link dematerialize}, {@link observeOn}, and
 * others. Besides wrapping the actual delivered value, it also annotates it
 * with metadata of, for instance, what type of push message it is (`next`,
 * `error`, or `complete`).
 *
 * @see {@link materialize}
 * @see {@link dematerialize}
 * @see {@link observeOn}
 * @deprecated It is NOT recommended to create instances of `Notification` directly.
 * Rather, try to create POJOs matching the signature outlined in {@link ObservableNotification}.
 * For example: `{ kind: 'N', value: 1 }`, `{ kind: 'E', error: new Error('bad') }`, or `{ kind: 'C' }`.
 * Will be removed in v8.
 */
var Notification = /** @class */ (function () {
    function Notification(kind, value, error) {
        this.kind = kind;
        this.value = value;
        this.error = error;
        this.hasValue = kind === 'N';
    }
    /**
     * Executes the appropriate handler on a passed `observer` given the `kind` of notification.
     * If the handler is missing it will do nothing. Even if the notification is an error, if
     * there is no error handler on the observer, an error will not be thrown, it will noop.
     * @param observer The observer to notify.
     */
    Notification.prototype.observe = function (observer) {
        return observeNotification(this, observer);
    };
    Notification.prototype.do = function (nextHandler, errorHandler, completeHandler) {
        var _a = this, kind = _a.kind, value = _a.value, error = _a.error;
        return kind === 'N' ? nextHandler === null || nextHandler === void 0 ? void 0 : nextHandler(value) : kind === 'E' ? errorHandler === null || errorHandler === void 0 ? void 0 : errorHandler(error) : completeHandler === null || completeHandler === void 0 ? void 0 : completeHandler();
    };
    Notification.prototype.accept = function (nextOrObserver, error, complete) {
        return (0, isFunction_1.isFunction)(nextOrObserver === null || nextOrObserver === void 0 ? void 0 : nextOrObserver.next)
            ? this.observe(nextOrObserver)
            : this.do(nextOrObserver, error, complete);
    };
    /**
     * Returns a simple Observable that just delivers the notification represented
     * by this Notification instance.
     *
     * @deprecated Will be removed in v8. To convert a `Notification` to an {@link Observable},
     * use {@link of} and {@link dematerialize}: `of(notification).pipe(dematerialize())`.
     */
    Notification.prototype.toObservable = function () {
        var _a = this, kind = _a.kind, value = _a.value, error = _a.error;
        // Select the observable to return by `kind`
        var result = kind === 'N'
            ? // Next kind. Return an observable of that value.
                (0, of_1.of)(value)
            : //
                kind === 'E'
                    ? // Error kind. Return an observable that emits the error.
                        (0, throwError_1.throwError)(function () { return error; })
                    : //
                        kind === 'C'
                            ? // Completion kind. Kind is "C", return an observable that just completes.
                                empty_1.EMPTY
                            : // Unknown kind, return falsy, so we error below.
                                0;
        if (!result) {
            // TODO: consider removing this check. The only way to cause this would be to
            // use the Notification constructor directly in a way that is not type-safe.
            // and direct use of the Notification constructor is deprecated.
            throw new TypeError("Unexpected notification kind ".concat(kind));
        }
        return result;
    };
    /**
     * A shortcut to create a Notification instance of the type `next` from a
     * given value.
     * @param value The `next` value.
     * @return The "next" Notification representing the argument.
     * @deprecated It is NOT recommended to create instances of `Notification` directly.
     * Rather, try to create POJOs matching the signature outlined in {@link ObservableNotification}.
     * For example: `{ kind: 'N', value: 1 }`, `{ kind: 'E', error: new Error('bad') }`, or `{ kind: 'C' }`.
     * Will be removed in v8.
     */
    Notification.createNext = function (value) {
        return new Notification('N', value);
    };
    /**
     * A shortcut to create a Notification instance of the type `error` from a
     * given error.
     * @param err The `error` error.
     * @return The "error" Notification representing the argument.
     * @deprecated It is NOT recommended to create instances of `Notification` directly.
     * Rather, try to create POJOs matching the signature outlined in {@link ObservableNotification}.
     * For example: `{ kind: 'N', value: 1 }`, `{ kind: 'E', error: new Error('bad') }`, or `{ kind: 'C' }`.
     * Will be removed in v8.
     */
    Notification.createError = function (err) {
        return new Notification('E', undefined, err);
    };
    /**
     * A shortcut to create a Notification instance of the type `complete`.
     * @return The valueless "complete" Notification.
     * @deprecated It is NOT recommended to create instances of `Notification` directly.
     * Rather, try to create POJOs matching the signature outlined in {@link ObservableNotification}.
     * For example: `{ kind: 'N', value: 1 }`, `{ kind: 'E', error: new Error('bad') }`, or `{ kind: 'C' }`.
     * Will be removed in v8.
     */
    Notification.createComplete = function () {
        return Notification.completeNotification;
    };
    Notification.completeNotification = new Notification('C');
    return Notification;
}());
exports.Notification = Notification;
/**
 * Executes the appropriate handler on a passed `observer` given the `kind` of notification.
 * If the handler is missing it will do nothing. Even if the notification is an error, if
 * there is no error handler on the observer, an error will not be thrown, it will noop.
 * @param notification The notification object to observe.
 * @param observer The observer to notify.
 */
function observeNotification(notification, observer) {
    var _a, _b, _c;
    var _d = notification, kind = _d.kind, value = _d.value, error = _d.error;
    if (typeof kind !== 'string') {
        throw new TypeError('Invalid notification, missing "kind"');
    }
    kind === 'N' ? (_a = observer.next) === null || _a === void 0 ? void 0 : _a.call(observer, value) : kind === 'E' ? (_b = observer.error) === null || _b === void 0 ? void 0 : _b.call(observer, error) : (_c = observer.complete) === null || _c === void 0 ? void 0 : _c.call(observer);
}
