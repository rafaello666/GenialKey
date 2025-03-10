"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dynamicAnchor_1 = require("./dynamicAnchor");
var util_1 = require("../../compile/util");
var def = {
    keyword: "$recursiveAnchor",
    schemaType: "boolean",
    code: function (cxt) {
        if (cxt.schema)
            (0, dynamicAnchor_1.dynamicAnchor)(cxt, "");
        else
            (0, util_1.checkStrictMode)(cxt.it, "$recursiveAnchor: false is ignored");
    },
};
exports.default = def;
