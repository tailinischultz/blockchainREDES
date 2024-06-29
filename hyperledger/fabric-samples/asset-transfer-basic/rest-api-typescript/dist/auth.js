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
exports.authenticateApiKey = exports.fabricAPIKeyStrategy = void 0;
const logger_1 = require("./logger");
const passport_1 = __importDefault(require("passport"));
const passport_headerapikey_1 = require("passport-headerapikey");
const http_status_codes_1 = require("http-status-codes");
const config = __importStar(require("./config"));
const { UNAUTHORIZED } = http_status_codes_1.StatusCodes;
exports.fabricAPIKeyStrategy = new passport_headerapikey_1.HeaderAPIKeyStrategy({ header: 'X-API-Key', prefix: '' }, false, function (apikey, done) {
    logger_1.logger.debug({ apikey }, 'Checking X-API-Key');
    if (apikey === config.org1ApiKey) {
        const user = config.mspIdOrg1;
        logger_1.logger.debug('User set to %s', user);
        done(null, user);
    }
    else if (apikey === config.org2ApiKey) {
        const user = config.mspIdOrg2;
        logger_1.logger.debug('User set to %s', user);
        done(null, user);
    }
    else {
        logger_1.logger.debug({ apikey }, 'No valid X-API-Key');
        return done(null, false);
    }
});
const authenticateApiKey = (req, res, next) => {
    passport_1.default.authenticate('headerapikey', { session: false }, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (err, user, _info) => {
        if (err)
            return next(err);
        if (!user)
            return res.status(UNAUTHORIZED).json({
                status: (0, http_status_codes_1.getReasonPhrase)(UNAUTHORIZED),
                reason: 'NO_VALID_APIKEY',
                timestamp: new Date().toISOString(),
            });
        req.logIn(user, { session: false }, async (err) => {
            if (err) {
                return next(err);
            }
            return next();
        });
    })(req, res, next);
};
exports.authenticateApiKey = authenticateApiKey;
//# sourceMappingURL=auth.js.map