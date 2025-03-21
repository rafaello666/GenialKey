"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tests = void 0;
var path_1 = require("path");
var filesystem_1 = require("../../filesystem");
var defaultExtensionsWhenRunningInTsNode = [
    ".js",
    ".json",
    ".node",
    ".ts",
    ".tsx",
];
exports.tests = [
    {
        name: "should locate path that matches with star and exists",
        absoluteBaseUrl: "/root/",
        paths: {
            "lib/*": ["location/*"],
        },
        existingFiles: [(0, path_1.join)("/root", "location", "mylib", "index.ts")],
        requestedModule: "lib/mylib",
        expectedPath: (0, path_1.dirname)((0, path_1.join)("/root", "location", "mylib", "index.ts")),
        extensions: defaultExtensionsWhenRunningInTsNode,
    },
    {
        name: "should resolve to correct path when many are specified",
        absoluteBaseUrl: "/root/",
        paths: {
            "lib/*": ["foo1/*", "foo2/*", "location/*", "foo3/*"],
        },
        existingFiles: [(0, path_1.join)("/root", "location", "mylib", "index.ts")],
        requestedModule: "lib/mylib",
        extensions: [".ts"],
        expectedPath: (0, path_1.dirname)((0, path_1.join)("/root", "location", "mylib", "index.ts")),
    },
    {
        name: "should locate path that matches with star and prioritize pattern with longest prefix",
        absoluteBaseUrl: "/root/",
        paths: {
            "*": ["location/*"],
            "lib/*": ["location/*"],
        },
        existingFiles: [
            (0, path_1.join)("/root", "location", "lib", "mylib", "index.ts"),
            (0, path_1.join)("/root", "location", "mylib", "index.ts"),
        ],
        requestedModule: "lib/mylib",
        expectedPath: (0, path_1.dirname)((0, path_1.join)("/root", "location", "mylib", "index.ts")),
        extensions: defaultExtensionsWhenRunningInTsNode,
    },
    {
        name: "should locate path that matches with star and exists with extension",
        absoluteBaseUrl: "/root/",
        paths: { "lib/*": ["location/*"] },
        existingFiles: [(0, path_1.join)("/root", "location", "mylib.myext")],
        requestedModule: "lib/mylib",
        extensions: [".js", ".myext"],
        expectedPath: (0, filesystem_1.removeExtension)((0, path_1.join)("/root", "location", "mylib.myext")),
    },
    {
        name: "should resolve request with extension specified",
        absoluteBaseUrl: "/root/",
        paths: { "lib/*": ["location/*"] },
        existingFiles: [(0, path_1.join)("/root", "location", "test.jpg")],
        requestedModule: "lib/test.jpg",
        expectedPath: (0, path_1.join)("/root", "location", "test.jpg"),
        extensions: defaultExtensionsWhenRunningInTsNode,
    },
    {
        name: "should locate path that matches without star and exists",
        absoluteBaseUrl: "/root/",
        paths: {
            "lib/foo": ["location/foo"],
        },
        existingFiles: [(0, path_1.join)("/root", "location", "foo.ts")],
        requestedModule: "lib/foo",
        expectedPath: (0, filesystem_1.removeExtension)((0, path_1.join)("/root", "location", "foo.ts")),
        extensions: defaultExtensionsWhenRunningInTsNode,
    },
    {
        name: "should resolve to parent folder when filename is in subfolder",
        absoluteBaseUrl: "/root/",
        paths: { "lib/*": ["location/*"] },
        existingFiles: [(0, path_1.join)("/root", "location", "mylib", "index.ts")],
        requestedModule: "lib/mylib",
        expectedPath: (0, path_1.dirname)((0, path_1.join)("/root", "location", "mylib", "index.ts")),
        extensions: defaultExtensionsWhenRunningInTsNode,
    },
    {
        name: "should resolve from main field in package.json",
        absoluteBaseUrl: "/root/",
        paths: { "lib/*": ["location/*"] },
        existingFiles: [(0, path_1.join)("/root", "location", "mylib", "kalle.ts")],
        packageJson: { main: "./kalle.ts" },
        requestedModule: "lib/mylib",
        expectedPath: (0, path_1.join)("/root", "location", "mylib", "kalle.ts"),
        extensions: defaultExtensionsWhenRunningInTsNode,
    },
    {
        name: "should resolve from main field in package.json (js)",
        absoluteBaseUrl: "/root",
        paths: { "lib/*": ["location/*"] },
        existingFiles: [(0, path_1.join)("/root", "location", "mylib.js", "kalle.js")],
        packageJson: { main: "./kalle.js" },
        requestedModule: "lib/mylib.js",
        extensions: [".ts", ".js"],
        expectedPath: (0, path_1.join)("/root", "location", "mylib.js", "kalle.js"),
    },
    {
        name: "should resolve from list of fields by priority in package.json",
        absoluteBaseUrl: "/root/",
        paths: { "lib/*": ["location/*"] },
        mainFields: ["missing", "browser", "main"],
        packageJson: { main: "./main.js", browser: "./browser.js" },
        existingFiles: [
            (0, path_1.join)("/root", "location", "mylibjs", "main.js"), // mainFilePath
            (0, path_1.join)("/root", "location", "mylibjs", "browser.js"), // browserFilePath
        ],
        extensions: [".ts", ".js"],
        requestedModule: "lib/mylibjs",
        expectedPath: (0, path_1.join)("/root", "location", "mylibjs", "browser.js"),
    },
    {
        name: "should ignore field mappings to missing files in package.json",
        absoluteBaseUrl: "/root/",
        paths: { "lib/*": ["location/*"] },
        mainFields: ["browser", "main"],
        existingFiles: [(0, path_1.join)("/root", "location", "mylibjs", "kalle.js")],
        requestedModule: "lib/mylibjs",
        packageJson: {
            main: "./kalle.js",
            browser: "./nope.js",
        },
        extensions: [".ts", ".js"],
        expectedPath: (0, path_1.join)("/root", "location", "mylibjs", "kalle.js"),
    },
    {
        name: "should resolve nested main fields",
        absoluteBaseUrl: "/root/",
        paths: { "lib/*": ["location/*"] },
        mainFields: [["esnext", "main"]],
        packageJson: { esnext: { main: "./main.js" } },
        existingFiles: [(0, path_1.join)("/root", "location", "mylibjs", "main.js")],
        extensions: [".ts", ".js"],
        requestedModule: "lib/mylibjs",
        expectedPath: (0, path_1.join)("/root", "location", "mylibjs", "main.js"),
    },
    {
        name: "should ignore advanced field mappings in package.json",
        absoluteBaseUrl: "/root/",
        paths: { "lib/*": ["location/*"] },
        existingFiles: [
            (0, path_1.join)("/root", "location", "mylibjs", "kalle.js"),
            (0, path_1.join)("/root", "location", "mylibjs", "browser.js"),
        ],
        requestedModule: "lib/mylibjs",
        packageJson: {
            main: "./kalle.js",
            browser: { mylibjs: "./browser.js", "./kalle.js": "./browser.js" },
        },
        extensions: [".ts", ".js"],
        expectedPath: (0, path_1.join)("/root", "location", "mylibjs", "kalle.js"),
    },
    {
        name: "should resolve to with the help of baseUrl when not explicitly set",
        absoluteBaseUrl: "/root/",
        paths: {},
        existingFiles: [(0, path_1.join)("/root", "mylib", "index.ts")],
        requestedModule: "mylib",
        expectedPath: (0, path_1.dirname)((0, path_1.join)("/root", "mylib", "index.ts")),
        extensions: defaultExtensionsWhenRunningInTsNode,
    },
    {
        name: "should not resolve with the help of baseUrl when asked not to",
        absoluteBaseUrl: "/root/",
        paths: {},
        addMatchAll: false,
        existingFiles: [(0, path_1.join)("/root", "mylib", "index.ts")],
        requestedModule: "mylib",
        expectedPath: undefined,
        extensions: defaultExtensionsWhenRunningInTsNode,
    },
    {
        name: "should not locate path that does not match",
        absoluteBaseUrl: "/root/",
        paths: { "lib/*": ["location/*"] },
        existingFiles: [(0, path_1.join)("root", "location", "mylib")],
        requestedModule: "mylib",
        expectedPath: undefined,
        extensions: defaultExtensionsWhenRunningInTsNode,
    },
    {
        name: "should not resolve typings file (index.d.ts)",
        absoluteBaseUrl: "/root/",
        paths: {
            "lib/*": ["location/*"],
        },
        existingFiles: [(0, path_1.join)("/root", "location", "mylib", "index.d.ts")],
        requestedModule: "lib/mylib",
        expectedPath: undefined,
        extensions: defaultExtensionsWhenRunningInTsNode,
    },
    {
        name: "should resolve main file with cjs file extension",
        absoluteBaseUrl: "/root/",
        paths: {},
        existingFiles: [(0, path_1.join)("/root", "mylib", "index.cjs")],
        packageJson: {
            main: "./index.cjs",
        },
        requestedModule: "mylib",
        expectedPath: (0, path_1.join)("/root", "mylib", "index.cjs"),
        extensions: defaultExtensionsWhenRunningInTsNode,
    },
];
