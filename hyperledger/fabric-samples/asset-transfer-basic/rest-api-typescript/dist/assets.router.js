"use strict";
/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * This sample is intended to work with the basic asset transfer
 * chaincode which imposes some constraints on what is possible here.
 *
 * For example,
 *  - There is no validation for Asset IDs
 *  - There are no error codes from the chaincode
 *
 * To avoid timeouts, long running tasks should be decoupled from HTTP request
 * processing
 *
 * Submit transactions can potentially be very long running, especially if the
 * transaction fails and needs to be retried one or more times
 *
 * To allow requests to respond quickly enough, this sample queues submit
 * requests for processing asynchronously and immediately returns 202 Accepted
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetsRouter = void 0;
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const http_status_codes_1 = require("http-status-codes");
const errors_1 = require("./errors");
const fabric_1 = require("./fabric");
const jobs_1 = require("./jobs");
const logger_1 = require("./logger");
const { ACCEPTED, BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } = http_status_codes_1.StatusCodes;
exports.assetsRouter = express_1.default.Router();
exports.assetsRouter.get('/', async (req, res) => {
    var _a;
    logger_1.logger.debug('Get all assets request received');
    try {
        const mspId = req.user;
        const contract = (_a = req.app.locals[mspId]) === null || _a === void 0 ? void 0 : _a.assetContract;
        const data = await (0, fabric_1.evatuateTransaction)(contract, 'GetAllAssets');
        let assets = [];
        if (data.length > 0) {
            assets = JSON.parse(data.toString());
        }
        return res.status(OK).json(assets);
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Error processing get all assets request');
        return res.status(INTERNAL_SERVER_ERROR).json({
            status: (0, http_status_codes_1.getReasonPhrase)(INTERNAL_SERVER_ERROR),
            timestamp: new Date().toISOString(),
        });
    }
});
exports.assetsRouter.post('/', (0, express_validator_1.body)().isObject().withMessage('body must contain an asset object'), (0, express_validator_1.body)('ID', 'must be a string').notEmpty(), (0, express_validator_1.body)('Color', 'must be a string').notEmpty(), (0, express_validator_1.body)('Size', 'must be a number').isNumeric(), (0, express_validator_1.body)('Owner', 'must be a string').notEmpty(), (0, express_validator_1.body)('AppraisedValue', 'must be a number').isNumeric(), async (req, res) => {
    logger_1.logger.debug(req.body, 'Create asset request received');
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(BAD_REQUEST).json({
            status: (0, http_status_codes_1.getReasonPhrase)(BAD_REQUEST),
            reason: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            timestamp: new Date().toISOString(),
            errors: errors.array(),
        });
    }
    const mspId = req.user;
    const assetId = req.body.ID;
    try {
        const submitQueue = req.app.locals.jobq;
        const jobId = await (0, jobs_1.addSubmitTransactionJob)(submitQueue, mspId, 'CreateAsset', assetId, req.body.Color, req.body.Size, req.body.Owner, req.body.AppraisedValue);
        return res.status(ACCEPTED).json({
            status: (0, http_status_codes_1.getReasonPhrase)(ACCEPTED),
            jobId: jobId,
            timestamp: new Date().toISOString(),
        });
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Error processing create asset request for asset ID %s', assetId);
        return res.status(INTERNAL_SERVER_ERROR).json({
            status: (0, http_status_codes_1.getReasonPhrase)(INTERNAL_SERVER_ERROR),
            timestamp: new Date().toISOString(),
        });
    }
});
exports.assetsRouter.options('/:assetId', async (req, res) => {
    var _a;
    const assetId = req.params.assetId;
    logger_1.logger.debug('Asset options request received for asset ID %s', assetId);
    try {
        const mspId = req.user;
        const contract = (_a = req.app.locals[mspId]) === null || _a === void 0 ? void 0 : _a.assetContract;
        const data = await (0, fabric_1.evatuateTransaction)(contract, 'AssetExists', assetId);
        const exists = data.toString() === 'true';
        if (exists) {
            return res
                .status(OK)
                .set({
                Allow: 'DELETE,GET,OPTIONS,PATCH,PUT',
            })
                .json({
                status: (0, http_status_codes_1.getReasonPhrase)(OK),
                timestamp: new Date().toISOString(),
            });
        }
        else {
            return res.status(NOT_FOUND).json({
                status: (0, http_status_codes_1.getReasonPhrase)(NOT_FOUND),
                timestamp: new Date().toISOString(),
            });
        }
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Error processing asset options request for asset ID %s', assetId);
        return res.status(INTERNAL_SERVER_ERROR).json({
            status: (0, http_status_codes_1.getReasonPhrase)(INTERNAL_SERVER_ERROR),
            timestamp: new Date().toISOString(),
        });
    }
});
exports.assetsRouter.get('/:assetId', async (req, res) => {
    var _a;
    const assetId = req.params.assetId;
    logger_1.logger.debug('Read asset request received for asset ID %s', assetId);
    try {
        const mspId = req.user;
        const contract = (_a = req.app.locals[mspId]) === null || _a === void 0 ? void 0 : _a.assetContract;
        const data = await (0, fabric_1.evatuateTransaction)(contract, 'ReadAsset', assetId);
        const asset = JSON.parse(data.toString());
        return res.status(OK).json(asset);
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Error processing read asset request for asset ID %s', assetId);
        if (err instanceof errors_1.AssetNotFoundError) {
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
exports.assetsRouter.put('/:assetId', (0, express_validator_1.body)().isObject().withMessage('body must contain an asset object'), (0, express_validator_1.body)('ID', 'must be a string').notEmpty(), (0, express_validator_1.body)('Color', 'must be a string').notEmpty(), (0, express_validator_1.body)('Size', 'must be a number').isNumeric(), (0, express_validator_1.body)('Owner', 'must be a string').notEmpty(), (0, express_validator_1.body)('AppraisedValue', 'must be a number').isNumeric(), async (req, res) => {
    logger_1.logger.debug(req.body, 'Update asset request received');
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(BAD_REQUEST).json({
            status: (0, http_status_codes_1.getReasonPhrase)(BAD_REQUEST),
            reason: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            timestamp: new Date().toISOString(),
            errors: errors.array(),
        });
    }
    if (req.params.assetId != req.body.ID) {
        return res.status(BAD_REQUEST).json({
            status: (0, http_status_codes_1.getReasonPhrase)(BAD_REQUEST),
            reason: 'ASSET_ID_MISMATCH',
            message: 'Asset IDs must match',
            timestamp: new Date().toISOString(),
        });
    }
    const mspId = req.user;
    const assetId = req.params.assetId;
    try {
        const submitQueue = req.app.locals.jobq;
        const jobId = await (0, jobs_1.addSubmitTransactionJob)(submitQueue, mspId, 'UpdateAsset', assetId, req.body.color, req.body.size, req.body.owner, req.body.appraisedValue);
        return res.status(ACCEPTED).json({
            status: (0, http_status_codes_1.getReasonPhrase)(ACCEPTED),
            jobId: jobId,
            timestamp: new Date().toISOString(),
        });
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Error processing update asset request for asset ID %s', assetId);
        return res.status(INTERNAL_SERVER_ERROR).json({
            status: (0, http_status_codes_1.getReasonPhrase)(INTERNAL_SERVER_ERROR),
            timestamp: new Date().toISOString(),
        });
    }
});
exports.assetsRouter.patch('/:assetId', (0, express_validator_1.body)()
    .isArray({
    min: 1,
    max: 1,
})
    .withMessage('body must contain an array with a single patch operation'), (0, express_validator_1.body)('*.op', "operation must be 'replace'").equals('replace'), (0, express_validator_1.body)('*.path', "path must be '/Owner'").equals('/Owner'), (0, express_validator_1.body)('*.value', 'must be a string').isString(), async (req, res) => {
    logger_1.logger.debug(req.body, 'Transfer asset request received');
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(BAD_REQUEST).json({
            status: (0, http_status_codes_1.getReasonPhrase)(BAD_REQUEST),
            reason: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            timestamp: new Date().toISOString(),
            errors: errors.array(),
        });
    }
    const mspId = req.user;
    const assetId = req.params.assetId;
    const newOwner = req.body[0].value;
    try {
        const submitQueue = req.app.locals.jobq;
        const jobId = await (0, jobs_1.addSubmitTransactionJob)(submitQueue, mspId, 'TransferAsset', assetId, newOwner);
        return res.status(ACCEPTED).json({
            status: (0, http_status_codes_1.getReasonPhrase)(ACCEPTED),
            jobId: jobId,
            timestamp: new Date().toISOString(),
        });
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Error processing update asset request for asset ID %s', req.params.assetId);
        return res.status(INTERNAL_SERVER_ERROR).json({
            status: (0, http_status_codes_1.getReasonPhrase)(INTERNAL_SERVER_ERROR),
            timestamp: new Date().toISOString(),
        });
    }
});
exports.assetsRouter.delete('/:assetId', async (req, res) => {
    logger_1.logger.debug(req.body, 'Delete asset request received');
    const mspId = req.user;
    const assetId = req.params.assetId;
    try {
        const submitQueue = req.app.locals.jobq;
        const jobId = await (0, jobs_1.addSubmitTransactionJob)(submitQueue, mspId, 'DeleteAsset', assetId);
        return res.status(ACCEPTED).json({
            status: (0, http_status_codes_1.getReasonPhrase)(ACCEPTED),
            jobId: jobId,
            timestamp: new Date().toISOString(),
        });
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Error processing delete asset request for asset ID %s', assetId);
        return res.status(INTERNAL_SERVER_ERROR).json({
            status: (0, http_status_codes_1.getReasonPhrase)(INTERNAL_SERVER_ERROR),
            timestamp: new Date().toISOString(),
        });
    }
});
//# sourceMappingURL=assets.router.js.map