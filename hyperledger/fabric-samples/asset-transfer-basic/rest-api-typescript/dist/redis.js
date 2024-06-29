"use strict";
/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * This sample uses the BullMQ queue system, which is built on top of Redis
 */
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMaxmemoryPolicyNoeviction = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const config = __importStar(require("./config"));
const logger_1 = require("./logger");
/**
 * Check whether the maxmemory-policy config is set to noeviction
 *
 * BullMQ requires this setting in redis
 * For details, see: https://docs.bullmq.io/guide/connections
 */
const isMaxmemoryPolicyNoeviction = async () => {
    let redis;
    const redisOptions = {
        port: config.redisPort,
        host: config.redisHost,
        username: config.redisUsername,
        password: config.redisPassword,
    };
    try {
        redis = new ioredis_1.default(redisOptions);
        const maxmemoryPolicyConfig = await redis.config('GET', 'maxmemory-policy');
        logger_1.logger.debug({ maxmemoryPolicyConfig }, 'Got maxmemory-policy config');
        if (maxmemoryPolicyConfig.length == 2 &&
            'maxmemory-policy' === maxmemoryPolicyConfig[0] &&
            'noeviction' === maxmemoryPolicyConfig[1]) {
            return true;
        }
    }
    finally {
        if (redis != undefined) {
            redis.disconnect();
        }
    }
    return false;
};
exports.isMaxmemoryPolicyNoeviction = isMaxmemoryPolicyNoeviction;
//# sourceMappingURL=redis.js.map