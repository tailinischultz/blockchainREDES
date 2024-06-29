"use strict";
/*
 * SPDX-License-Identifier: Apache-2.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobsRouter = void 0;
const express_1 = __importDefault(require("express"));
const http_status_codes_1 = require("http-status-codes");
const jobs_1 = require("./jobs");
const logger_1 = require("./logger");
const { INTERNAL_SERVER_ERROR, NOT_FOUND, OK } = http_status_codes_1.StatusCodes;
exports.jobsRouter = express_1.default.Router();
exports.jobsRouter.get('/:jobId', async (req, res) => {
    const jobId = req.params.jobId;
    logger_1.logger.debug('Read request received for job ID %s', jobId);
    try {
        const submitQueue = req.app.locals.jobq;
        const jobSummary = await (0, jobs_1.getJobSummary)(submitQueue, jobId);
        return res.status(OK).json(jobSummary);
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Error processing read request for job ID %s', jobId);
        if (err instanceof jobs_1.JobNotFoundError) {
            return res.status(NOT_FOUND).json({
                status: (0, http_status_codes_1.getReasonPhrase)(NOT_FOUND),
                timestamp: new Date().toISOString(),
            });
        }
        return res.status(INTERNAL_SERVER_ERROR).json({
            status: (0, http_status_codes_1.getReasonPhrase)(INTERNAL_SERVER_ERROR),
            timestamp: new Date().toISOString(),
        });
    }
});
//# sourceMappingURL=jobs.router.js.map