"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaHasRulesForType = schemaHasRulesForType;
exports.shouldUseGroup = shouldUseGroup;
exports.shouldUseRule = shouldUseRule;
function schemaHasRulesForType(_a, type) {
    var schema = _a.schema, self = _a.self;
    var group = self.RULES.types[type];
    return group && group !== true && shouldUseGroup(schema, group);
}
function shouldUseGroup(schema, group) {
    return group.rules.some(function (rule) { return shouldUseRule(schema, rule); });
}
function shouldUseRule(schema, rule) {
    var _a;
    return (schema[rule.keyword] !== undefined ||
        ((_a = rule.definition.implements) === null || _a === void 0 ? void 0 : _a.some(function (kwd) { return schema[kwd] !== undefined; })));
}
