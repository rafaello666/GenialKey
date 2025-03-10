"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var properties_1 = require("./properties");
var def = {
    keyword: "optionalProperties",
    schemaType: "object",
    error: properties_1.error,
    code: function (cxt) {
        if (cxt.parentSchema.properties)
            return;
        (0, properties_1.validateProperties)(cxt);
    },
};
exports.default = def;
