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
exports.WheelEngine = void 0;
var CoordinatesEngine_1 = require("./CoordinatesEngine");
var events_1 = require("../utils/events");
var maths_1 = require("../utils/maths");
var state_1 = require("../utils/state");
var WheelEngine = /** @class */ (function (_super) {
    __extends(WheelEngine, _super);
    function WheelEngine() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.ingKey = 'wheeling';
        return _this;
    }
    WheelEngine.prototype.wheel = function (event) {
        if (!this.state._active)
            this.start(event);
        this.wheelChange(event);
        this.timeoutStore.add('wheelEnd', this.wheelEnd.bind(this));
    };
    WheelEngine.prototype.wheelChange = function (event) {
        var state = this.state;
        state._delta = (0, events_1.wheelValues)(event);
        maths_1.V.addTo(state._movement, state._delta);
        // _movement rolls back to when it passed the bounds.
        (0, state_1.clampStateInternalMovementToBounds)(state);
        this.compute(event);
        this.emit();
    };
    WheelEngine.prototype.wheelEnd = function () {
        if (!this.state._active)
            return;
        this.state._active = false;
        this.compute();
        this.emit();
    };
    WheelEngine.prototype.bind = function (bindFunction) {
        bindFunction('wheel', '', this.wheel.bind(this));
    };
    return WheelEngine;
}(CoordinatesEngine_1.CoordinatesEngine));
exports.WheelEngine = WheelEngine;
