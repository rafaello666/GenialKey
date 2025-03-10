"use strict";
/* eslint-disable react-hooks/rules-of-hooks */
/* Type tests for @use-gesture/react */
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var tsd_1 = require("tsd");
var _1 = require(".");
/* Checks that gesture hooks return event props handlers */
(0, tsd_1.expectType)((0, _1.useDrag)(function () { }));
/* Checks that gesture hooks don't return any value when used with config option `target` */
(0, tsd_1.expectType)((0, _1.useDrag)(function () { }, { target: window }));
/* Checks that hooks accept generics to cast event type */
(0, _1.useDrag)(function (_a) {
    var event = _a.event;
    return (0, tsd_1.expectType)(event);
});
var fakeDiv = 'fake';
var fakeRef = (0, react_1.useRef)(null);
/* Checks config.bounds type for useDrag */
(0, _1.useDrag)(function () { }, { bounds: { left: 0 } });
(0, _1.useDrag)(function () { }, { bounds: fakeDiv });
(0, _1.useDrag)(function () { }, { bounds: fakeRef });
/* Checks that useGesture returns event props handler */
(0, tsd_1.expectType)((0, _1.useGesture)({ onPinch: function () { } }));
/* Checks that useGesture doesn't return any value when used with config option `target` */
(0, tsd_1.expectType)((0, _1.useGesture)({ onPinch: function () { } }, { target: window }));
/* Checks that useGesture accepts generics to cast event type */
(0, _1.useGesture)({
    onDrag: function (_a) {
        var event = _a.event;
        return (0, tsd_1.expectType)(event);
    },
    onPinch: function (_a) {
        var event = _a.event;
        return (0, tsd_1.expectType)(event);
    },
    onClick: function (_a) {
        var event = _a.event;
        return (0, tsd_1.expectType)(event);
    }
});
