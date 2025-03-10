"use strict";
/*
 * compute an Exponential Weighted moving average
 * - https://en.wikipedia.org/wiki/Moving_average#Exponential_moving_average
 *  - heavily inspired from shaka-player
 */
Object.defineProperty(exports, "__esModule", { value: true });
var EWMA = /** @class */ (function () {
    //  About half of the estimated value will be from the last |halfLife| samples by weight.
    function EWMA(halfLife, estimate, weight) {
        if (estimate === void 0) { estimate = 0; }
        if (weight === void 0) { weight = 0; }
        this.halfLife = halfLife;
        // Larger values of alpha expire historical data more slowly.
        this.alpha_ = halfLife ? Math.exp(Math.log(0.5) / halfLife) : 0;
        this.estimate_ = estimate;
        this.totalWeight_ = weight;
    }
    EWMA.prototype.sample = function (weight, value) {
        var adjAlpha = Math.pow(this.alpha_, weight);
        this.estimate_ = value * (1 - adjAlpha) + adjAlpha * this.estimate_;
        this.totalWeight_ += weight;
    };
    EWMA.prototype.getTotalWeight = function () {
        return this.totalWeight_;
    };
    EWMA.prototype.getEstimate = function () {
        if (this.alpha_) {
            var zeroFactor = 1 - Math.pow(this.alpha_, this.totalWeight_);
            if (zeroFactor) {
                return this.estimate_ / zeroFactor;
            }
        }
        return this.estimate_;
    };
    return EWMA;
}());
exports.default = EWMA;
