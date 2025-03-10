"use strict";
/*
 * EWMA Bandwidth Estimator
 *  - heavily inspired from shaka-player
 * Tracks bandwidth samples and estimates available bandwidth.
 * Based on the minimum of two exponentially-weighted moving averages with
 * different half-lives.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var ewma_1 = require("../utils/ewma");
var EwmaBandWidthEstimator = /** @class */ (function () {
    function EwmaBandWidthEstimator(slow, fast, defaultEstimate, defaultTTFB) {
        if (defaultTTFB === void 0) { defaultTTFB = 100; }
        this.defaultEstimate_ = defaultEstimate;
        this.minWeight_ = 0.001;
        this.minDelayMs_ = 50;
        this.slow_ = new ewma_1.default(slow);
        this.fast_ = new ewma_1.default(fast);
        this.defaultTTFB_ = defaultTTFB;
        this.ttfb_ = new ewma_1.default(slow);
    }
    EwmaBandWidthEstimator.prototype.update = function (slow, fast) {
        var _a = this, slow_ = _a.slow_, fast_ = _a.fast_, ttfb_ = _a.ttfb_;
        if (slow_.halfLife !== slow) {
            this.slow_ = new ewma_1.default(slow, slow_.getEstimate(), slow_.getTotalWeight());
        }
        if (fast_.halfLife !== fast) {
            this.fast_ = new ewma_1.default(fast, fast_.getEstimate(), fast_.getTotalWeight());
        }
        if (ttfb_.halfLife !== slow) {
            this.ttfb_ = new ewma_1.default(slow, ttfb_.getEstimate(), ttfb_.getTotalWeight());
        }
    };
    EwmaBandWidthEstimator.prototype.sample = function (durationMs, numBytes) {
        durationMs = Math.max(durationMs, this.minDelayMs_);
        var numBits = 8 * numBytes;
        // weight is duration in seconds
        var durationS = durationMs / 1000;
        // value is bandwidth in bits/s
        var bandwidthInBps = numBits / durationS;
        this.fast_.sample(durationS, bandwidthInBps);
        this.slow_.sample(durationS, bandwidthInBps);
    };
    EwmaBandWidthEstimator.prototype.sampleTTFB = function (ttfb) {
        // weight is frequency curve applied to TTFB in seconds
        // (longer times have less weight with expected input under 1 second)
        var seconds = ttfb / 1000;
        var weight = Math.sqrt(2) * Math.exp(-Math.pow(seconds, 2) / 2);
        this.ttfb_.sample(weight, Math.max(ttfb, 5));
    };
    EwmaBandWidthEstimator.prototype.canEstimate = function () {
        return this.fast_.getTotalWeight() >= this.minWeight_;
    };
    EwmaBandWidthEstimator.prototype.getEstimate = function () {
        if (this.canEstimate()) {
            // console.log('slow estimate:'+ Math.round(this.slow_.getEstimate()));
            // console.log('fast estimate:'+ Math.round(this.fast_.getEstimate()));
            // Take the minimum of these two estimates.  This should have the effect of
            // adapting down quickly, but up more slowly.
            return Math.min(this.fast_.getEstimate(), this.slow_.getEstimate());
        }
        else {
            return this.defaultEstimate_;
        }
    };
    EwmaBandWidthEstimator.prototype.getEstimateTTFB = function () {
        if (this.ttfb_.getTotalWeight() >= this.minWeight_) {
            return this.ttfb_.getEstimate();
        }
        else {
            return this.defaultTTFB_;
        }
    };
    EwmaBandWidthEstimator.prototype.destroy = function () { };
    return EwmaBandWidthEstimator;
}());
exports.default = EwmaBandWidthEstimator;
