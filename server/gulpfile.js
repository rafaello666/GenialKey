"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var buildTools = require("turbo-gulp");
var lib_1 = require("turbo-gulp/targets/lib");
var mocha_1 = require("turbo-gulp/targets/mocha");
var gulp_1 = require("gulp");
var minimist_1 = require("minimist");
var options = (0, minimist_1.default)(process.argv.slice(2), {
    string: ["devDist"],
    default: { devDist: undefined },
    alias: { devDist: "dev-dist" },
});
var project = {
    root: __dirname,
    packageJson: "package.json",
    buildDir: "build",
    distDir: "dist",
    srcDir: "src",
    typescript: {}
};
var lib = {
    project: project,
    name: "lib",
    srcDir: "src/lib",
    scripts: ["**/*.ts"],
    mainModule: "index",
    dist: {
        packageJsonMap: function (old) {
            var version = options.devDist !== undefined ? "".concat(old.version, "-build.").concat(options.devDist) : old.version;
            return __assign(__assign({}, old), { version: version, scripts: undefined, private: false });
        },
        npmPublish: {
            tag: options.devDist !== undefined ? "next" : "latest",
        },
    },
    tscOptions: {
        declaration: true,
        skipLibCheck: true,
    },
    typedoc: {
        dir: "typedoc",
        name: "Helpers for V8 coverage files",
        deploy: {
            repository: "git@github.com:demurgos/v8-coverage.git",
            branch: "gh-pages",
        },
    },
    copy: [
        {
            files: ["**/*.json"],
        },
    ],
    clean: {
        dirs: ["build/lib", "dist/lib"],
    },
};
var test = {
    project: project,
    name: "test",
    srcDir: "src",
    scripts: ["test/**/*.ts", "lib/**/*.ts", "e2e/*/*.ts"],
    customTypingsDir: "src/custom-typings",
    tscOptions: {
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        skipLibCheck: true,
    },
    // generateTestMain: true,
    copy: [
        {
            src: "e2e",
            // <project-name>/(project|test-resources)/<any>
            files: ["*/project/**/*", "*/test-resources/**/*"],
            dest: "e2e",
        },
    ],
    clean: {
        dirs: ["build/test"],
    },
};
var libTasks = (0, lib_1.registerLibTasks)(gulp_1.default, lib);
(0, mocha_1.registerMochaTasks)(gulp_1.default, test);
buildTools.projectTasks.registerAll(gulp_1.default, project);
gulp_1.default.task("all:tsconfig.json", gulp_1.default.parallel("lib:tsconfig.json", "test:tsconfig.json"));
gulp_1.default.task("dist", libTasks.dist);
gulp_1.default.task("default", libTasks.dist);
