"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Filesystem = require("../filesystem");
var path = require("path");
describe("filesystem", function () {
    var fileThatExists = path.join(__dirname, "../../package.json");
    var fileThatNotExists = path.join(__dirname, "../../package2.json");
    it("should find file that exists, sync", function () {
        var result = Filesystem.fileExistsSync(fileThatExists);
        expect(result).toBe(true);
    });
    it("should not find file that not exists, sync", function () {
        var result = Filesystem.fileExistsSync(fileThatNotExists);
        expect(result).toBe(false);
    });
    it("should find file that exists, async", function (done) {
        Filesystem.fileExistsAsync(fileThatExists, function (_err, result) {
            try {
                expect(result).toBe(true);
                done();
            }
            catch (error) {
                done(error);
            }
        });
    });
    it("should not find file that not exists, async", function (done) {
        Filesystem.fileExistsAsync(fileThatNotExists, function (_err, result) {
            try {
                expect(result).toBe(false);
                done();
            }
            catch (error) {
                done(error);
            }
        });
    });
    it("should load json, sync", function () {
        var result = Filesystem.readJsonFromDiskSync(fileThatExists);
        expect(result);
        expect(result.main).toBe("lib/index.js");
    });
    it("should load json, async", function (done) {
        Filesystem.readJsonFromDiskAsync(fileThatExists, function (_err, result) {
            try {
                expect(result).toBeTruthy();
                expect(result.main).toBe("lib/index.js");
                done();
            }
            catch (error) {
                done(error);
            }
        });
    });
});
