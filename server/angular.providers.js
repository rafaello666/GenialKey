"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.angularProviders = void 0;
var core_1 = require("@nestjs/core");
var abstract_loader_1 = require("./loaders/abstract.loader");
var express_loader_1 = require("./loaders/express.loader");
var fastify_loader_1 = require("./loaders/fastify.loader");
var noop_loader_1 = require("./loaders/noop.loader");
exports.angularProviders = [
    {
        provide: abstract_loader_1.AbstractLoader,
        useFactory: function (httpAdapterHost) {
            if (!httpAdapterHost) {
                return new noop_loader_1.NoopLoader();
            }
            var httpAdapter = httpAdapterHost.httpAdapter;
            if (httpAdapter &&
                httpAdapter.constructor &&
                httpAdapter.constructor.name === 'FastifyAdapter') {
                return new fastify_loader_1.FastifyLoader();
            }
            return new express_loader_1.ExpressLoader();
        },
        inject: [core_1.HttpAdapterHost],
    },
];
