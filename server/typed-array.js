"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sliceUint8 = sliceUint8;
function sliceUint8(array, start, end) {
    // @ts-expect-error This polyfills IE11 usage of Uint8Array slice.
    // It always exists in the TypeScript definition so fails, but it fails at runtime on IE11.
    return Uint8Array.prototype.slice
        ? array.slice(start, end)
        : new Uint8Array(Array.prototype.slice.call(array, start, end));
}
