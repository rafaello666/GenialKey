"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasVariableReferences = hasVariableReferences;
exports.substituteVariablesInAttributes = substituteVariablesInAttributes;
exports.substituteVariables = substituteVariables;
exports.addVariableDefinition = addVariableDefinition;
exports.importVariableDefinition = importVariableDefinition;
var VARIABLE_REPLACEMENT_REGEX = /\{\$([a-zA-Z0-9-_]+)\}/g;
function hasVariableReferences(str) {
    return VARIABLE_REPLACEMENT_REGEX.test(str);
}
function substituteVariablesInAttributes(parsed, attr, attributeNames) {
    if (parsed.variableList !== null || parsed.hasVariableRefs) {
        for (var i = attributeNames.length; i--;) {
            var name_1 = attributeNames[i];
            var value = attr[name_1];
            if (value) {
                attr[name_1] = substituteVariables(parsed, value);
            }
        }
    }
}
function substituteVariables(parsed, value) {
    if (parsed.variableList !== null || parsed.hasVariableRefs) {
        var variableList_1 = parsed.variableList;
        return value.replace(VARIABLE_REPLACEMENT_REGEX, function (variableReference) {
            var variableName = variableReference.substring(2, variableReference.length - 1);
            var variableValue = variableList_1 === null || variableList_1 === void 0 ? void 0 : variableList_1[variableName];
            if (variableValue === undefined) {
                parsed.playlistParsingError || (parsed.playlistParsingError = new Error("Missing preceding EXT-X-DEFINE tag for Variable Reference: \"".concat(variableName, "\"")));
                return variableReference;
            }
            return variableValue;
        });
    }
    return value;
}
function addVariableDefinition(parsed, attr, parentUrl) {
    var variableList = parsed.variableList;
    if (!variableList) {
        parsed.variableList = variableList = {};
    }
    var NAME;
    var VALUE;
    if ('QUERYPARAM' in attr) {
        NAME = attr.QUERYPARAM;
        try {
            var searchParams = new self.URL(parentUrl).searchParams;
            if (searchParams.has(NAME)) {
                VALUE = searchParams.get(NAME);
            }
            else {
                throw new Error("\"".concat(NAME, "\" does not match any query parameter in URI: \"").concat(parentUrl, "\""));
            }
        }
        catch (error) {
            parsed.playlistParsingError || (parsed.playlistParsingError = new Error("EXT-X-DEFINE QUERYPARAM: ".concat(error.message)));
        }
    }
    else {
        NAME = attr.NAME;
        VALUE = attr.VALUE;
    }
    if (NAME in variableList) {
        parsed.playlistParsingError || (parsed.playlistParsingError = new Error("EXT-X-DEFINE duplicate Variable Name declarations: \"".concat(NAME, "\"")));
    }
    else {
        variableList[NAME] = VALUE || '';
    }
}
function importVariableDefinition(parsed, attr, sourceVariableList) {
    var IMPORT = attr.IMPORT;
    if (sourceVariableList && IMPORT in sourceVariableList) {
        var variableList = parsed.variableList;
        if (!variableList) {
            parsed.variableList = variableList = {};
        }
        variableList[IMPORT] = sourceVariableList[IMPORT];
    }
    else {
        parsed.playlistParsingError || (parsed.playlistParsingError = new Error("EXT-X-DEFINE IMPORT attribute not found in Multivariant Playlist: \"".concat(IMPORT, "\"")));
    }
}
