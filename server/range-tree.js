"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RangeTree = void 0;
var RangeTree = /** @class */ (function () {
    function RangeTree(start, end, delta, children) {
        this.start = start;
        this.end = end;
        this.delta = delta;
        this.children = children;
    }
    /**
     * @precodition `ranges` are well-formed and pre-order sorted
     */
    RangeTree.fromSortedRanges = function (ranges) {
        var _a;
        var root;
        // Stack of parent trees and parent counts.
        var stack = [];
        for (var _i = 0, ranges_1 = ranges; _i < ranges_1.length; _i++) {
            var range = ranges_1[_i];
            var node = new RangeTree(range.startOffset, range.endOffset, range.count, []);
            if (root === undefined) {
                root = node;
                stack.push([node, range.count]);
                continue;
            }
            var parent_1 = void 0;
            var parentCount = void 0;
            while (true) {
                _a = stack[stack.length - 1], parent_1 = _a[0], parentCount = _a[1];
                // assert: `top !== undefined` (the ranges are sorted)
                if (range.startOffset < parent_1.end) {
                    break;
                }
                else {
                    stack.pop();
                }
            }
            node.delta -= parentCount;
            parent_1.children.push(node);
            stack.push([node, range.count]);
        }
        return root;
    };
    RangeTree.prototype.normalize = function () {
        var children = [];
        var curEnd;
        var head;
        var tail = [];
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (head === undefined) {
                head = child;
            }
            else if (child.delta === head.delta && child.start === curEnd) {
                tail.push(child);
            }
            else {
                endChain();
                head = child;
            }
            curEnd = child.end;
        }
        if (head !== undefined) {
            endChain();
        }
        if (children.length === 1) {
            var child = children[0];
            if (child.start === this.start && child.end === this.end) {
                this.delta += child.delta;
                this.children = child.children;
                // `.lazyCount` is zero for both (both are after normalization)
                return;
            }
        }
        this.children = children;
        function endChain() {
            if (tail.length !== 0) {
                head.end = tail[tail.length - 1].end;
                for (var _i = 0, tail_1 = tail; _i < tail_1.length; _i++) {
                    var tailTree = tail_1[_i];
                    for (var _a = 0, _b = tailTree.children; _a < _b.length; _a++) {
                        var subChild = _b[_a];
                        subChild.delta += tailTree.delta - head.delta;
                        head.children.push(subChild);
                    }
                }
                tail.length = 0;
            }
            head.normalize();
            children.push(head);
        }
    };
    /**
     * @precondition `tree.start < value && value < tree.end`
     * @return RangeTree Right part
     */
    RangeTree.prototype.split = function (value) {
        var leftChildLen = this.children.length;
        var mid;
        // TODO(perf): Binary search (check overhead)
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            if (child.start < value && value < child.end) {
                mid = child.split(value);
                leftChildLen = i + 1;
                break;
            }
            else if (child.start >= value) {
                leftChildLen = i;
                break;
            }
        }
        var rightLen = this.children.length - leftChildLen;
        var rightChildren = this.children.splice(leftChildLen, rightLen);
        if (mid !== undefined) {
            rightChildren.unshift(mid);
        }
        var result = new RangeTree(value, this.end, this.delta, rightChildren);
        this.end = value;
        return result;
    };
    /**
     * Get the range coverages corresponding to the tree.
     *
     * The ranges are pre-order sorted.
     */
    RangeTree.prototype.toRanges = function () {
        var ranges = [];
        // Stack of parent trees and counts.
        var stack = [[this, 0]];
        while (stack.length > 0) {
            var _a = stack.pop(), cur = _a[0], parentCount = _a[1];
            var count = parentCount + cur.delta;
            ranges.push({ startOffset: cur.start, endOffset: cur.end, count: count });
            for (var i = cur.children.length - 1; i >= 0; i--) {
                stack.push([cur.children[i], count]);
            }
        }
        return ranges;
    };
    return RangeTree;
}());
exports.RangeTree = RangeTree;
