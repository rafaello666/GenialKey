"use strict";
/**
 * Provides methods dealing with buffer length retrieval for example.
 *
 * In general, a helper around HTML5 MediaElement TimeRanges gathered from `buffered` property.
 *
 * Also @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/buffered
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferHelper = void 0;
var logger_1 = require("./logger");
var noopBuffered = {
    length: 0,
    start: function () { return 0; },
    end: function () { return 0; },
};
var BufferHelper = /** @class */ (function () {
    function BufferHelper() {
    }
    /**
     * Return true if `media`'s buffered include `position`
     */
    BufferHelper.isBuffered = function (media, position) {
        try {
            if (media) {
                var buffered = BufferHelper.getBuffered(media);
                for (var i = 0; i < buffered.length; i++) {
                    if (position >= buffered.start(i) && position <= buffered.end(i)) {
                        return true;
                    }
                }
            }
        }
        catch (error) {
            // this is to catch
            // InvalidStateError: Failed to read the 'buffered' property from 'SourceBuffer':
            // This SourceBuffer has been removed from the parent media source
        }
        return false;
    };
    BufferHelper.bufferInfo = function (media, pos, maxHoleDuration) {
        try {
            if (media) {
                var vbuffered = BufferHelper.getBuffered(media);
                var buffered = [];
                var i = void 0;
                for (i = 0; i < vbuffered.length; i++) {
                    buffered.push({ start: vbuffered.start(i), end: vbuffered.end(i) });
                }
                return this.bufferedInfo(buffered, pos, maxHoleDuration);
            }
        }
        catch (error) {
            // this is to catch
            // InvalidStateError: Failed to read the 'buffered' property from 'SourceBuffer':
            // This SourceBuffer has been removed from the parent media source
        }
        return { len: 0, start: pos, end: pos, nextStart: undefined };
    };
    BufferHelper.bufferedInfo = function (buffered, pos, maxHoleDuration) {
        pos = Math.max(0, pos);
        // sort on buffer.start/smaller end (IE does not always return sorted buffered range)
        buffered.sort(function (a, b) {
            var diff = a.start - b.start;
            if (diff) {
                return diff;
            }
            else {
                return b.end - a.end;
            }
        });
        var buffered2 = [];
        if (maxHoleDuration) {
            // there might be some small holes between buffer time range
            // consider that holes smaller than maxHoleDuration are irrelevant and build another
            // buffer time range representations that discards those holes
            for (var i = 0; i < buffered.length; i++) {
                var buf2len = buffered2.length;
                if (buf2len) {
                    var buf2end = buffered2[buf2len - 1].end;
                    // if small hole (value between 0 or maxHoleDuration ) or overlapping (negative)
                    if (buffered[i].start - buf2end < maxHoleDuration) {
                        // merge overlapping time ranges
                        // update lastRange.end only if smaller than item.end
                        // e.g.  [ 1, 15] with  [ 2,8] => [ 1,15] (no need to modify lastRange.end)
                        // whereas [ 1, 8] with  [ 2,15] => [ 1,15] ( lastRange should switch from [1,8] to [1,15])
                        if (buffered[i].end > buf2end) {
                            buffered2[buf2len - 1].end = buffered[i].end;
                        }
                    }
                    else {
                        // big hole
                        buffered2.push(buffered[i]);
                    }
                }
                else {
                    // first value
                    buffered2.push(buffered[i]);
                }
            }
        }
        else {
            buffered2 = buffered;
        }
        var bufferLen = 0;
        // bufferStartNext can possibly be undefined based on the conditional logic below
        var bufferStartNext;
        // bufferStart and bufferEnd are buffer boundaries around current video position
        var bufferStart = pos;
        var bufferEnd = pos;
        for (var i = 0; i < buffered2.length; i++) {
            var start = buffered2[i].start;
            var end = buffered2[i].end;
            // logger.log('buf start/end:' + buffered.start(i) + '/' + buffered.end(i));
            if (pos + maxHoleDuration >= start && pos < end) {
                // play position is inside this buffer TimeRange, retrieve end of buffer position and buffer length
                bufferStart = start;
                bufferEnd = end;
                bufferLen = bufferEnd - pos;
            }
            else if (pos + maxHoleDuration < start) {
                bufferStartNext = start;
                break;
            }
        }
        return {
            len: bufferLen,
            start: bufferStart || 0,
            end: bufferEnd || 0,
            nextStart: bufferStartNext,
        };
    };
    /**
     * Safe method to get buffered property.
     * SourceBuffer.buffered may throw if SourceBuffer is removed from it's MediaSource
     */
    BufferHelper.getBuffered = function (media) {
        try {
            return media.buffered;
        }
        catch (e) {
            logger_1.logger.log('failed to get media.buffered', e);
            return noopBuffered;
        }
    };
    return BufferHelper;
}());
exports.BufferHelper = BufferHelper;
