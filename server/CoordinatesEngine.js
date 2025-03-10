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
exports.CoordinatesEngine = void 0;
var Engine_1 = require("./Engine");
var maths_1 = require("../utils/maths");
var events_1 = require("../utils/events");
function selectAxis(_a, threshold) {
    var dx = _a[0], dy = _a[1];
    var absDx = Math.abs(dx);
    var absDy = Math.abs(dy);
    if (absDx > absDy && absDx > threshold) {
        return 'x';
    }
    if (absDy > absDx && absDy > threshold) {
        return 'y';
    }
    return undefined;
}
var CoordinatesEngine = /** @class */ (function (_super) {
    __extends(CoordinatesEngine, _super);
    function CoordinatesEngine() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.aliasKey = 'xy';
        return _this;
    }
    CoordinatesEngine.prototype.reset = function () {
        _super.prototype.reset.call(this);
        this.state.axis = undefined;
    };
    CoordinatesEngine.prototype.init = function () {
        this.state.offset = [0, 0];
        this.state.lastOffset = [0, 0];
    };
    CoordinatesEngine.prototype.computeOffset = function () {
        this.state.offset = maths_1.V.add(this.state.lastOffset, this.state.movement);
    };
    CoordinatesEngine.prototype.computeMovement = function () {
        this.state.movement = maths_1.V.sub(this.state.offset, this.state.lastOffset);
    };
    CoordinatesEngine.prototype.axisIntent = function (event) {
        var state = this.state;
        var config = this.config;
        if (!state.axis && event) {
            var threshold = typeof config.axisThreshold === 'object' ? config.axisThreshold[(0, events_1.getPointerType)(event)] : config.axisThreshold;
            state.axis = selectAxis(state._movement, threshold);
        }
        // We block the movement if either:
        // - config.lockDirection or config.axis was set but axis isn't detected yet
        // - config.axis was set but is different than detected axis
        state._blocked =
            ((config.lockDirection || !!config.axis) && !state.axis) || (!!config.axis && config.axis !== state.axis);
    };
    CoordinatesEngine.prototype.restrictToAxis = function (v) {
        if (this.config.axis || this.config.lockDirection) {
            switch (this.state.axis) {
                case 'x':
                    v[1] = 0;
                    break; // [ x, 0 ]
                case 'y':
                    v[0] = 0;
                    break; // [ 0, y ]
            }
        }
    };
    return CoordinatesEngine;
}(Engine_1.Engine));
exports.CoordinatesEngine = CoordinatesEngine;
