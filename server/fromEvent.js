"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromEvent = fromEvent;
var innerFrom_1 = require("../observable/innerFrom");
var Observable_1 = require("../Observable");
var mergeMap_1 = require("../operators/mergeMap");
var isArrayLike_1 = require("../util/isArrayLike");
var isFunction_1 = require("../util/isFunction");
var mapOneOrManyArgs_1 = require("../util/mapOneOrManyArgs");
// These constants are used to create handler registry functions using array mapping below.
var nodeEventEmitterMethods = ['addListener', 'removeListener'];
var eventTargetMethods = ['addEventListener', 'removeEventListener'];
var jqueryMethods = ['on', 'off'];
/**
 * Creates an Observable that emits events of a specific type coming from the
 * given event target.
 *
 * <span class="informal">Creates an Observable from DOM events, or Node.js
 * EventEmitter events or others.</span>
 *
 * ![](fromEvent.png)
 *
 * `fromEvent` accepts as a first argument event target, which is an object with methods
 * for registering event handler functions. As a second argument it takes string that indicates
 * type of event we want to listen for. `fromEvent` supports selected types of event targets,
 * which are described in detail below. If your event target does not match any of the ones listed,
 * you should use {@link fromEventPattern}, which can be used on arbitrary APIs.
 * When it comes to APIs supported by `fromEvent`, their methods for adding and removing event
 * handler functions have different names, but they all accept a string describing event type
 * and function itself, which will be called whenever said event happens.
 *
 * Every time resulting Observable is subscribed, event handler function will be registered
 * to event target on given event type. When that event fires, value
 * passed as a first argument to registered function will be emitted by output Observable.
 * When Observable is unsubscribed, function will be unregistered from event target.
 *
 * Note that if event target calls registered function with more than one argument, second
 * and following arguments will not appear in resulting stream. In order to get access to them,
 * you can pass to `fromEvent` optional project function, which will be called with all arguments
 * passed to event handler. Output Observable will then emit value returned by project function,
 * instead of the usual value.
 *
 * Remember that event targets listed below are checked via duck typing. It means that
 * no matter what kind of object you have and no matter what environment you work in,
 * you can safely use `fromEvent` on that object if it exposes described methods (provided
 * of course they behave as was described above). So for example if Node.js library exposes
 * event target which has the same method names as DOM EventTarget, `fromEvent` is still
 * a good choice.
 *
 * If the API you use is more callback then event handler oriented (subscribed
 * callback function fires only once and thus there is no need to manually
 * unregister it), you should use {@link bindCallback} or {@link bindNodeCallback}
 * instead.
 *
 * `fromEvent` supports following types of event targets:
 *
 * **DOM EventTarget**
 *
 * This is an object with `addEventListener` and `removeEventListener` methods.
 *
 * In the browser, `addEventListener` accepts - apart from event type string and event
 * handler function arguments - optional third parameter, which is either an object or boolean,
 * both used for additional configuration how and when passed function will be called. When
 * `fromEvent` is used with event target of that type, you can provide this values
 * as third parameter as well.
 *
 * **Node.js EventEmitter**
 *
 * An object with `addListener` and `removeListener` methods.
 *
 * **JQuery-style event target**
 *
 * An object with `on` and `off` methods
 *
 * **DOM NodeList**
 *
 * List of DOM Nodes, returned for example by `document.querySelectorAll` or `Node.childNodes`.
 *
 * Although this collection is not event target in itself, `fromEvent` will iterate over all Nodes
 * it contains and install event handler function in every of them. When returned Observable
 * is unsubscribed, function will be removed from all Nodes.
 *
 * **DOM HtmlCollection**
 *
 * Just as in case of NodeList it is a collection of DOM nodes. Here as well event handler function is
 * installed and removed in each of elements.
 *
 *
 * ## Examples
 *
 * Emit clicks happening on the DOM document
 *
 * ```ts
 * import { fromEvent } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * clicks.subscribe(x => console.log(x));
 *
 * // Results in:
 * // MouseEvent object logged to console every time a click
 * // occurs on the document.
 * ```
 *
 * Use `addEventListener` with capture option
 *
 * ```ts
 * import { fromEvent } from 'rxjs';
 *
 * const div = document.createElement('div');
 * div.style.cssText = 'width: 200px; height: 200px; background: #09c;';
 * document.body.appendChild(div);
 *
 * // note optional configuration parameter which will be passed to addEventListener
 * const clicksInDocument = fromEvent(document, 'click', { capture: true });
 * const clicksInDiv = fromEvent(div, 'click');
 *
 * clicksInDocument.subscribe(() => console.log('document'));
 * clicksInDiv.subscribe(() => console.log('div'));
 *
 * // By default events bubble UP in DOM tree, so normally
 * // when we would click on div in document
 * // "div" would be logged first and then "document".
 * // Since we specified optional `capture` option, document
 * // will catch event when it goes DOWN DOM tree, so console
 * // will log "document" and then "div".
 * ```
 *
 * @see {@link bindCallback}
 * @see {@link bindNodeCallback}
 * @see {@link fromEventPattern}
 *
 * @param target The DOM EventTarget, Node.js EventEmitter, JQuery-like event target,
 * NodeList or HTMLCollection to attach the event handler to.
 * @param eventName The event name of interest, being emitted by the `target`.
 * @param options Options to pass through to the underlying `addListener`,
 * `addEventListener` or `on` functions.
 * @param resultSelector A mapping function used to transform events. It takes the
 * arguments from the event handler and should return a single value.
 * @return An Observable emitting events registered through `target`'s
 * listener handlers.
 */
