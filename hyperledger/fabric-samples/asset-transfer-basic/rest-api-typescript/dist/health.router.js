"use strict";
/*
 * SPDX-License-Identifier: Apache-2.0
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
exports.healthRouter = void 0;
const express_1 = __importDefault(require("express"));
const http_status_codes_1 = require("http-status-codes");
const fabric_1 = require("./fabric");
const logger_1 = require("./logger");
const config = __importStar(require("./config"));
const jobs_1 = require("./jobs");
const { SERVICE_UNAVAILABLE, OK } = http_status_codes_1.StatusCodes;
exports.healthRouter = express_1.default.Router();
/*
 * Example of possible health endpoints for use in a cloud environment
 */
exports.healthRouter.get('/ready', (_req, res) => res.status(OK).json({
    status: (0, http_status_codes_1.getReasonPhrase)(OK),
    timestamp: new Date().toISOString(),
}));
exports.healthRouter.get('/live', async (req, res) => {
    var _a, _b;
    logger_1.logger.debug(req.body, 'Liveness request received');
    try {
        const submitQueue = req.app.locals.jobq;
        const qsccOrg1 = (_a = req.app.locals[config.mspIdOrg1]) === null || _a === void 0 ? void 0 : _a.qsccContract;
        const qsccOrg2 = (_b = req.app.locals[config.mspIdOrg2]) === null || _b === void 0 ? void 0 : _b.qsccContract;
        await Promise.all([
            (0, fabric_1.getBlockHeight)(qsccOrg1),
            (0, fabric_1.getBlockHeight)(qsccOrg2),
            (0, jobs_1.getJobCounts)(submitQueue),
        ]);
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Error processing liveness request');
        return res.status(SERVICE_UNAVAILABLE).json({
            status: (0, http_status_codes_1.getReasonPhrase)(SERVICE_UNAVAILABLE),
            timestamp: new Date().toISOString(),
        });
    }
    return res.status(OK).json({
        status: (0, http_status_codes_1.getReasonPhrase)(OK),
        timestamp: new Date().toISOString(),
    });
});
//# sourceMappingURL=health.router.js.map