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
exports.HoverEngine = void 0;
var CoordinatesEngine_1 = require("./CoordinatesEngine");
var events_1 = require("../utils/events");
var maths_1 = require("../utils/maths");
var HoverEngine = /** @class */ (function (_super) {
    __extends(HoverEngine, _super);
    function HoverEngine() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.ingKey = 'hovering';
        return _this;
    }
    HoverEngine.prototype.enter = function (event) {
        if (this.config.mouseOnly && event.pointerType !== 'mouse')
            return;
        this.start(event);
        this.computeValues((0, events_1.pointerValues)(event));
        this.compute(event);
        this.emit();
    };
    HoverEngine.prototype.leave = function (event) {
        if (this.config.mouseOnly && event.pointerType !== 'mouse')
            return;
        var state = this.state;
        if (!state._active)
            return;
        state._active = false;
        var values = (0, events_1.pointerValues)(event);
        state._movement = state._delta = maths_1.V.sub(values, state._values);
        this.computeValues(values);
        this.compute(event);
        state.delta = state.movement;
        this.emit();
    };
    HoverEngine.prototype.bind = function (bindFunction) {
        bindFunction('pointer', 'enter', this.enter.bind(this));
        bindFunction('pointer', 'leave', this.leave.bind(this));
    };
    return HoverEngine;
}(CoordinatesEngine_1.CoordinatesEngine));
exports.HoverEngine = HoverEngine;
