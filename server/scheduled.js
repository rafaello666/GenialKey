"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduled = scheduled;
var scheduleObservable_1 = require("./scheduleObservable");
var schedulePromise_1 = require("./schedulePromise");
var scheduleArray_1 = require("./scheduleArray");
var scheduleIterable_1 = require("./scheduleIterable");
var scheduleAsyncIterable_1 = require("./scheduleAsyncIterable");
var isInteropObservable_1 = require("../util/isInteropObservable");
var isPromise_1 = require("../util/isPromise");
var isArrayLike_1 = require("../util/isArrayLike");
var isIterable_1 = require("../util/isIterable");
var isAsyncIterable_1 = require("../util/isAsyncIterable");
var throwUnobservableError_1 = require("../util/throwUnobservableError");
var isReadableStreamLike_1 = require("../util/isReadableStreamLike");
var scheduleReadableStreamLike_1 = require("./scheduleReadableStreamLike");
/**
 * Converts from a common {@link ObservableInput} type to an observable where subscription and emissions
 * are scheduled on the provided scheduler.
 *
 * @see {@link from}
 * @see {@link of}
 *
 * @param input The observable, array, promise, iterable, etc you would like to schedule
 * @param scheduler The scheduler to use to schedule the subscription and emissions from
 * the returned observable.
 */
function scheduled(input, scheduler) {
    if (input != null) {
        if ((0, isInteropObservable_1.isInteropObservable)(input)) {
            return (0, scheduleObservable_1.scheduleObservable)(input, scheduler);
        }
        if ((0, isArrayLike_1.isArrayLike)(input)) {
            return (0, scheduleArray_1.scheduleArray)(input, scheduler);
        }
        if ((0, isPromise_1.isPromise)(input)) {
            return (0, schedulePromise_1.schedulePromise)(input, scheduler);
        }
        if ((0, isAsyncIterable_1.isAsyncIterable)(input)) {
            return (0, scheduleAsyncIterable_1.scheduleAsyncIterable)(input, scheduler);
        }
        if ((0, isIterable_1.isIterable)(input)) {
            return (0, scheduleIterable_1.scheduleIterable)(input, scheduler);
        }
        if ((0, isReadableStreamLike_1.isReadableStreamLike)(input)) {
            return (0, scheduleReadableStreamLike_1.scheduleReadableStreamLike)(input, scheduler);
        }
    }
    throw (0, throwUnobservableError_1.createInvalidObservableTypeError)(input);
}