function fromEvent(target, eventName, options, resultSelector) {
    if ((0, isFunction_1.isFunction)(options)) {
        resultSelector = options;
        options = undefined;
    }
    if (resultSelector) {
        return fromEvent(target, eventName, options).pipe((0, mapOneOrManyArgs_1.mapOneOrManyArgs)(resultSelector));
    }
    // Figure out our add and remove methods. In order to do this,
    // we are going to analyze the target in a preferred order, if
    // the target matches a given signature, we take the two "add" and "remove"
    // method names and apply them to a map to create opposite versions of the
    // same function. This is because they all operate in duplicate pairs,
    // `addListener(name, handler)`, `removeListener(name, handler)`, for example.
    // The call only differs by method name, as to whether or not you're adding or removing.
    var _a = 
    // If it is an EventTarget, we need to use a slightly different method than the other two patterns.
    isEventTarget(target)
        ? eventTargetMethods.map(function (methodName) { return function (handler) { return target[methodName](eventName, handler, options); }; })
        : // In all other cases, the call pattern is identical with the exception of the method names.
            isNodeStyleEventEmitter(target)
                ? nodeEventEmitterMethods.map(toCommonHandlerRegistry(target, eventName))
                : isJQueryStyleEventEmitter(target)
                    ? jqueryMethods.map(toCommonHandlerRegistry(target, eventName))
                    : [], add = _a[0], remove = _a[1];
    // If add is falsy, it's because we didn't match a pattern above.
    // Check to see if it is an ArrayLike, because if it is, we want to
    // try to apply fromEvent to all of it's items. We do this check last,
    // because there are may be some types that are both ArrayLike *and* implement
    // event registry points, and we'd rather delegate to that when possible.
    if (!add) {
        if ((0, isArrayLike_1.isArrayLike)(target)) {
            return (0, mergeMap_1.mergeMap)(function (subTarget) { return fromEvent(subTarget, eventName, options); })((0, innerFrom_1.innerFrom)(target));
        }
    }
    // If add is falsy and we made it here, it's because we didn't
    // match any valid target objects above.
    if (!add) {
        throw new TypeError('Invalid event target');
    }
    return new Observable_1.Observable(function (subscriber) {
        // The handler we are going to register. Forwards the event object, by itself, or
        // an array of arguments to the event handler, if there is more than one argument,
        // to the consumer.
        var handler = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return subscriber.next(1 < args.length ? args : args[0]);
        };
        // Do the work of adding the handler to the target.
        add(handler);
        // When we finalize, we want to remove the handler and free up memory.
        return function () { return remove(handler); };
    });
}
/**
 * Used to create `add` and `remove` functions to register and unregister event handlers
 * from a target in the most common handler pattern, where there are only two arguments.
 * (e.g.  `on(name, fn)`, `off(name, fn)`, `addListener(name, fn)`, or `removeListener(name, fn)`)
 * @param target The target we're calling methods on
 * @param eventName The event name for the event we're creating register or unregister functions for
 */
function toCommonHandlerRegistry(target, eventName) {
    return function (methodName) { return function (handler) { return target[methodName](eventName, handler); }; };
}
/**
 * Checks to see if the target implements the required node-style EventEmitter methods
 * for adding and removing event handlers.
 * @param target the object to check
 */
function isNodeStyleEventEmitter(target) {
    return (0, isFunction_1.isFunction)(target.addListener) && (0, isFunction_1.isFunction)(target.removeListener);
}
/**
 * Checks to see if the target implements the required jQuery-style EventEmitter methods
 * for adding and removing event handlers.
 * @param target the object to check
 */
function isJQueryStyleEventEmitter(target) {
    return (0, isFunction_1.isFunction)(target.on) && (0, isFunction_1.isFunction)(target.off);
}
/**
 * Checks to see if the target implements the required EventTarget methods
 * for adding and removing event handlers.
 * @param target the object to check
 */
function isEventTarget(target) {
    return (0, isFunction_1.isFunction)(target.addEventListener) && (0, isFunction_1.isFunction)(target.removeEventListener);
}
