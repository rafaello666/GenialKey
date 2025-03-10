"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("..");
var tsd_1 = require("tsd");
var parsed = __1.default.parse('foo');
(0, tsd_1.expectType)(parsed);
var parsed2 = __1.default.parse('foo', {
    domainHost: true,
    scheme: 'https',
    unicodeSupport: false
});
(0, tsd_1.expectType)(parsed2);
(0, tsd_1.expectType)({});
(0, tsd_1.expectDeprecated)({});
(0, tsd_1.expectType)({});
(0, tsd_1.expectDeprecated)({});
