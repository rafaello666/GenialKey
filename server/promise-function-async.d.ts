export type Options = [
    {
        allowAny?: boolean;
        allowedPromiseNames?: string[];
        checkArrowFunctions?: boolean;
        checkFunctionDeclarations?: boolean;
        checkFunctionExpressions?: boolean;
        checkMethodDeclarations?: boolean;
    }
];
export type MessageIds = 'missingAsync';
declare const _default: import("@typescript-eslint/utils/ts-eslint").RuleModule<"missingAsync", Options, import("../../rules").ESLintPluginDocs, import("@typescript-eslint/utils/ts-eslint").RuleListener>;
export default _default;
//# sourceMappingURL=promise-function-async.d.ts.map