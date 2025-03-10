"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createObject = createObject;
function createObject(keys, values) {
    return keys.reduce(function (result, key, i) { return ((result[key] = values[i]), result); }, {});
}
