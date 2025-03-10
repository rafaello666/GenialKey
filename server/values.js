"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("../../compile/util");
var codegen_1 = require("../../compile/codegen");
var metadata_1 = require("./metadata");
var nullable_1 = require("./nullable");
var error_1 = require("./error");
var def = {
    keyword: "values",
    schemaType: "object",
    error: (0, error_1.typeError)("object"),
    code: function (cxt) {
        (0, metadata_1.checkMetadata)(cxt);
        var gen = cxt.gen, data = cxt.data, schema = cxt.schema, it = cxt.it;
        var _a = (0, nullable_1.checkNullableObject)(cxt, data), valid = _a[0], cond = _a[1];
        if ((0, util_1.alwaysValidSchema)(it, schema)) {
            gen.if((0, codegen_1.not)((0, codegen_1.or)(cond, valid)), function () { return cxt.error(); });
        }
        else {
            gen.if(cond);
            gen.assign(valid, validateMap());
            gen.elseIf((0, codegen_1.not)(valid));
            cxt.error();
            gen.endIf();
        }
        cxt.ok(valid);
        function validateMap() {
            var _valid = gen.name("valid");
            if (it.allErrors) {
                var validMap_1 = gen.let("valid", true);
                validateValues(function () { return gen.assign(validMap_1, false); });
                return validMap_1;
            }
            gen.var(_valid, true);
            validateValues(function () { return gen.break(); });
            return _valid;
            function validateValues(notValid) {
                gen.forIn("key", data, function (key) {
                    cxt.subschema({
                        keyword: "values",
                        dataProp: key,
                        dataPropType: util_1.Type.Str,
                    }, _valid);
                    gen.if((0, codegen_1.not)(_valid), notValid);
                });
            }
        }
    },
};
exports.default = def;
