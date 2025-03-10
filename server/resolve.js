"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inlineRef = inlineRef;
exports.getFullPath = getFullPath;
exports._getFullPath = _getFullPath;
exports.normalizeId = normalizeId;
exports.resolveUrl = resolveUrl;
exports.getSchemaRefs = getSchemaRefs;
var util_1 = require("./util");
var equal = require("fast-deep-equal");
var traverse = require("json-schema-traverse");
// TODO refactor to use keyword definitions
var SIMPLE_INLINED = new Set([
    "type",
    "format",
    "pattern",
    "maxLength",
    "minLength",
    "maxProperties",
    "minProperties",
    "maxItems",
    "minItems",
    "maximum",
    "minimum",
    "uniqueItems",
    "multipleOf",
    "required",
    "enum",
    "const",
]);
function inlineRef(schema, limit) {
    if (limit === void 0) { limit = true; }
    if (typeof schema == "boolean")
        return true;
    if (limit === true)
        return !hasRef(schema);
    if (!limit)
        return false;
    return countKeys(schema) <= limit;
}
var REF_KEYWORDS = new Set([
    "$ref",
    "$recursiveRef",
    "$recursiveAnchor",
    "$dynamicRef",
    "$dynamicAnchor",
]);
function hasRef(schema) {
    for (var key in schema) {
        if (REF_KEYWORDS.has(key))
            return true;
        var sch = schema[key];
        if (Array.isArray(sch) && sch.some(hasRef))
            return true;
        if (typeof sch == "object" && hasRef(sch))
            return true;
    }
    return false;
}
function countKeys(schema) {
    var count = 0;
    for (var key in schema) {
        if (key === "$ref")
            return Infinity;
        count++;
        if (SIMPLE_INLINED.has(key))
            continue;
        if (typeof schema[key] == "object") {
            (0, util_1.eachItem)(schema[key], function (sch) { return (count += countKeys(sch)); });
        }
        if (count === Infinity)
            return Infinity;
    }
    return count;
}
function getFullPath(resolver, id, normalize) {
    if (id === void 0) { id = ""; }
    if (normalize !== false)
        id = normalizeId(id);
    var p = resolver.parse(id);
    return _getFullPath(resolver, p);
}
function _getFullPath(resolver, p) {
    var serialized = resolver.serialize(p);
    return serialized.split("#")[0] + "#";
}
var TRAILING_SLASH_HASH = /#\/?$/;
function normalizeId(id) {
    return id ? id.replace(TRAILING_SLASH_HASH, "") : "";
}
function resolveUrl(resolver, baseId, id) {
    id = normalizeId(id);
    return resolver.resolve(baseId, id);
}
var ANCHOR = /^[a-z_][-a-z0-9._]*$/i;
function getSchemaRefs(schema, baseId) {
    var _this = this;
    if (typeof schema == "boolean")
        return {};
    var _a = this.opts, schemaId = _a.schemaId, uriResolver = _a.uriResolver;
    var schId = normalizeId(schema[schemaId] || baseId);
    var baseIds = { "": schId };
    var pathPrefix = getFullPath(uriResolver, schId, false);
    var localRefs = {};
    var schemaRefs = new Set();
    traverse(schema, { allKeys: true }, function (sch, jsonPtr, _, parentJsonPtr) {
        if (parentJsonPtr === undefined)
            return;
        var fullPath = pathPrefix + jsonPtr;
        var innerBaseId = baseIds[parentJsonPtr];
        if (typeof sch[schemaId] == "string")
            innerBaseId = addRef.call(_this, sch[schemaId]);
        addAnchor.call(_this, sch.$anchor);
        addAnchor.call(_this, sch.$dynamicAnchor);
        baseIds[jsonPtr] = innerBaseId;
        function addRef(ref) {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            var _resolve = this.opts.uriResolver.resolve;
            ref = normalizeId(innerBaseId ? _resolve(innerBaseId, ref) : ref);
            if (schemaRefs.has(ref))
                throw ambiguos(ref);
            schemaRefs.add(ref);
            var schOrRef = this.refs[ref];
            if (typeof schOrRef == "string")
                schOrRef = this.refs[schOrRef];
            if (typeof schOrRef == "object") {
                checkAmbiguosRef(sch, schOrRef.schema, ref);
            }
            else if (ref !== normalizeId(fullPath)) {
                if (ref[0] === "#") {
                    checkAmbiguosRef(sch, localRefs[ref], ref);
                    localRefs[ref] = sch;
                }
                else {
                    this.refs[ref] = fullPath;
                }
            }
            return ref;
        }
        function addAnchor(anchor) {
            if (typeof anchor == "string") {
                if (!ANCHOR.test(anchor))
                    throw new Error("invalid anchor \"".concat(anchor, "\""));
                addRef.call(this, "#".concat(anchor));
            }
        }
    });
    return localRefs;
    function checkAmbiguosRef(sch1, sch2, ref) {
        if (sch2 !== undefined && !equal(sch1, sch2))
            throw ambiguos(ref);
    }
    function ambiguos(ref) {
        return new Error("reference \"".concat(ref, "\" resolves to more than one schema"));
    }
}
