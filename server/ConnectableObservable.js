"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectableObservable = void 0;
var Observable_1 = require("../Observable");
var Subscription_1 = require("../Subscription");
var refCount_1 = require("../operators/refCount");
var OperatorSubscriber_1 = require("../operators/OperatorSubscriber");
var lift_1 = require("../util/lift");
/**
 * @class ConnectableObservable<T>
 * @deprecated Will be removed in v8. Use {@link connectable} to create a connectable observable.
 * If you are using the `refCount` method of `ConnectableObservable`, use the {@link share} operator
 * instead.
 * Details: https://rxjs.dev/deprecations/multicasting
 */
var ConnectableObservable = /** @class */ (function (_super) {
    __extends(ConnectableObservable, _super);
    /**
     * @param source The source observable
     * @param subjectFactory The factory that creates the subject used internally.
     * @deprecated Will be removed in v8. Use {@link connectable} to create a connectable observable.
     * `new ConnectableObservable(source, factory)` is equivalent to
     * `connectable(source, { connector: factory })`.
     * When the `refCount()` method is needed, the {@link share} operator should be used instead:
     * `new ConnectableObservable(source, factory).refCount()` is equivalent to
     * `source.pipe(share({ connector: factory }))`.
     * Details: https://rxjs.dev/deprecations/multicasting
     */
    function ConnectableObservable(source, subjectFactory) {
        var _this = _super.call(this) || this;
        _this.source = source;
        _this.subjectFactory = subjectFactory;
        _this._subject = null;
        _this._refCount = 0;
        _this._connection = null;
        // If we have lift, monkey patch that here. This is done so custom observable
        // types will compose through multicast. Otherwise the resulting observable would
        // simply be an instance of `ConnectableObservable`.
        if ((0, lift_1.hasLift)(source)) {
            _this.lift = source.lift;
        }
        return _this;
    }
    /** @internal */
    ConnectableObservable.prototype._subscribe = function (subscriber) {
        return this.getSubject().subscribe(subscriber);
    };
    ConnectableObservable.prototype.getSubject = function () {
        var subject = this._subject;
        if (!subject || subject.isStopped) {
            this._subject = this.subjectFactory();
        }
        return this._subject;
    };
    ConnectableObservable.prototype._teardown = function () {
        this._refCount = 0;
        var _connection = this._connection;
        this._subject = this._connection = null;
        _connection === null || _connection === void 0 ? void 0 : _connection.unsubscribe();
    };
    /**
     * @deprecated {@link ConnectableObservable} will be removed in v8. Use {@link connectable} instead.
     * Details: https://rxjs.dev/deprecations/multicasting
     */
    ConnectableObservable.prototype.connect = function () {
        var _this = this;
        var connection = this._connection;
        if (!connection) {
            connection = this._connection = new Subscription_1.Subscription();
            var subject_1 = this.getSubject();
            connection.add(this.source.subscribe((0, OperatorSubscriber_1.createOperatorSubscriber)(subject_1, undefined, function () {
                _this._teardown();
                subject_1.complete();
            }, function (err) {
                _this._teardown();
                subject_1.error(err);
            }, function () { return _this._teardown(); })));
            if (connection.closed) {
                this._connection = null;
                connection = Subscription_1.Subscription.EMPTY;
            }
        }
        return connection;
    };
    /**
     * @deprecated {@link ConnectableObservable} will be removed in v8. Use the {@link share} operator instead.
     * Details: https://rxjs.dev/deprecations/multicasting
     */
    ConnectableObservable.prototype.refCount = function () {
        return (0, refCount_1.refCount)()(this);
    };
    return ConnectableObservable;
}(Observable_1.Observable));
exports.ConnectableObservable = ConnectableObservable;
