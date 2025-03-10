"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const stats_service_1 = require("./stats.service");
describe('StatsService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [stats_service_1.StatsService],
        }).compile();
        service = module.get(stats_service_1.StatsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
