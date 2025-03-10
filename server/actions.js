"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wheelAction = exports.scrollAction = exports.pinchAction = exports.moveAction = exports.hoverAction = exports.dragAction = exports.ConfigResolverMap = exports.EngineMap = void 0;
exports.registerAction = registerAction;
var DragEngine_1 = require("./engines/DragEngine");
var dragConfigResolver_1 = require("./config/dragConfigResolver");
var PinchEngine_1 = require("./engines/PinchEngine");
var pinchConfigResolver_1 = require("./config/pinchConfigResolver");
var MoveEngine_1 = require("./engines/MoveEngine");
var moveConfigResolver_1 = require("./config/moveConfigResolver");
var ScrollEngine_1 = require("./engines/ScrollEngine");
var scrollConfigResolver_1 = require("./config/scrollConfigResolver");
var WheelEngine_1 = require("./engines/WheelEngine");
var wheelConfigResolver_1 = require("./config/wheelConfigResolver");
var HoverEngine_1 = require("./engines/HoverEngine");
var hoverConfigResolver_1 = require("./config/hoverConfigResolver");
exports.EngineMap = new Map();
exports.ConfigResolverMap = new Map();
function registerAction(action) {
    exports.EngineMap.set(action.key, action.engine);
    exports.ConfigResolverMap.set(action.key, action.resolver);
}
exports.dragAction = {
    key: 'drag',
    engine: DragEngine_1.DragEngine,
    resolver: dragConfigResolver_1.dragConfigResolver
};
exports.hoverAction = {
    key: 'hover',
    engine: HoverEngine_1.HoverEngine,
    resolver: hoverConfigResolver_1.hoverConfigResolver
};
exports.moveAction = {
    key: 'move',
    engine: MoveEngine_1.MoveEngine,
    resolver: moveConfigResolver_1.moveConfigResolver
};
exports.pinchAction = {
    key: 'pinch',
    engine: PinchEngine_1.PinchEngine,
    resolver: pinchConfigResolver_1.pinchConfigResolver
};
exports.scrollAction = {
    key: 'scroll',
    engine: ScrollEngine_1.ScrollEngine,
    resolver: scrollConfigResolver_1.scrollConfigResolver
};
exports.wheelAction = {
    key: 'wheel',
    engine: WheelEngine_1.WheelEngine,
    resolver: wheelConfigResolver_1.wheelConfigResolver
};
