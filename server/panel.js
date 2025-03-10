"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Panel = void 0;
var Panel = /** @class */ (function () {
    function Panel(name, fg, bg) {
        this.name = name;
        this.fg = fg;
        this.bg = bg;
        this.gradient = null;
        this.PR = Math.round(window.devicePixelRatio || 1);
        this.WIDTH = 90 * this.PR;
        this.HEIGHT = 48 * this.PR;
        this.TEXT_X = 3 * this.PR;
        this.TEXT_Y = 2 * this.PR;
        this.GRAPH_X = 3 * this.PR;
        this.GRAPH_Y = 15 * this.PR;
        this.GRAPH_WIDTH = 84 * this.PR;
        this.GRAPH_HEIGHT = 30 * this.PR;
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.WIDTH;
        this.canvas.height = this.HEIGHT;
        this.canvas.style.width = '90px';
        this.canvas.style.height = '48px';
        this.canvas.style.position = 'absolute';
        this.canvas.style.cssText = 'width:90px;height:48px';
        this.context = this.canvas.getContext('2d');
        this.initializeCanvas();
    }
    Panel.prototype.createGradient = function () {
        if (!this.context)
            throw new Error('No context');
        var gradient = this.context.createLinearGradient(0, this.GRAPH_Y, 0, this.GRAPH_Y + this.GRAPH_HEIGHT);
        var startColor;
        var endColor = this.fg;
        switch (this.fg.toLowerCase()) {
            case '#0ff': // Cyan
                startColor = '#006666'; // Dark Cyan
                break;
            case '#0f0': // Green
                startColor = '#006600'; // Dark Green
                break;
            case '#ff0': // Yellow
                startColor = '#666600'; // Dark Yellow
                break;
            case '#e1e1e1': // Light Gray
                startColor = '#666666'; // Medium Gray
                break;
            default:
                startColor = this.bg;
                break;
        }
        gradient.addColorStop(0, startColor);
        gradient.addColorStop(1, endColor);
        return gradient;
    };
    Panel.prototype.initializeCanvas = function () {
        if (!this.context)
            return;
        this.context.font = 'bold ' + (9 * this.PR) + 'px Helvetica,Arial,sans-serif';
        this.context.textBaseline = 'top';
        // Create gradient
        this.gradient = this.createGradient();
        // Fill background
        this.context.fillStyle = this.bg;
        this.context.fillRect(0, 0, this.WIDTH, this.HEIGHT);
        // Draw text
        this.context.fillStyle = this.fg;
        this.context.fillText(this.name, this.TEXT_X, this.TEXT_Y);
        // Draw initial graph area
        this.context.fillStyle = this.fg;
        this.context.fillRect(this.GRAPH_X, this.GRAPH_Y, this.GRAPH_WIDTH, this.GRAPH_HEIGHT);
        // Apply semi-transparent background
        this.context.fillStyle = this.bg;
        this.context.globalAlpha = 0.9;
        this.context.fillRect(this.GRAPH_X, this.GRAPH_Y, this.GRAPH_WIDTH, this.GRAPH_HEIGHT);
    };
    Panel.prototype.update = function (value, valueGraph, maxValue, maxGraph, decimals) {
        if (decimals === void 0) { decimals = 0; }
        if (!this.context || !this.gradient)
            return;
        var min = Math.min(Infinity, value);
        var max = Math.max(maxValue, value);
        maxGraph = Math.max(maxGraph, valueGraph);
        // Clear and redraw background
        this.context.globalAlpha = 1;
        this.context.fillStyle = this.bg;
        this.context.fillRect(0, 0, this.WIDTH, this.GRAPH_Y);
        // Draw text
        this.context.fillStyle = this.fg;
        this.context.fillText("".concat(value.toFixed(decimals), " ").concat(this.name, " (").concat(min.toFixed(decimals), "-").concat(parseFloat(max.toFixed(decimals)), ")"), this.TEXT_X, this.TEXT_Y);
        // Shift the graph left
        this.context.drawImage(this.canvas, this.GRAPH_X + this.PR, this.GRAPH_Y, this.GRAPH_WIDTH - this.PR, this.GRAPH_HEIGHT, this.GRAPH_X, this.GRAPH_Y, this.GRAPH_WIDTH - this.PR, this.GRAPH_HEIGHT);
        // Draw new column with gradient
        var columnHeight = this.GRAPH_HEIGHT - (1 - valueGraph / maxGraph) * this.GRAPH_HEIGHT;
        if (columnHeight > 0) {
            this.context.globalAlpha = 1;
            this.context.fillStyle = this.gradient;
            this.context.fillRect(this.GRAPH_X + this.GRAPH_WIDTH - this.PR, this.GRAPH_Y + this.GRAPH_HEIGHT - columnHeight, this.PR, columnHeight);
        }
    };
    return Panel;
}());
exports.Panel = Panel;
