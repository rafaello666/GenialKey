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
exports.MoveEngine = void 0;
var CoordinatesEngine_1 = require("./CoordinatesEngine");
var events_1 = require("../utils/events");
var maths_1 = require("../utils/maths");
var MoveEngine = /** @class */ (function (_super) {
    __extends(MoveEngine, _super);
    function MoveEngine() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.ingKey = 'moving';
        return _this;
    }
    MoveEngine.prototype.move = function (event) {
        if (this.config.mouseOnly && event.pointerType !== 'mouse')
            return;
        if (!this.state._active)
            this.moveStart(event);
        else
            this.moveChange(event);
        this.timeoutStore.add('moveEnd', this.moveEnd.bind(this));
    };
    MoveEngine.prototype.moveStart = function (event) {
        this.start(event);
        this.computeValues((0, events_1.pointerValues)(event));
        this.compute(event);
        this.computeInitial();
        this.emit();
    };
    MoveEngine.prototype.moveChange = function (event) {
        if (!this.state._active)
            return;
        var values = (0, events_1.pointerValues)(event);
        var state = this.state;
        state._delta = maths_1.V.sub(values, state._values);
        maths_1.V.addTo(state._movement, state._delta);
        this.computeValues(values);
        this.compute(event);
        this.emit();
    };
    MoveEngine.prototype.moveEnd = function (event) {
        if (!this.state._active)
            return;
        this.state._active = false;
        this.compute(event);
        this.emit();
    };
    MoveEngine.prototype.bind = function (bindFunction) {
        bindFunction('pointer', 'change', this.move.bind(this));
        bindFunction('pointer', 'leave', this.moveEnd.bind(this));
    };
    return MoveEngine;
}(CoordinatesEngine_1.CoordinatesEngine));
exports.MoveEngine = MoveEngine;
