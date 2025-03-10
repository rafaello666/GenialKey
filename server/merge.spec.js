"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var fs_1 = require("fs");
var path_1 = require("path");
var lib_1 = require("../lib");
var REPO_ROOT = path_1.default.join(__dirname, "..", "..", "..", "..");
var BENCHES_INPUT_DIR = path_1.default.join(REPO_ROOT, "benches");
var BENCHES_DIR = path_1.default.join(REPO_ROOT, "test-data", "merge", "benches");
var RANGES_DIR = path_1.default.join(REPO_ROOT, "test-data", "merge", "ranges");
var BENCHES_TIMEOUT = 20000; // 20sec
var FIXTURES_DIR = path_1.default.join(REPO_ROOT, "test-data", "bugs");
function loadFixture(name) {
    var content = fs_1.default.readFileSync(path_1.default.resolve(FIXTURES_DIR, "".concat(name, ".json")), { encoding: "UTF-8" });
    return JSON.parse(content);
}
describe("merge", function () {
    describe("Various", function () {
        it("accepts empty arrays for `mergeProcessCovs`", function () {
            var inputs = [];
            var expected = { result: [] };
            var actual = (0, lib_1.mergeProcessCovs)(inputs);
            chai_1.default.assert.deepEqual(actual, expected);
        });
        it("accepts empty arrays for `mergeScriptCovs`", function () {
            var inputs = [];
            var expected = undefined;
            var actual = (0, lib_1.mergeScriptCovs)(inputs);
            chai_1.default.assert.deepEqual(actual, expected);
        });
        it("accepts empty arrays for `mergeFunctionCovs`", function () {
            var inputs = [];
            var expected = undefined;
            var actual = (0, lib_1.mergeFunctionCovs)(inputs);
            chai_1.default.assert.deepEqual(actual, expected);
        });
        it("accepts arrays with a single item for `mergeProcessCovs`", function () {
            var inputs = [
                {
                    result: [
                        {
                            scriptId: "123",
                            url: "/lib.js",
                            functions: [
                                {
                                    functionName: "test",
                                    isBlockCoverage: true,
                                    ranges: [
                                        { startOffset: 0, endOffset: 4, count: 2 },
                                        { startOffset: 1, endOffset: 2, count: 1 },
                                        { startOffset: 2, endOffset: 3, count: 1 },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ];
            var expected = {
                result: [
                    {
                        scriptId: "0",
                        url: "/lib.js",
                        functions: [
                            {
                                functionName: "test",
                                isBlockCoverage: true,
                                ranges: [
                                    { startOffset: 0, endOffset: 4, count: 2 },
                                    { startOffset: 1, endOffset: 3, count: 1 },
                                ],
                            },
                        ],
                    },
                ],
            };
            var actual = (0, lib_1.mergeProcessCovs)(inputs);
            chai_1.default.assert.deepEqual(actual, expected);
        });
        describe("mergeProcessCovs", function () {
            // see: https://github.com/demurgos/v8-coverage/issues/2
            it("handles function coverage merged into block coverage", function () {
                var blockCoverage = loadFixture("issue-2-block-coverage");
                var functionCoverage = loadFixture("issue-2-func-coverage");
                var inputs = [
                    functionCoverage,
                    blockCoverage,
                ];
                var expected = loadFixture("issue-2-expected");
                var actual = (0, lib_1.mergeProcessCovs)(inputs);
                chai_1.default.assert.deepEqual(actual, expected);
            });
            // see: https://github.com/demurgos/v8-coverage/issues/2
            it("handles block coverage merged into function coverage", function () {
                var blockCoverage = loadFixture("issue-2-block-coverage");
                var functionCoverage = loadFixture("issue-2-func-coverage");
                var inputs = [
                    blockCoverage,
                    functionCoverage,
                ];
                var expected = loadFixture("issue-2-expected");
                var actual = (0, lib_1.mergeProcessCovs)(inputs);
                chai_1.default.assert.deepEqual(actual, expected);
            });
        });
        it("accepts arrays with a single item for `mergeScriptCovs`", function () {
            var inputs = [
                {
                    scriptId: "123",
                    url: "/lib.js",
                    functions: [
                        {
                            functionName: "test",
                            isBlockCoverage: true,
                            ranges: [
                                { startOffset: 0, endOffset: 4, count: 2 },
                                { startOffset: 1, endOffset: 2, count: 1 },
                                { startOffset: 2, endOffset: 3, count: 1 },
                            ],
                        },
                    ],
                },
            ];
            var expected = {
                scriptId: "123",
                url: "/lib.js",
                functions: [
                    {
                        functionName: "test",
                        isBlockCoverage: true,
                        ranges: [
                            { startOffset: 0, endOffset: 4, count: 2 },
                            { startOffset: 1, endOffset: 3, count: 1 },
                        ],
                    },
                ],
            };
            var actual = (0, lib_1.mergeScriptCovs)(inputs);
            chai_1.default.assert.deepEqual(actual, expected);
        });
        it("accepts arrays with a single item for `mergeFunctionCovs`", function () {
            var inputs = [
                {
                    functionName: "test",
                    isBlockCoverage: true,
                    ranges: [
                        { startOffset: 0, endOffset: 4, count: 2 },
                        { startOffset: 1, endOffset: 2, count: 1 },
                        { startOffset: 2, endOffset: 3, count: 1 },
                    ],
                },
            ];
            var expected = {
                functionName: "test",
                isBlockCoverage: true,
                ranges: [
                    { startOffset: 0, endOffset: 4, count: 2 },
                    { startOffset: 1, endOffset: 3, count: 1 },
                ],
            };
            var actual = (0, lib_1.mergeFunctionCovs)(inputs);
            chai_1.default.assert.deepEqual(actual, expected);
        });
    });
    describe("ranges", function () {
        var _loop_1 = function (sourceFile) {
            var relPath = path_1.default.relative(RANGES_DIR, sourceFile);
            describe(relPath, function () {
                var content = fs_1.default.readFileSync(sourceFile, { encoding: "UTF-8" });
                var items = JSON.parse(content);
                var _loop_2 = function (item) {
                    var test = function () {
                        var actual = (0, lib_1.mergeProcessCovs)(item.inputs);
                        chai_1.default.assert.deepEqual(actual, item.expected);
                    };
                    switch (item.status) {
                        case "run":
                            it(item.name, test);
                            break;
                        case "only":
                            it.only(item.name, test);
                            break;
                        case "skip":
                            it.skip(item.name, test);
                            break;
                        default:
                            throw new Error("Unexpected status: ".concat(item.status));
                    }
                };
                for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
                    var item = items_1[_i];
                    _loop_2(item);
                }
            });
        };
        for (var _i = 0, _a = getSourceFiles(); _i < _a.length; _i++) {
            var sourceFile = _a[_i];
            _loop_1(sourceFile);
        }
    });
    describe("benches", function () {
        var _loop_3 = function (bench) {
            var BENCHES_TO_SKIP = new Set();
            if (process.env.CI === "true") {
                // Skip very large benchmarks when running continuous integration
                BENCHES_TO_SKIP.add("node@10.11.0");
                BENCHES_TO_SKIP.add("npm@6.4.1");
            }
            var name_1 = path_1.default.basename(bench);
            if (BENCHES_TO_SKIP.has(name_1)) {
                it.skip("".concat(name_1, " (skipped: too large for CI)"), testBench);
            }
            else {
                it(name_1, testBench);
            }
            function testBench() {
                return __awaiter(this, void 0, void 0, function () {
                    var inputFileNames, inputPromises, _i, inputFileNames_1, inputFileName, resolved, inputs, expectedPath, expectedContent, expected, startTime, actual, endTime;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                this.timeout(BENCHES_TIMEOUT);
                                return [4 /*yield*/, fs_1.default.promises.readdir(bench)];
                            case 1:
                                inputFileNames = _a.sent();
                                inputPromises = [];
                                for (_i = 0, inputFileNames_1 = inputFileNames; _i < inputFileNames_1.length; _i++) {
                                    inputFileName = inputFileNames_1[_i];
                                    resolved = path_1.default.join(bench, inputFileName);
                                    inputPromises.push(fs_1.default.promises.readFile(resolved).then(function (buffer) { return JSON.parse(buffer.toString("UTF-8")); }));
                                }
                                return [4 /*yield*/, Promise.all(inputPromises)];
                            case 2:
                                inputs = _a.sent();
                                expectedPath = path_1.default.join(BENCHES_DIR, "".concat(name_1, ".json"));
                                return [4 /*yield*/, fs_1.default.promises.readFile(expectedPath, { encoding: "UTF-8" })];
                            case 3:
                                expectedContent = _a.sent();
                                expected = JSON.parse(expectedContent);
                                startTime = Date.now();
                                actual = (0, lib_1.mergeProcessCovs)(inputs);
                                endTime = Date.now();
                                console.error("Time (".concat(name_1, "): ").concat((endTime - startTime) / 1000));
                                chai_1.default.assert.deepEqual(actual, expected);
                                console.error("OK: ".concat(name_1));
                                return [2 /*return*/];
                        }
                    });
                });
            }
        };
        for (var _i = 0, _a = getBenches(); _i < _a.length; _i++) {
            var bench = _a[_i];
            _loop_3(bench);
        }
    });
});
function getSourceFiles() {
    return getSourcesFrom(RANGES_DIR);
    function getSourcesFrom(dir) {
        var names, _i, names_1, name_2, resolved, stat;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    names = fs_1.default.readdirSync(dir);
                    _i = 0, names_1 = names;
                    _a.label = 1;
                case 1:
                    if (!(_i < names_1.length)) return [3 /*break*/, 6];
                    name_2 = names_1[_i];
                    resolved = path_1.default.join(dir, name_2);
                    stat = fs_1.default.statSync(resolved);
                    if (!stat.isDirectory()) return [3 /*break*/, 3];
                    return [5 /*yield**/, __values(getSourcesFrom(dir))];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, resolved];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    }
}
function getBenches() {
    var names, _i, names_2, name_3, resolved, stat;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                names = fs_1.default.readdirSync(BENCHES_INPUT_DIR);
                _i = 0, names_2 = names;
                _a.label = 1;
            case 1:
                if (!(_i < names_2.length)) return [3 /*break*/, 4];
                name_3 = names_2[_i];
                resolved = path_1.default.join(BENCHES_INPUT_DIR, name_3);
                stat = fs_1.default.statSync(resolved);
                if (!stat.isDirectory()) return [3 /*break*/, 3];
                return [4 /*yield*/, resolved];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4: return [2 /*return*/];
        }
    });
}
