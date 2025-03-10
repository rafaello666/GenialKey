"use strict";
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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileController = void 0;
var common_1 = require("@nestjs/common");
var passport_1 = require("@nestjs/passport");
var ProfileController = function () {
    var _a;
    var __decorators;
    var __initializers = [];
    var __extraInitializers = [];
    var __decorators_1;
    var __initializers_1 = [];
    var __extraInitializers_1 = [];
    return _a = /** @class */ (function () {
            function ProfileController() {
                this. = __runInitializers(this, __initializers, void 0);
                this. = (__runInitializers(this, __extraInitializers), __runInitializers(this, __initializers_1, void 0));
                __runInitializers(this, __extraInitializers_1);
            }
            ProfileController.prototype.getProfile = function (req) {
                return {
                    message: 'Secured data',
                    user: req.user,
                };
            };
            ;
            return ProfileController;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __decorators = [(0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'))];
            __decorators_1 = [(0, common_1.Get)()];
            __esDecorate(null, null, __decorators, { kind: "field", name: "", static: false, private: false, access: { has: function (obj) { return "" in obj; }, get: function (obj) { return obj.; }, set: function (obj, value) { obj. = value; } }, metadata: _metadata }, __initializers, __extraInitializers);
            __esDecorate(null, null, __decorators_1, { kind: "field", name: "", static: false, private: false, access: { has: function (obj) { return "" in obj; }, get: function (obj) { return obj.; }, set: function (obj, value) { obj. = value; } }, metadata: _metadata }, __initializers_1, __extraInitializers_1);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ProfileController = ProfileController;
