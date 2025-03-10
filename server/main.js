"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var panel_1 = require("./panel");
var Stats = /** @class */ (function () {
    function Stats(_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.trackGPU, trackGPU = _c === void 0 ? false : _c, _d = _b.logsPerSecond, logsPerSecond = _d === void 0 ? 30 : _d, _e = _b.samplesLog, samplesLog = _e === void 0 ? 60 : _e, _f = _b.samplesGraph, samplesGraph = _f === void 0 ? 10 : _f, _g = _b.precision, precision = _g === void 0 ? 2 : _g, _h = _b.minimal, minimal = _h === void 0 ? false : _h, _j = _b.horizontal, horizontal = _j === void 0 ? true : _j, _k = _b.mode, mode = _k === void 0 ? 0 : _k;
        var _this = this;
        this.gl = null;
        this.ext = null;
        this.activeQuery = null;
        this.gpuQueries = [];
        this.threeRendererPatched = false;
        this.frames = 0;
        this.renderCount = 0;
        this.isRunningCPUProfiling = false;
        this.totalCpuDuration = 0;
        this.totalGpuDuration = 0;
        this.totalGpuDurationCompute = 0;
        this.totalFps = 0;
        this.gpuPanel = null;
        this.gpuPanelCompute = null;
        this.averageFps = { logs: [], graph: [] };
        this.averageCpu = { logs: [], graph: [] };
        this.averageGpu = { logs: [], graph: [] };
        this.averageGpuCompute = { logs: [], graph: [] };
        this.handleClick = function (event) {
            event.preventDefault();
            _this.showPanel(++_this.mode % _this.dom.children.length);
        };
        this.handleResize = function () {
            _this.resizePanel(_this.fpsPanel, 0);
            _this.resizePanel(_this.msPanel, 1);
            if (_this.gpuPanel)
                _this.resizePanel(_this.gpuPanel, 2);
            if (_this.gpuPanelCompute)
                _this.resizePanel(_this.gpuPanelCompute, 3);
        };
        this.mode = mode;
        this.horizontal = horizontal;
        this.minimal = minimal;
        this.trackGPU = trackGPU;
        this.samplesLog = samplesLog;
        this.samplesGraph = samplesGraph;
        this.precision = precision;
        this.logsPerSecond = logsPerSecond;
        // Initialize DOM
        this.dom = document.createElement('div');
        this.initializeDOM();
        // Initialize timing
        this.beginTime = performance.now();
        this.prevTime = this.beginTime;
        this.prevCpuTime = this.beginTime;
        // Create panels
        this.fpsPanel = this.addPanel(new Stats.Panel('FPS', '#0ff', '#002'), 0);
        this.msPanel = this.addPanel(new Stats.Panel('CPU', '#0f0', '#020'), 1);
        this.setupEventListeners();
    }
    Stats.prototype.initializeDOM = function () {
        this.dom.style.cssText = "\n      position: fixed;\n      top: 0;\n      left: 0;\n      opacity: 0.9;\n      z-index: 10000;\n      ".concat(this.minimal ? 'cursor: pointer;' : '', "\n    ");
    };
    Stats.prototype.setupEventListeners = function () {
        if (this.minimal) {
            this.dom.addEventListener('click', this.handleClick);
            this.showPanel(this.mode);
        }
        else {
            window.addEventListener('resize', this.handleResize);
        }
    };
    Stats.prototype.init = function (canvasOrGL) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!canvasOrGL) {
                            console.error('Stats: The "canvas" parameter is undefined.');
                            return [2 /*return*/];
                        }
                        if (this.handleThreeRenderer(canvasOrGL))
                            return [2 /*return*/];
                        return [4 /*yield*/, this.handleWebGPURenderer(canvasOrGL)];
                    case 1:
                        if (_a.sent())
                            return [2 /*return*/];
                        if (!this.initializeWebGL(canvasOrGL))
                            return [2 /*return*/];
                        return [2 /*return*/];
                }
            });
        });
    };
    Stats.prototype.handleThreeRenderer = function (renderer) {
        if (renderer.isWebGLRenderer && !this.threeRendererPatched) {
            this.patchThreeRenderer(renderer);
            this.gl = renderer.getContext();
            if (this.trackGPU) {
                this.initializeGPUTracking();
            }
            return true;
        }
        return false;
    };
    Stats.prototype.handleWebGPURenderer = function (renderer) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!renderer.isWebGPURenderer) return [3 /*break*/, 3];
                        if (!this.trackGPU) return [3 /*break*/, 2];
                        renderer.backend.trackTimestamp = true;
                        return [4 /*yield*/, renderer.hasFeatureAsync('timestamp-query')];
                    case 1:
                        if (_a.sent()) {
                            this.initializeWebGPUPanels();
                        }
                        _a.label = 2;
                    case 2:
                        this.info = renderer.info;
                        return [2 /*return*/, true];
                    case 3: return [2 /*return*/, false];
                }
            });
        });
    };
    Stats.prototype.initializeWebGPUPanels = function () {
        this.gpuPanel = this.addPanel(new Stats.Panel('GPU', '#ff0', '#220'), 2);
        this.gpuPanelCompute = this.addPanel(new Stats.Panel('CPT', '#e1e1e1', '#212121'), 3);
    };
    Stats.prototype.initializeWebGL = function (canvasOrGL) {
        if (canvasOrGL instanceof WebGL2RenderingContext) {
            this.gl = canvasOrGL;
        }
        else if (canvasOrGL instanceof HTMLCanvasElement ||
            canvasOrGL instanceof OffscreenCanvas) {
            this.gl = canvasOrGL.getContext('webgl2');
            if (!this.gl) {
                console.error('Stats: Unable to obtain WebGL2 context.');
                return false;
            }
        }
        else {
            console.error('Stats: Invalid input type. Expected WebGL2RenderingContext, HTMLCanvasElement, or OffscreenCanvas.');
            return false;
        }
        return true;
    };
    Stats.prototype.initializeGPUTracking = function () {
        if (this.gl) {
            this.ext = this.gl.getExtension('EXT_disjoint_timer_query_webgl2');
            if (this.ext) {
                this.gpuPanel = this.addPanel(new Stats.Panel('GPU', '#ff0', '#220'), 2);
            }
        }
    };
    Stats.prototype.begin = function () {
        if (!this.isRunningCPUProfiling) {
            this.beginProfiling('cpu-started');
        }
        if (!this.gl || !this.ext)
            return;
        if (this.activeQuery) {
            this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
        }
        this.activeQuery = this.gl.createQuery();
        if (this.activeQuery) {
            this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT, this.activeQuery);
        }
    };
    Stats.prototype.end = function () {
        this.renderCount++;
        if (this.gl && this.ext && this.activeQuery) {
            this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
            this.gpuQueries.push({ query: this.activeQuery });
            this.activeQuery = null;
        }
    };
    Stats.prototype.update = function () {
        if (!this.info) {
            this.processGpuQueries();
        }
        else {
            this.processWebGPUTimestamps();
        }
        this.endProfiling('cpu-started', 'cpu-finished', 'cpu-duration');
        this.updateAverages();
        this.resetCounters();
    };
    Stats.prototype.processWebGPUTimestamps = function () {
        this.totalGpuDuration = this.info.render.timestamp;
        this.totalGpuDurationCompute = this.info.compute.timestamp;
        this.addToAverage(this.totalGpuDurationCompute, this.averageGpuCompute);
    };
    Stats.prototype.updateAverages = function () {
        this.addToAverage(this.totalCpuDuration, this.averageCpu);
        this.addToAverage(this.totalGpuDuration, this.averageGpu);
    };
    Stats.prototype.resetCounters = function () {
        this.renderCount = 0;
        if (this.totalCpuDuration === 0) {
            this.beginProfiling('cpu-started');
        }
        this.totalCpuDuration = 0;
        this.totalFps = 0;
        this.beginTime = this.endInternal();
    };
    Stats.prototype.resizePanel = function (panel, offset) {
        panel.canvas.style.position = 'absolute';
        if (this.minimal) {
            panel.canvas.style.display = 'none';
        }
        else {
            panel.canvas.style.display = 'block';
            if (this.horizontal) {
                panel.canvas.style.top = '0px';
                panel.canvas.style.left = offset * panel.WIDTH / panel.PR + 'px';
            }
            else {
                panel.canvas.style.left = '0px';
                panel.canvas.style.top = offset * panel.HEIGHT / panel.PR + 'px';
            }
        }
    };
    Stats.prototype.addPanel = function (panel, offset) {
        if (panel.canvas) {
            this.dom.appendChild(panel.canvas);
            this.resizePanel(panel, offset);
        }
        return panel;
    };
    Stats.prototype.showPanel = function (id) {
        for (var i = 0; i < this.dom.children.length; i++) {
            var child = this.dom.children[i];
            child.style.display = i === id ? 'block' : 'none';
        }
        this.mode = id;
    };
    Stats.prototype.processGpuQueries = function () {
        var _this = this;
        if (!this.gl || !this.ext)
            return;
        this.totalGpuDuration = 0;
        this.gpuQueries.forEach(function (queryInfo, index) {
            if (_this.gl) {
                var available = _this.gl.getQueryParameter(queryInfo.query, _this.gl.QUERY_RESULT_AVAILABLE);
                var disjoint = _this.gl.getParameter(_this.ext.GPU_DISJOINT_EXT);
                if (available && !disjoint) {
                    var elapsed = _this.gl.getQueryParameter(queryInfo.query, _this.gl.QUERY_RESULT);
                    var duration = elapsed * 1e-6; // Convert nanoseconds to milliseconds
                    _this.totalGpuDuration += duration;
                    _this.gl.deleteQuery(queryInfo.query);
                    _this.gpuQueries.splice(index, 1); // Remove the processed query
                }
            }
        });
    };
    Stats.prototype.endInternal = function () {
        this.frames++;
        var time = (performance || Date).now();
        var elapsed = time - this.prevTime;
        // Calculate FPS more frequently based on logsPerSecond
        if (time >= this.prevCpuTime + 1000 / this.logsPerSecond) {
            // Calculate FPS and round to nearest integer
            var fps = Math.round((this.frames * 1000) / elapsed);
            // Add to FPS averages
            this.addToAverage(fps, this.averageFps);
            // Update all panels
            this.updatePanel(this.fpsPanel, this.averageFps, 0);
            this.updatePanel(this.msPanel, this.averageCpu, this.precision);
            this.updatePanel(this.gpuPanel, this.averageGpu, this.precision);
            if (this.gpuPanelCompute) {
                this.updatePanel(this.gpuPanelCompute, this.averageGpuCompute);
            }
            // Reset frame counter for next interval
            this.frames = 0;
            this.prevCpuTime = time;
            this.prevTime = time;
        }
        return time;
    };
    Stats.prototype.addToAverage = function (value, averageArray) {
        averageArray.logs.push(value);
        if (averageArray.logs.length > this.samplesLog) {
            averageArray.logs.shift();
        }
        averageArray.graph.push(value);
        if (averageArray.graph.length > this.samplesGraph) {
            averageArray.graph.shift();
        }
    };
    Stats.prototype.beginProfiling = function (marker) {
        if (window.performance) {
            window.performance.mark(marker);
            this.isRunningCPUProfiling = true;
        }
    };
    Stats.prototype.endProfiling = function (startMarker, endMarker, measureName) {
        if (window.performance && endMarker && this.isRunningCPUProfiling) {
            window.performance.mark(endMarker);
            var cpuMeasure = performance.measure(measureName, startMarker, endMarker);
            this.totalCpuDuration += cpuMeasure.duration;
            this.isRunningCPUProfiling = false;
        }
    };
    Stats.prototype.updatePanel = function (panel, averageArray, precision) {
        if (precision === void 0) { precision = 2; }
        if (averageArray.logs.length > 0) {
            var sumLog = 0;
            var max = 0.01;
            for (var i = 0; i < averageArray.logs.length; i++) {
                sumLog += averageArray.logs[i];
                if (averageArray.logs[i] > max) {
                    max = averageArray.logs[i];
                }
            }
            var sumGraph = 0;
            var maxGraph = 0.01;
            for (var i = 0; i < averageArray.graph.length; i++) {
                sumGraph += averageArray.graph[i];
                if (averageArray.graph[i] > maxGraph) {
                    maxGraph = averageArray.graph[i];
                }
            }
            if (panel) {
                panel.update(sumLog / Math.min(averageArray.logs.length, this.samplesLog), sumGraph / Math.min(averageArray.graph.length, this.samplesGraph), max, maxGraph, precision);
            }
        }
    };
    Object.defineProperty(Stats.prototype, "domElement", {
        get: function () {
            // patch for some use case in threejs
            return this.dom;
        },
        enumerable: false,
        configurable: true
    });
    Stats.prototype.patchThreeRenderer = function (renderer) {
        // Store the original render method
        var originalRenderMethod = renderer.render;
        // Reference to the stats instance
        var statsInstance = this;
        // Override the render method on the prototype
        renderer.render = function (scene, camera) {
            statsInstance.begin(); // Start tracking for this render call
            // Call the original render method
            originalRenderMethod.call(this, scene, camera);
            statsInstance.end(); // End tracking for this render call
        };
        this.threeRendererPatched = true;
    };
    Stats.Panel = panel_1.Panel;
    return Stats;
}());
exports.default = Stats;
