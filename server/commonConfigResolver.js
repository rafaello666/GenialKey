"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonConfigResolver = exports.DEFAULT_RUBBERBAND = exports.identity = void 0;
var maths_1 = require("../utils/maths");
var identity = function (v) { return v; };
exports.identity = identity;
exports.DEFAULT_RUBBERBAND = 0.15;
exports.commonConfigResolver = {
    enabled: function (value) {
        if (value === void 0) { value = true; }
        return value;
    },
    eventOptions: function (value, _k, config) {
        return __assign(__assign({}, config.shared.eventOptions), value);
    },
    preventDefault: function (value) {
        if (value === void 0) { value = false; }
        return value;
    },
    triggerAllEvents: function (value) {
        if (value === void 0) { value = false; }
        return value;
    },
    rubberband: function (value) {
        if (value === void 0) { value = 0; }
        switch (value) {
            case true:
                return [exports.DEFAULT_RUBBERBAND, exports.DEFAULT_RUBBERBAND];
            case false:
                return [0, 0];
            default:
                return maths_1.V.toVector(value);
        }
    },
    from: function (value) {
        if (typeof value === 'function')
            return value;
        // eslint-disable-next-line eqeqeq
        if (value != null)
            return maths_1.V.toVector(value);
    },
    transform: function (value, _k, config) {
        var transform = value || config.shared.transform;
        this.hasCustomTransform = !!transform;
        if (process.env.NODE_ENV === 'development') {
            var originalTransform_1 = transform || exports.identity;
            return function (v) {
                var r = originalTransform_1(v);
                if (!isFinite(r[0]) || !isFinite(r[1])) {
                    // eslint-disable-next-line no-console
                    console.warn("[@use-gesture]: config.transform() must produce a valid result, but it was: [".concat(r[0], ",").concat([1], "]"));
                }
                return r;
            };
        }
        return transform || exports.identity;
    },
    threshold: function (value) {
        return maths_1.V.toVector(value, 0);
    }
};
if (process.env.NODE_ENV === 'development') {
    Object.assign(exports.commonConfigResolver, {
        domTarget: function (value) {
            if (value !== undefined) {
                throw Error("[@use-gesture]: `domTarget` option has been renamed to `target`.");
            }
            return NaN;
        },
        lockDirection: function (value) {
            if (value !== undefined) {
                throw Error("[@use-gesture]: `lockDirection` option has been merged with `axis`. Use it as in `{ axis: 'lock' }`");
            }
            return NaN;
        },
        initial: function (value) {
            if (value !== undefined) {
                throw Error("[@use-gesture]: `initial` option has been renamed to `from`.");
            }
            return NaN;
        }
    });
}
