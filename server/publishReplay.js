"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishReplay = publishReplay;
var ReplaySubject_1 = require("../ReplaySubject");
var multicast_1 = require("./multicast");
var isFunction_1 = require("../util/isFunction");
/**
 * @deprecated Will be removed in v8. Use the {@link connectable} observable, the {@link connect} operator or the
 * {@link share} operator instead. See the overloads below for equivalent replacement examples of this operator's
 * behaviors.
 * Details: https://rxjs.dev/deprecations/multicasting
 */
function publishReplay(bufferSize, windowTime, selectorOrScheduler, timestampProvider) {
    if (selectorOrScheduler && !(0, isFunction_1.isFunction)(selectorOrScheduler)) {
        timestampProvider = selectorOrScheduler;
    }
    var selector = (0, isFunction_1.isFunction)(selectorOrScheduler) ? selectorOrScheduler : undefined;
    // Note, we're passing `selector!` here, because at runtime, `undefined` is an acceptable argument
    // but it makes our TypeScript signature for `multicast` unhappy (as it should, because it's gross).
    return function (source) { return (0, multicast_1.multicast)(new ReplaySubject_1.ReplaySubject(bufferSize, windowTime, timestampProvider), selector)(source); };
}
