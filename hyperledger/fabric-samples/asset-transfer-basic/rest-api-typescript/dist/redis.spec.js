"use strict";
/*
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("./redis");
const mockRedisConfig = jest.fn();
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => {
        return {
            config: mockRedisConfig,
            disconnect: jest.fn(),
        };
    });
});
jest.mock('./config');
describe('Redis', () => {
    beforeEach(() => {
        mockRedisConfig.mockClear();
    });
    describe('isMaxmemoryPolicyNoeviction', () => {
        it('returns true when the maxmemory-policy is noeviction', async () => {
            mockRedisConfig.mockReturnValue(['maxmemory-policy', 'noeviction']);
            expect(await (0, redis_1.isMaxmemoryPolicyNoeviction)()).toBe(true);
        });
        it('returns false when the maxmemory-policy is not noeviction', async () => {
            mockRedisConfig.mockReturnValue([
                'maxmemory-policy',
                'allkeys-lru',
            ]);
            expect(await (0, redis_1.isMaxmemoryPolicyNoeviction)()).toBe(false);
        });
    });
});
//# sourceMappingURL=redis.spec.js.map