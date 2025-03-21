"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Observable = void 0;
var Subscriber_1 = require("./Subscriber");
var Subscription_1 = require("./Subscription");
var observable_1 = require("./symbol/observable");
var pipe_1 = require("./util/pipe");
var config_1 = require("./config");
var isFunction_1 = require("./util/isFunction");
var errorContext_1 = require("./util/errorContext");
/**
 * A representation of any set of values over any amount of time. This is the most basic building block
 * of RxJS.
 */
var Observable = /** @class */ (function () {
    /**
     * @param subscribe The function that is called when the Observable is
     * initially subscribed to. This function is given a Subscriber, to which new values
     * can be `next`ed, or an `error` method can be called to raise an error, or
     * `complete` can be called to notify of a successful completion.
     */
    function Observable(subscribe) {
        if (subscribe) {
            this._subscribe = subscribe;
        }
    }
    /**
     * Creates a new Observable, with this Observable instance as the source, and the passed
     * operator defined as the new observable's operator.
     * @param operator the operator defining the operation to take on the observable
     * @return A new observable with the Operator applied.
     * @deprecated Internal implementation detail, do not use directly. Will be made internal in v8.
     * If you have implemented an operator using `lift`, it is recommended that you create an
     * operator by simply returning `new Observable()` directly. See "Creating new operators from
     * scratch" section here: https://rxjs.dev/guide/operators
     */
    Observable.prototype.lift = function (operator) {
        var observable = new Observable();
        observable.source = this;
        observable.operator = operator;
        return observable;
    };
    /**
     * Invokes an execution of an Observable and registers Observer handlers for notifications it will emit.
     *
     * <span class="informal">Use it when you have all these Observables, but still nothing is happening.</span>
     *
     * `subscribe` is not a regular operator, but a method that calls Observable's internal `subscribe` function. It
     * might be for example a function that you passed to Observable's constructor, but most of the time it is
     * a library implementation, which defines what will be emitted by an Observable, and when it be will emitted. This means
     * that calling `subscribe` is actually the moment when Observable starts its work, not when it is created, as it is often
     * the thought.
     *
     * Apart from starting the execution of an Observable, this method allows you to listen for values
     * that an Observable emits, as well as for when it completes or errors. You can achieve this in two
     * of the following ways.
     *
     * The first way is creating an object that implements {@link Observer} interface. It should have methods
     * defined by that interface, but note that it should be just a regular JavaScript object, which you can create
     * yourself in any way you want (ES6 class, classic function constructor, object literal etc.). In particular, do
     * not attempt to use any RxJS implementation details to create Observers - you don't need them. Remember also
     * that your object does not have to implement all methods. If you find yourself creating a method that doesn't
     * do anything, you can simply omit it. Note however, if the `error` method is not provided and an error happens,
     * it will be thrown asynchronously. Errors thrown asynchronously cannot be caught using `try`/`catch`. Instead,
     * use the {@link onUnhandledError} configuration option or use a runtime handler (like `window.onerror` or
     * `process.on('error)`) to be notified of unhandled errors. Because of this, it's recommended that you provide
     * an `error` method to avoid missing thrown errors.
     *
     * The second way is to give up on Observer object altogether and simply provide callback functions in place of its methods.
     * This means you can provide three functions as arguments to `subscribe`, where the first function is equivalent
     * of a `next` method, the second of an `error` method and the third of a `complete` method. Just as in case of an Observer,
     * if you do not need to listen for something, you can omit a function by passing `undefined` or `null`,
     * since `subscribe` recognizes these functions by where they were placed in function call. When it comes
     * to the `error` function, as with an Observer, if not provided, errors emitted by an Observable will be thrown asynchronously.
     *
     * You can, however, subscribe with no parameters at all. This may be the case where you're not interested in terminal events
     * and you also handled emissions internally by using operators (e.g. using `tap`).
     *
     * Whichever style of calling `subscribe` you use, in both cases it returns a Subscription object.
     * This object allows you to call `unsubscribe` on it, which in turn will stop the work that an Observable does and will clean
     * up all resources that an Observable used. Note that cancelling a subscription will not call `complete` callback
     * provided to `subscribe` function, which is reserved for a regular completion signal that comes from an Observable.
     *
     * Remember that callbacks provided to `subscribe` are not guaranteed to be called asynchronously.
     * It is an Observable itself that decides when these functions will be called. For example {@link of}
     * by default emits all its values synchronously. Always check documentation for how given Observable
     * will behave when subscribed and if its default behavior can be modified with a `scheduler`.
     *
     * #### Examples
     *
     * Subscribe with an {@link guide/observer Observer}
     *
     * ```ts
     * import { of } from 'rxjs';
     *
     * const sumObserver = {
     *   sum: 0,
     *   next(value) {
     *     console.log('Adding: ' + value);
     *     this.sum = this.sum + value;
     *   },
     *   error() {
     *     // We actually could just remove this method,
     *     // since we do not really care about errors right now.
     *   },
     *   complete() {
     *     console.log('Sum equals: ' + this.sum);
     *   }
     * };
     *
     * of(1, 2, 3) // Synchronously emits 1, 2, 3 and then completes.
     *   .subscribe(sumObserver);
     *
     * // Logs:
     * // 'Adding: 1'
     * // 'Adding: 2'
     * // 'Adding: 3'
     * // 'Sum equals: 6'
     * ```
     *
     * Subscribe with functions ({@link deprecations/subscribe-arguments deprecated})
     *
     * ```ts
     * import { of } from 'rxjs'
     *
     * let sum = 0;
     *
     * of(1, 2, 3).subscribe(
     *   value => {
     *     console.log('Adding: ' + value);
     *     sum = sum + value;
     *   },
     *   undefined,
     *   () => console.log('Sum equals: ' + sum)
     * );
     *
     * // Logs:
     * // 'Adding: 1'
     * // 'Adding: 2'
     * // 'Adding: 3'
     * // 'Sum equals: 6'
     * ```
     *
     * Cancel a subscription
     *
     * ```ts
     * import { interval } from 'rxjs';
     *
     * const subscription = interval(1000).subscribe({
     *   next(num) {
     *     console.log(num)
     *   },
     *   complete() {
     *     // Will not be called, even when cancelling subscription.
     *     console.log('completed!');
     *   }
     * });
     *
     * setTimeout(() => {
     *   subscription.unsubscribe();
     *   console.log('unsubscribed!');
     * }, 2500);
     *
     * // Logs:
     * // 0 after 1s
     * // 1 after 2s
     * // 'unsubscribed!' after 2.5s
     * ```
     *
     * @param observerOrNext Either an {@link Observer} with some or all callback methods,
     * or the `next` handler that is called for each value emitted from the subscribed Observable.
     * @param error A handler for a terminal event resulting from an error. If no error handler is provided,
     * the error will be thrown asynchronously as unhandled.
     * @param complete A handler for a terminal event resulting from successful completion.
     * @return A subscription reference to the registered handlers.
     */
    Observable.prototype.subscribe = function (observerOrNext, error, complete) {
        var _this = this;
        var subscriber = isSubscriber(observerOrNext) ? observerOrNext : new Subscriber_1.SafeSubscriber(observerOrNext, error, complete);
        (0, errorContext_1.errorContext)(function () {
            var _a = _this, operator = _a.operator, source = _a.source;
            subscriber.add(operator
                ? // We're dealing with a subscription in the
                    // operator chain to one of our lifted operators.
                    operator.call(subscriber, source)
                : source
                    ? // If `source` has a value, but `operator` does not, something that
                        // had intimate knowledge of our API, like our `Subject`, must have
                        // set it. We're going to just call `_subscribe` directly.
                        _this._subscribe(subscriber)
                    : // In all other cases, we're likely wrapping a user-provided initializer
                        // function, so we need to catch errors and handle them appropriately.
                        _this._trySubscribe(subscriber));
        });
        return subscriber;
    };
    /** @internal */
    Observable.prototype._trySubscribe = function (sink) {
        try {
            return this._subscribe(sink);
        }
        catch (err) {
            // We don't need to return anything in this case,
            // because it's just going to try to `add()` to a subscription
            // above.
            sink.error(err);
        }
    };
    Observable.prototype.forEach = function (next, promiseCtor) {
        var _this = this;
        promiseCtor = getPromiseCtor(promiseCtor);
        return new promiseCtor(function (resolve, reject) {
            var subscriber = new Subscriber_1.SafeSubscriber({
                next: function (value) {
                    try {
                        next(value);
                    }
                    catch (err) {
                        reject(err);
                        subscriber.unsubscribe();
                    }
                },
                error: reject,
                complete: resolve,
            });
            _this.subscribe(subscriber);
        });
    };
    /** @internal */
    Observable.prototype._subscribe = function (subscriber) {
        var _a;
        return (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber);
    };
    /**
     * An interop point defined by the es7-observable spec https://github.com/zenparsing/es-observable
     * @return This instance of the observable.
     */
    Observable.prototype[observable_1.observable] = function () {
        return this;
    };
    /* tslint:enable:max-line-length */
    /**
     * Used to stitch together functional operators into a chain.
     *
     * ## Example
     *
     * ```ts
     * import { interval, filter, map, scan } from 'rxjs';
     *
     * interval(1000)
     *   .pipe(
     *     filter(x => x % 2 === 0),
     *     map(x => x + x),
     *     scan((acc, x) => acc + x)
     *   )
     *   .subscribe(x => console.log(x));
     * ```
     *
     * @return The Observable result of all the operators having been called
     * in the order they were passed in.
     */
    Observable.prototype.pipe = function () {
        var operations = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            operations[_i] = arguments[_i];
        }
        return (0, pipe_1.pipeFromArray)(operations)(this);
    };
    /* tslint:enable:max-line-length */
    /**
     * Subscribe to this Observable and get a Promise resolving on
     * `complete` with the last emission (if any).
     *
     * **WARNING**: Only use this with observables you *know* will complete. If the source
     * observable does not complete, you will end up with a promise that is hung up, and
     * potentially all of the state of an async function hanging out in memory. To avoid
     * this situation, look into adding something like {@link timeout}, {@link take},
     * {@link takeWhile}, or {@link takeUntil} amongst others.
     *
     * @param [promiseCtor] a constructor function used to instantiate
     * the Promise
     * @return A Promise that resolves with the last value emit, or
     * rejects on an error. If there were no emissions, Promise
     * resolves with undefined.
     * @deprecated Replaced with {@link firstValueFrom} and {@link lastValueFrom}. Will be removed in v8. Details: https://rxjs.dev/deprecations/to-promise
     */
    Observable.prototype.toPromise = function (promiseCtor) {
        var _this = this;
        promiseCtor = getPromiseCtor(promiseCtor);
        return new promiseCtor(function (resolve, reject) {
            var value;
            _this.subscribe(function (x) { return (value = x); }, function (err) { return reject(err); }, function () { return resolve(value); });
        });
    };
    // HACK: Since TypeScript inherits static properties too, we have to
    // fight against TypeScript here so Subject can have a different static create signature
    /**
     * Creates a new Observable by calling the Observable constructor
     * @param subscribe the subscriber function to be passed to the Observable constructor
     * @return A new observable.
     * @deprecated Use `new Observable()` instead. Will be removed in v8.
     */
    Observable.create = function (subscribe) {
        return new Observable(subscribe);
    };
    return Observable;
}());
exports.Observable = Observable;
/**
 * Decides between a passed promise constructor from consuming code,
 * A default configured promise constructor, and the native promise
 * constructor and returns it. If nothing can be found, it will throw
 * an error.
 * @param promiseCtor The optional promise constructor to passed by consuming code
 */
function getPromiseCtor(promiseCtor) {
    var _a;
    return (_a = promiseCtor !== null && promiseCtor !== void 0 ? promiseCtor : config_1.config.Promise) !== null && _a !== void 0 ? _a : Promise;
}
function isObserver(value) {
    return value && (0, isFunction_1.isFunction)(value.next) && (0, isFunction_1.isFunction)(value.error) && (0, isFunction_1.isFunction)(value.complete);
}
function isSubscriber(value) {
    return (value && value instanceof Subscriber_1.Subscriber) || (isObserver(value) && (0, Subscription_1.isSubscription)(value));
}
