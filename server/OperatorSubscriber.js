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
exports.OperatorSubscriber = void 0;
exports.createOperatorSubscriber = createOperatorSubscriber;
var Subscriber_1 = require("../Subscriber");
/**
 * Creates an instance of an `OperatorSubscriber`.
 * @param destination The downstream subscriber.
 * @param onNext Handles next values, only called if this subscriber is not stopped or closed. Any
 * error that occurs in this function is caught and sent to the `error` method of this subscriber.
 * @param onError Handles errors from the subscription, any errors that occur in this handler are caught
 * and send to the `destination` error handler.
 * @param onComplete Handles completion notification from the subscription. Any errors that occur in
 * this handler are sent to the `destination` error handler.
 * @param onFinalize Additional teardown logic here. This will only be called on teardown if the
 * subscriber itself is not already closed. This is called after all other teardown logic is executed.
 */
function createOperatorSubscriber(destination, onNext, onComplete, onError, onFinalize) {
    return new OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize);
}
/**
 * A generic helper for allowing operators to be created with a Subscriber and
 * use closures to capture necessary state from the operator function itself.
 */
var OperatorSubscriber = /** @class */ (function (_super) {
    __extends(OperatorSubscriber, _super);
    /**
     * Creates an instance of an `OperatorSubscriber`.
     * @param destination The downstream subscriber.
     * @param onNext Handles next values, only called if this subscriber is not stopped or closed. Any
     * error that occurs in this function is caught and sent to the `error` method of this subscriber.
     * @param onError Handles errors from the subscription, any errors that occur in this handler are caught
     * and send to the `destination` error handler.
     * @param onComplete Handles completion notification from the subscription. Any errors that occur in
     * this handler are sent to the `destination` error handler.
     * @param onFinalize Additional finalization logic here. This will only be called on finalization if the
     * subscriber itself is not already closed. This is called after all other finalization logic is executed.
     * @param shouldUnsubscribe An optional check to see if an unsubscribe call should truly unsubscribe.
     * NOTE: This currently **ONLY** exists to support the strange behavior of {@link groupBy}, where unsubscription
     * to the resulting observable does not actually disconnect from the source if there are active subscriptions
     * to any grouped observable. (DO NOT EXPOSE OR USE EXTERNALLY!!!)
     */
    function OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize, shouldUnsubscribe) {
        // It's important - for performance reasons - that all of this class's
        // members are initialized and that they are always initialized in the same
        // order. This will ensure that all OperatorSubscriber instances have the
        // same hidden class in V8. This, in turn, will help keep the number of
        // hidden classes involved in property accesses within the base class as
        // low as possible. If the number of hidden classes involved exceeds four,
        // the property accesses will become megamorphic and performance penalties
        // will be incurred - i.e. inline caches won't be used.
        //
        // The reasons for ensuring all instances have the same hidden class are
        // further discussed in this blog post from Benedikt Meurer:
        // https://benediktmeurer.de/2018/03/23/impact-of-polymorphism-on-component-based-frameworks-like-react/
        var _this = _super.call(this, destination) || this;
        _this.onFinalize = onFinalize;
        _this.shouldUnsubscribe = shouldUnsubscribe;
        _this._next = onNext
            ? function (value) {
                try {
                    onNext(value);
                }
                catch (err) {
                    destination.error(err);
                }
            }
            : _super.prototype._next;
        _this._error = onError
            ? function (err) {
                try {
                    onError(err);
                }
                catch (err) {
                    // Send any errors that occur down stream.
                    destination.error(err);
                }
                finally {
                    // Ensure finalization.
                    this.unsubscribe();
                }
            }
            : _super.prototype._error;
        _this._complete = onComplete
            ? function () {
                try {
                    onComplete();
                }
                catch (err) {
                    // Send any errors that occur down stream.
                    destination.error(err);
                }
                finally {
                    // Ensure finalization.
                    this.unsubscribe();
                }
            }
            : _super.prototype._complete;
        return _this;
    }
    OperatorSubscriber.prototype.unsubscribe = function () {
        var _a;
        if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
            var closed_1 = this.closed;
            _super.prototype.unsubscribe.call(this);
            // Execute additional teardown if we have any and we didn't already do so.
            !closed_1 && ((_a = this.onFinalize) === null || _a === void 0 ? void 0 : _a.call(this));
        }
    };
    return OperatorSubscriber;
}(Subscriber_1.Subscriber));
exports.OperatorSubscriber = OperatorSubscriber;
