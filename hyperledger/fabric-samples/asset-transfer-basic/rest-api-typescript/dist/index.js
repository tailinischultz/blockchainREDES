"use strict";
/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * This is the main entrypoint for the sample REST server, which is responsible
 * for connecting to the Fabric network and setting up a job queue for
 * processing submit transactions
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
Object.defineProperty(exports, "__esModule", { value: true });
const config = __importStar(require("./config"));
const fabric_1 = require("./fabric");
const jobs_1 = require("./jobs");
const logger_1 = require("./logger");
const server_1 = require("./server");
const redis_1 = require("./redis");
let jobQueue;
let jobQueueWorker;
let jobQueueScheduler;
async function main() {
    logger_1.logger.info('Checking Redis config');
    if (!(await (0, redis_1.isMaxmemoryPolicyNoeviction)())) {
        throw new Error('Invalid redis configuration: redis instance must have the setting maxmemory-policy=noeviction');
    }
    logger_1.logger.info('Creating REST server');
    const app = await (0, server_1.createServer)();
    logger_1.logger.info('Connecting to Fabric network with org1 mspid');
    const wallet = await (0, fabric_1.createWallet)();
    const gatewayOrg1 = await (0, fabric_1.createGateway)(config.connectionProfileOrg1, config.mspIdOrg1, wallet);
    const networkOrg1 = await (0, fabric_1.getNetwork)(gatewayOrg1);
    const contractsOrg1 = await (0, fabric_1.getContracts)(networkOrg1);
    app.locals[config.mspIdOrg1] = contractsOrg1;
    logger_1.logger.info('Connecting to Fabric network with org2 mspid');
    const gatewayOrg2 = await (0, fabric_1.createGateway)(config.connectionProfileOrg2, config.mspIdOrg2, wallet);
    const networkOrg2 = await (0, fabric_1.getNetwork)(gatewayOrg2);
    const contractsOrg2 = await (0, fabric_1.getContracts)(networkOrg2);
    app.locals[config.mspIdOrg2] = contractsOrg2;
    logger_1.logger.info('Initialising submit job queue');
    jobQueue = (0, jobs_1.initJobQueue)();
    jobQueueWorker = (0, jobs_1.initJobQueueWorker)(app);
    if (config.submitJobQueueScheduler === true) {
        logger_1.logger.info('Initialising submit job queue scheduler');
        jobQueueScheduler = (0, jobs_1.initJobQueueScheduler)();
    }
    app.locals.jobq = jobQueue;
    logger_1.logger.info('Starting REST server');
    app.listen(config.port, () => {
        logger_1.logger.info('REST server started on port: %d', config.port);
    });
}
main().catch(async (err) => {
    logger_1.logger.error({ err }, 'Unxepected error');
    if (jobQueueScheduler != undefined) {
        logger_1.logger.debug('Closing job queue scheduler');
        await jobQueueScheduler.close();
    }
    if (jobQueueWorker != undefined) {
        logger_1.logger.debug('Closing job queue worker');
        await jobQueueWorker.close();
    }
    if (jobQueue != undefined) {
        logger_1.logger.debug('Closing job queue');
        await jobQueue.close();
    }
});
//# sourceMappingURL=index.js.map