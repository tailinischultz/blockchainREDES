"use strict";
/*
 * SPDX-License-Identifier: Apache-2.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = void 0;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const http_status_codes_1 = require("http-status-codes");
const passport_1 = __importDefault(require("passport"));
const pino_http_1 = __importDefault(require("pino-http"));
const assets_router_1 = require("./assets.router");
const auth_1 = require("./auth");
const health_router_1 = require("./health.router");
const jobs_router_1 = require("./jobs.router");
const logger_1 = require("./logger");
const transactions_router_1 = require("./transactions.router");
const cors_1 = __importDefault(require("cors"));
const { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND } = http_status_codes_1.StatusCodes;
const createServer = async () => {
    const app = (0, express_1.default)();
    app.use((0, pino_http_1.default)({
        logger: logger_1.logger,
        customLogLevel: function customLogLevel(res, err) {
            if (res.statusCode >= BAD_REQUEST &&
                res.statusCode < INTERNAL_SERVER_ERROR) {
                return 'warn';
            }
            if (res.statusCode >= INTERNAL_SERVER_ERROR || err) {
                return 'error';
            }
            return 'debug';
        },
    }));
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    // define passport startegy
    passport_1.default.use(auth_1.fabricAPIKeyStrategy);
    // initialize passport js
    app.use(passport_1.default.initialize());
    if (process.env.NODE_ENV === 'development') {
        app.use((0, cors_1.default)());
    }
    if (process.env.NODE_ENV === 'test') {
        // TBC
    }
    if (process.env.NODE_ENV === 'production') {
        app.use((0, helmet_1.default)());
    }
    app.use('/', health_router_1.healthRouter);
    app.use('/api/assets', auth_1.authenticateApiKey, assets_router_1.assetsRouter);
    app.use('/api/jobs', auth_1.authenticateApiKey, jobs_router_1.jobsRouter);
    app.use('/api/transactions', auth_1.authenticateApiKey, transactions_router_1.transactionsRouter);
    // For everything else
    app.use((_req, res) => res.status(NOT_FOUND).json({
        status: (0, http_status_codes_1.getReasonPhrase)(NOT_FOUND),
        timestamp: new Date().toISOString(),
    }));
    // Print API errors
    app.use((err, _req, res, _next) => {
        logger_1.logger.error(err);
        return res.status(INTERNAL_SERVER_ERROR).json({
            status: (0, http_status_codes_1.getReasonPhrase)(INTERNAL_SERVER_ERROR),
            timestamp: new Date().toISOString(),
        });
    });
    return app;
};
exports.createServer = createServer;
//# sourceMappingURL=server.js.map