"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("./core");
var validation_1 = require("./validation");
var applicator_1 = require("./applicator");
var format_1 = require("./format");
var metadata_1 = require("./metadata");
var draft7Vocabularies = [
    core_1.default,
    validation_1.default,
    (0, applicator_1.default)(),
    format_1.default,
    metadata_1.metadataVocabulary,
    metadata_1.contentVocabulary,
];
exports.default = draft7Vocabularies;
