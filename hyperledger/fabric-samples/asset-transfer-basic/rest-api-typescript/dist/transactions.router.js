"use strict";
/*
 * SPDX-License-Identifier: Apache-2.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionsRouter = void 0;
const express_1 = __importDefault(require("express"));
const http_status_codes_1 = require("http-status-codes");
const fabric_1 = require("./fabric");
const logger_1 = require("./logger");
const errors_1 = require("./errors");
const { INTERNAL_SERVER_ERROR, NOT_FOUND, OK } = http_status_codes_1.StatusCodes;
exports.transactionsRouter = express_1.default.Router();
exports.transactionsRouter.get('/:transactionId', async (req, res) => {
    var _a;
    const mspId = req.user;
    const transactionId = req.params.transactionId;
    logger_1.logger.debug('Read request received for transaction ID %s', transactionId);
    try {
        const qsccContract = (_a = req.app.locals[mspId]) === null || _a === void 0 ? void 0 : _a.qsccContract;
        const validationCode = await (0, fabric_1.getTransactionValidationCode)(qsccContract, transactionId);
        return res.status(OK).json({
            transactionId,
            validationCode,
        });
    }
    catch (err) {
        if (err instanceof errors_1.TransactionNotFoundError) {
            return res.status(NOT_FOUND).json({
                status: (0, http_status_codes_1.getReasonPhrase)(NOT_FOUND),
                timestamp: new Date().toISOString(),
            });
        }
        else {
            logger_1.logger.error({ err }, 'Error processing read request for transaction ID %s', transactionId);
            return res.status(INTERNAL_SERVER_ERROR).json({
                status: (0, http_status_codes_1.getReasonPhrase)(INTERNAL_SERVER_ERROR),
                timestamp: new Date().toISOString(),
            });
        }
    }
});
//# sourceMappingURL=transactions.router.js.map