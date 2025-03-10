"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("./core");
var validation_1 = require("./validation");
var applicator_1 = require("./applicator");
var dynamic_1 = require("./dynamic");
var next_1 = require("./next");
var unevaluated_1 = require("./unevaluated");
var format_1 = require("./format");
var metadata_1 = require("./metadata");
var draft2020Vocabularies = [
    dynamic_1.default,
    core_1.default,
    validation_1.default,
    (0, applicator_1.default)(true),
    format_1.default,
    metadata_1.metadataVocabulary,
    metadata_1.contentVocabulary,
    next_1.default,
    unevaluated_1.default,
];
exports.default = draft2020Vocabularies;
