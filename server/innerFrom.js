"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.innerFrom = innerFrom;
exports.fromInteropObservable = fromInteropObservable;
exports.fromArrayLike = fromArrayLike;
exports.fromPromise = fromPromise;
exports.fromIterable = fromIterable;
exports.fromAsyncIterable = fromAsyncIterable;
exports.fromReadableStreamLike = fromReadableStreamLike;
var isArrayLike_1 = require("../util/isArrayLike");
var isPromise_1 = require("../util/isPromise");
var Observable_1 = require("../Observable");
var isInteropObservable_1 = require("../util/isInteropObservable");
var isAsyncIterable_1 = require("../util/isAsyncIterable");
var throwUnobservableError_1 = require("../util/throwUnobservableError");
var isIterable_1 = require("../util/isIterable");
var isReadableStreamLike_1 = require("../util/isReadableStreamLike");
var isFunction_1 = require("../util/isFunction");
var reportUnhandledError_1 = require("../util/reportUnhandledError");
var observable_1 = require("../symbol/observable");
function innerFrom(input) {
    if (input instanceof Observable_1.Observable) {
        return input;
    }
    if (input != null) {
        if ((0, isInteropObservable_1.isInteropObservable)(input)) {
            return fromInteropObservable(input);
        }
        if ((0, isArrayLike_1.isArrayLike)(input)) {
            return fromArrayLike(input);
        }
        if ((0, isPromise_1.isPromise)(input)) {
            return fromPromise(input);
        }
        if ((0, isAsyncIterable_1.isAsyncIterable)(input)) {
            return fromAsyncIterable(input);
        }
        if ((0, isIterable_1.isIterable)(input)) {
            return fromIterable(input);
        }
        if ((0, isReadableStreamLike_1.isReadableStreamLike)(input)) {
            return fromReadableStreamLike(input);
        }
    }
    throw (0, throwUnobservableError_1.createInvalidObservableTypeError)(input);
}
/**
 * Creates an RxJS Observable from an object that implements `Symbol.observable`.
 * @param obj An object that properly implements `Symbol.observable`.
 */
function fromInteropObservable(obj) {
    return new Observable_1.Observable(function (subscriber) {
        var obs = obj[observable_1.observable]();
        if ((0, isFunction_1.isFunction)(obs.subscribe)) {
            return obs.subscribe(subscriber);
        }
        // Should be caught by observable subscribe function error handling.
        throw new TypeError('Provided object does not correctly implement Symbol.observable');
    });
}
/**
 * Synchronously emits the values of an array like and completes.
 * This is exported because there are creation functions and operators that need to
 * make direct use of the same logic, and there's no reason to make them run through
 * `from` conditionals because we *know* they're dealing with an array.
 * @param array The array to emit values from
 */
function fromArrayLike(array) {
    return new Observable_1.Observable(function (subscriber) {
        // Loop over the array and emit each value. Note two things here:
        // 1. We're making sure that the subscriber is not closed on each loop.
        //    This is so we don't continue looping over a very large array after
        //    something like a `take`, `takeWhile`, or other synchronous unsubscription
        //    has already unsubscribed.
        // 2. In this form, reentrant code can alter that array we're looping over.
        //    This is a known issue, but considered an edge case. The alternative would
        //    be to copy the array before executing the loop, but this has
        //    performance implications.
        for (var i = 0; i < array.length && !subscriber.closed; i++) {
            subscriber.next(array[i]);
        }
        subscriber.complete();
    });
}
function fromPromise(promise) {
    return new Observable_1.Observable(function (subscriber) {
        promise
            .then(function (value) {
            if (!subscriber.closed) {
                subscriber.next(value);
                subscriber.complete();
            }
        }, function (err) { return subscriber.error(err); })
            .then(null, reportUnhandledError_1.reportUnhandledError);
    });
}
function fromIterable(iterable) {
    return new Observable_1.Observable(function (subscriber) {
        for (var _i = 0, iterable_1 = iterable; _i < iterable_1.length; _i++) {
            var value = iterable_1[_i];
            subscriber.next(value);
            if (subscriber.closed) {
                return;
            }
        }
        subscriber.complete();
    });
}
function fromAsyncIterable(asyncIterable) {
    return new Observable_1.Observable(function (subscriber) {
        process(asyncIterable, subscriber).catch(function (err) { return subscriber.error(err); });
    });
}
function fromReadableStreamLike(readableStream) {
    return fromAsyncIterable((0, isReadableStreamLike_1.readableStreamLikeToAsyncGenerator)(readableStream));
}
function process(asyncIterable, subscriber) {
    return __awaiter(this, void 0, void 0, function () {
        var value, e_1_1;
        var _a, asyncIterable_1, asyncIterable_1_1;
        var _b, e_1, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 5, 6, 11]);
                    _a = true, asyncIterable_1 = __asyncValues(asyncIterable);
                    _e.label = 1;
                case 1: return [4 /*yield*/, asyncIterable_1.next()];
                case 2:
                    if (!(asyncIterable_1_1 = _e.sent(), _b = asyncIterable_1_1.done, !_b)) return [3 /*break*/, 4];
                    _d = asyncIterable_1_1.value;
                    _a = false;
                    value = _d;
                    subscriber.next(value);
                    // A side-effect may have closed our subscriber,
                    // check before the next iteration.
                    if (subscriber.closed) {
                        return [2 /*return*/];
                    }
                    _e.label = 3;
                case 3:
                    _a = true;
                    return [3 /*break*/, 1];
                case 4: return [3 /*break*/, 11];
                case 5:
                    e_1_1 = _e.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 11];
                case 6:
                    _e.trys.push([6, , 9, 10]);
                    if (!(!_a && !_b && (_c = asyncIterable_1.return))) return [3 /*break*/, 8];
                    return [4 /*yield*/, _c.call(asyncIterable_1)];
                case 7:
                    _e.sent();
                    _e.label = 8;
                case 8: return [3 /*break*/, 10];
                case 9:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 10: return [7 /*endfinally*/];
                case 11:
                    subscriber.complete();
                    return [2 /*return*/];
            }
        });
    });
}
