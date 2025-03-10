"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleReadableStreamLike = scheduleReadableStreamLike;
var scheduleAsyncIterable_1 = require("./scheduleAsyncIterable");
var isReadableStreamLike_1 = require("../util/isReadableStreamLike");
function scheduleReadableStreamLike(input, scheduler) {
    return (0, scheduleAsyncIterable_1.scheduleAsyncIterable)((0, isReadableStreamLike_1.readableStreamLikeToAsyncGenerator)(input), scheduler);
}
