"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypingResultController = void 0;
var common_1 = require("@nestjs/common");
var TypingResultController = function () {
    var _classDecorators = [(0, common_1.Controller)('typing-results')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _create_decorators;
    var _getResultsForLesson_decorators;
    var _getUserResults_decorators;
    var TypingResultController = _classThis = /** @class */ (function () {
        function TypingResultController_1(typingResultService) {
            this.typingResultService = (__runInitializers(this, _instanceExtraInitializers), typingResultService);
        }
        TypingResultController_1.prototype.create = function (body) {
            var userId = body.userId, lessonId = body.lessonId, wpm = body.wpm, accuracy = body.accuracy;
            return this.typingResultService.recordResult(userId, lessonId, wpm, accuracy);
        };
        TypingResultController_1.prototype.getResultsForLesson = function (lessonId) {
            return this.typingResultService.getResultsForLesson(lessonId);
        };
        TypingResultController_1.prototype.getUserResults = function (userId) {
            return this.typingResultService.getUserResults(userId);
        };
        return TypingResultController_1;
    }());
    __setFunctionName(_classThis, "TypingResultController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _create_decorators = [(0, common_1.Post)()];
        _getResultsForLesson_decorators = [(0, common_1.Get)('lesson/:lessonId')];
        _getUserResults_decorators = [(0, common_1.Get)('user/:userId')];
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getResultsForLesson_decorators, { kind: "method", name: "getResultsForLesson", static: false, private: false, access: { has: function (obj) { return "getResultsForLesson" in obj; }, get: function (obj) { return obj.getResultsForLesson; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUserResults_decorators, { kind: "method", name: "getUserResults", static: false, private: false, access: { has: function (obj) { return "getUserResults" in obj; }, get: function (obj) { return obj.getUserResults; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TypingResultController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TypingResultController = _classThis;
}();
exports.TypingResultController = TypingResultController;
