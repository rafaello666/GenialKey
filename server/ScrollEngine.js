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
exports.ScrollEngine = void 0;
var CoordinatesEngine_1 = require("./CoordinatesEngine");
var events_1 = require("../utils/events");
var maths_1 = require("../utils/maths");
var ScrollEngine = /** @class */ (function (_super) {
    __extends(ScrollEngine, _super);
    function ScrollEngine() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.ingKey = 'scrolling';
        return _this;
    }
    ScrollEngine.prototype.scroll = function (event) {
        if (!this.state._active)
            this.start(event);
        this.scrollChange(event);
        this.timeoutStore.add('scrollEnd', this.scrollEnd.bind(this));
    };
    ScrollEngine.prototype.scrollChange = function (event) {
        if (event.cancelable)
            event.preventDefault();
        var state = this.state;
        var values = (0, events_1.scrollValues)(event);
        state._delta = maths_1.V.sub(values, state._values);
        maths_1.V.addTo(state._movement, state._delta);
        this.computeValues(values);
        this.compute(event);
        this.emit();
    };
    ScrollEngine.prototype.scrollEnd = function () {
        if (!this.state._active)
            return;
        this.state._active = false;
        this.compute();
        this.emit();
    };
    ScrollEngine.prototype.bind = function (bindFunction) {
        bindFunction('scroll', '', this.scroll.bind(this));
    };
    return ScrollEngine;
}(CoordinatesEngine_1.CoordinatesEngine));
exports.ScrollEngine = ScrollEngine;
