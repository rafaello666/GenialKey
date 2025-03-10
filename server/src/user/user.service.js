"use strict";
// src/users/users.service.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const _prisma_client_1 = require("@prisma.client");
const bcrypt = __importStar(require("bcrypt"));
let UsersService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UsersService = _classThis = class {
        constructor(prisma) {
            this.prisma = prisma;
        }
        /**
         * Tworzy nowego użytkownika.
         * Hasło jest hashowane za pomocą bcrypt z saltRounds = 10.
         */
        async createUser(username, plainPassword, role = _prisma_client_1.UserRole.USER) {
            const existing = await this.prisma.user.findUnique({ where: { username } });
            if (existing) {
                throw new common_1.ConflictException('Username already taken');
            }
            // Hashowanie hasła
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(plainPassword, saltRounds);
            return this.prisma.user.create({
                data: {
                    username,
                    passwordHash,
                    role,
                },
            });
        }
        /**
         * Znajduje użytkownika po nazwie użytkownika (np. do logowania).
         * Zwraca pełen obiekt User (w tym passwordHash),
         * dlatego w kontrolerze/strategii trzeba uważać, by nie zwracać hasła "na zewnątrz".
         */
        async findByUsername(username) {
            return this.prisma.user.findUnique({
                where: { username },
            });
        }
        /**
         * Znajduje użytkownika po ID.
         */
        async findById(id) {
            return this.prisma.user.findUnique({
                where: { id },
            });
        }
        /**
         * Prosta aktualizacja nazwy użytkownika lub hasła.
         * Jeśli chcesz umożliwić zmianę hasła, zhashuj je ponownie.
         */
        async updateUser(id, username, newPassword) {
            // Wczytanie użytkownika
            const user = await this.findById(id);
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            const dataToUpdate = {};
            if (username)
                dataToUpdate.username = username;
            if (newPassword) {
                const saltRounds = 10;
                dataToUpdate.passwordHash = await bcrypt.hash(newPassword, saltRounds);
            }
            return this.prisma.user.update({
                where: { id },
                data: dataToUpdate,
            });
        }
        /**
         * Usunięcie użytkownika.
         */
        async deleteUser(id) {
            return this.prisma.user.delete({
                where: { id },
            });
        }
    };
    __setFunctionName(_classThis, "UsersService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UsersService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UsersService = _classThis;
})();
exports.UsersService = UsersService;
