"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Vendor
var rollup_plugin_commonjs_1 = require("rollup-plugin-commonjs");
var rollup_plugin_filesize_1 = require("rollup-plugin-filesize");
var rollup_plugin_node_resolve_1 = require("rollup-plugin-node-resolve");
var rollup_plugin_terser_1 = require("rollup-plugin-terser");
var rollup_plugin_typescript2_1 = require("rollup-plugin-typescript2");
// Package
// @ts-ignore: JSON is imported without any issue, TSLint still raises issues
var package_json_1 = require("./package.json");
var input = './src/index.ts';
var name = 'WebGLConstants';
var plugins = function (_a) {
    var _b = _a.isUMD, isUMD = _b === void 0 ? false : _b, _c = _a.isCJS, isCJS = _c === void 0 ? false : _c, _d = _a.isES, isES = _d === void 0 ? false : _d;
    return [
        (0, rollup_plugin_node_resolve_1.default)(),
        (isUMD || isCJS) && (0, rollup_plugin_commonjs_1.default)(),
        (0, rollup_plugin_typescript2_1.default)({
            typescript: require('typescript'),
            useTsconfigDeclarationDir: true,
        }),
        !isES && !process.env.ROLLUP_WATCH && (0, rollup_plugin_terser_1.terser)(),
        !isES && !process.env.ROLLUP_WATCH && (0, rollup_plugin_filesize_1.default)(),
    ];
};
exports.default = [
    {
        input: input,
        output: [
            {
                exports: 'named',
                file: package_json_1.default.browser,
                format: 'umd',
                name: name,
            },
        ],
        plugins: plugins({ isUMD: true }),
        watch: {
            include: 'src/**',
        },
    },
    {
        input: input,
        output: [
            {
                exports: 'named',
                file: package_json_1.default.main,
                format: 'cjs',
            },
        ],
        plugins: plugins({ isCJS: true }),
        watch: {
            include: 'src/**',
        },
    },
    {
        input: input,
        output: [
            {
                file: package_json_1.default.module,
                format: 'es',
                name: name,
            },
        ],
        plugins: plugins({ isES: true }),
        watch: {
            include: 'src/**',
        },
    },
];
