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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveWith = resolveWith;
exports.parse = parse;
var sharedConfigResolver_1 = require("./sharedConfigResolver");
var actions_1 = require("../actions");
function resolveWith(config, resolvers) {
    if (config === void 0) { config = {}; }
    var result = {};
    for (var _i = 0, _a = Object.entries(resolvers); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], resolver = _b[1];
        switch (typeof resolver) {
            case 'function':
                if (process.env.NODE_ENV === 'development') {
                    var r = resolver.call(result, config[key], key, config);
                    // prevents deprecated resolvers from applying in dev mode
                    if (!Number.isNaN(r))
                        result[key] = r;
                }
                else {
                    result[key] = resolver.call(result, config[key], key, config);
                }
                break;
            case 'object':
                result[key] = resolveWith(config[key], resolver);
                break;
            case 'boolean':
                if (resolver)
                    result[key] = config[key];
                break;
        }
    }
    return result;
}
function parse(newConfig, gestureKey, _config) {
    if (_config === void 0) { _config = {}; }
    var _a = newConfig, target = _a.target, eventOptions = _a.eventOptions, window = _a.window, enabled = _a.enabled, transform = _a.transform, rest = __rest(_a, ["target", "eventOptions", "window", "enabled", "transform"]);
    _config.shared = resolveWith({ target: target, eventOptions: eventOptions, window: window, enabled: enabled, transform: transform }, sharedConfigResolver_1.sharedConfigResolver);
    if (gestureKey) {
        var resolver = actions_1.ConfigResolverMap.get(gestureKey);
        _config[gestureKey] = resolveWith(__assign({ shared: _config.shared }, rest), resolver);
    }
    else {
        for (var key in rest) {
            var resolver = actions_1.ConfigResolverMap.get(key);
            if (resolver) {
                _config[key] = resolveWith(__assign({ shared: _config.shared }, rest[key]), resolver);
            }
            else if (process.env.NODE_ENV === 'development') {
                if (!['drag', 'pinch', 'scroll', 'wheel', 'move', 'hover'].includes(key)) {
                    if (key === 'domTarget') {
                        throw Error("[@use-gesture]: `domTarget` option has been renamed to `target`.");
                    }
                    // eslint-disable-next-line no-console
                    console.warn("[@use-gesture]: Unknown config key `".concat(key, "` was used. Please read the documentation for further information."));
                }
            }
        }
    }
    return _config;
}
