"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const stats_controller_1 = require("./stats.controller");
describe('StatsController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [stats_controller_1.StatsController],
        }).compile();
        controller = module.get(stats_controller_1.StatsController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
