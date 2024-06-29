"use strict";
/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The sample REST server can be configured using the environment variables
 * documented below
 *
 * In a local development environment, these variables can be loaded from a
 * .env file by starting the server with the following command:
 *
 *   npm start:dev
 *
 * The scripts/generateEnv.sh script can be used to generate a suitable .env
 * file for the Fabric Test Network
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
exports.org2ApiKey = exports.org1ApiKey = exports.redisPassword = exports.redisUsername = exports.redisPort = exports.redisHost = exports.privateKeyOrg2 = exports.certificateOrg2 = exports.connectionProfileOrg2 = exports.privateKeyOrg1 = exports.certificateOrg1 = exports.connectionProfileOrg1 = exports.queryTimeout = exports.endorseTimeout = exports.commitTimeout = exports.chaincodeName = exports.channelName = exports.mspIdOrg2 = exports.mspIdOrg1 = exports.asLocalhost = exports.submitJobQueueScheduler = exports.maxFailedSubmitJobs = exports.maxCompletedSubmitJobs = exports.submitJobConcurrency = exports.submitJobAttempts = exports.submitJobBackoffDelay = exports.submitJobBackoffType = exports.port = exports.logLevel = exports.JOB_QUEUE_NAME = exports.ORG2 = exports.ORG1 = void 0;
const env = __importStar(require("env-var"));
exports.ORG1 = 'Org1';
exports.ORG2 = 'Org2';
exports.JOB_QUEUE_NAME = 'submit';
/**
 * Log level for the REST server
 */
exports.logLevel = env
    .get('LOG_LEVEL')
    .default('info')
    .asEnum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']);
/**
 * The port to start the REST server on
 */
exports.port = env
    .get('PORT')
    .default('3000')
    .example('3000')
    .asPortNumber();
/**
 * The type of backoff to use for retrying failed submit jobs
 */
exports.submitJobBackoffType = env
    .get('SUBMIT_JOB_BACKOFF_TYPE')
    .default('fixed')
    .asEnum(['fixed', 'exponential']);
/**
 * Backoff delay for retrying failed submit jobs in milliseconds
 */
exports.submitJobBackoffDelay = env
    .get('SUBMIT_JOB_BACKOFF_DELAY')
    .default('3000')
    .example('3000')
    .asIntPositive();
/**
 * The total number of attempts to try a submit job until it completes
 */
exports.submitJobAttempts = env
    .get('SUBMIT_JOB_ATTEMPTS')
    .default('5')
    .example('5')
    .asIntPositive();
/**
 * The maximum number of submit jobs that can be processed in parallel
 */
exports.submitJobConcurrency = env
    .get('SUBMIT_JOB_CONCURRENCY')
    .default('5')
    .example('5')
    .asIntPositive();
/**
 * The number of completed submit jobs to keep
 */
exports.maxCompletedSubmitJobs = env
    .get('MAX_COMPLETED_SUBMIT_JOBS')
    .default('1000')
    .example('1000')
    .asIntPositive();
/**
 * The number of failed submit jobs to keep
 */
exports.maxFailedSubmitJobs = env
    .get('MAX_FAILED_SUBMIT_JOBS')
    .default('1000')
    .example('1000')
    .asIntPositive();
/**
 * Whether to initialise a scheduler for the submit job queue
 * There must be at least on queue scheduler to handle retries and you may want
 * more than one for redundancy
 */
exports.submitJobQueueScheduler = env
    .get('SUBMIT_JOB_QUEUE_SCHEDULER')
    .default('true')
    .example('true')
    .asBoolStrict();
/**
 * Whether to convert discovered host addresses to be 'localhost'
 * This should be set to 'true' when running a docker composed fabric network on the
 * local system, e.g. using the test network; otherwise should it should be 'false'
 */
exports.asLocalhost = env
    .get('AS_LOCAL_HOST')
    .default('true')
    .example('true')
    .asBoolStrict();
/**
 * The Org1 MSP ID
 */
exports.mspIdOrg1 = env
    .get('HLF_MSP_ID_ORG1')
    .default(`${exports.ORG1}MSP`)
    .example(`${exports.ORG1}MSP`)
    .asString();
/**
 * The Org2 MSP ID
 */
exports.mspIdOrg2 = env
    .get('HLF_MSP_ID_ORG2')
    .default(`${exports.ORG2}MSP`)
    .example(`${exports.ORG2}MSP`)
    .asString();
/**
 * Name of the channel which the basic asset sample chaincode has been installed on
 */
exports.channelName = env
    .get('HLF_CHANNEL_NAME')
    .default('mychannel')
    .example('mychannel')
    .asString();
/**
 * Name used to install the basic asset sample
 */
exports.chaincodeName = env
    .get('HLF_CHAINCODE_NAME')
    .default('basic')
    .example('basic')
    .asString();
/**
 * The transaction submit timeout in seconds for commit notification to complete
 */
exports.commitTimeout = env
    .get('HLF_COMMIT_TIMEOUT')
    .default('300')
    .example('300')
    .asIntPositive();
/**
 * The transaction submit timeout in seconds for the endorsement to complete
 */
exports.endorseTimeout = env
    .get('HLF_ENDORSE_TIMEOUT')
    .default('30')
    .example('30')
    .asIntPositive();
/**
 * The transaction query timeout in seconds
 */
exports.queryTimeout = env
    .get('HLF_QUERY_TIMEOUT')
    .default('3')
    .example('3')
    .asIntPositive();
/**
 * The Org1 connection profile JSON
 */
exports.connectionProfileOrg1 = env
    .get('HLF_CONNECTION_PROFILE_ORG1')
    .required()
    .example('{"name":"test-network-org1","version":"1.0.0","client":{"organization":"Org1" ... }')
    .asJsonObject();
/**
 * Certificate for an Org1 identity to evaluate and submit transactions
 */
exports.certificateOrg1 = env
    .get('HLF_CERTIFICATE_ORG1')
    .required()
    .example('"-----BEGIN CERTIFICATE-----\\n...\\n-----END CERTIFICATE-----\\n"')
    .asString();
/**
 * Private key for an Org1 identity to evaluate and submit transactions
 */
exports.privateKeyOrg1 = env
    .get('HLF_PRIVATE_KEY_ORG1')
    .required()
    .example('"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"')
    .asString();
/**
 * The Org2 connection profile JSON
 */
exports.connectionProfileOrg2 = env
    .get('HLF_CONNECTION_PROFILE_ORG2')
    .required()
    .example('{"name":"test-network-org2","version":"1.0.0","client":{"organization":"Org2" ... }')
    .asJsonObject();
/**
 * Certificate for an Org2 identity to evaluate and submit transactions
 */
exports.certificateOrg2 = env
    .get('HLF_CERTIFICATE_ORG2')
    .required()
    .example('"-----BEGIN CERTIFICATE-----\\n...\\n-----END CERTIFICATE-----\\n"')
    .asString();
/**
 * Private key for an Org2 identity to evaluate and submit transactions
 */
exports.privateKeyOrg2 = env
    .get('HLF_PRIVATE_KEY_ORG2')
    .required()
    .example('"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"')
    .asString();
/**
 * The host the Redis server is running on
 */
exports.redisHost = env
    .get('REDIS_HOST')
    .default('localhost')
    .example('localhost')
    .asString();
/**
 * The port the Redis server is running on
 */
exports.redisPort = env
    .get('REDIS_PORT')
    .default('6379')
    .example('6379')
    .asPortNumber();
/**
 * Username for the Redis server
 */
exports.redisUsername = env
    .get('REDIS_USERNAME')
    .example('fabric')
    .asString();
/**
 * Password for the Redis server
 */
exports.redisPassword = env.get('REDIS_PASSWORD').asString();
/**
 * API key for Org1
 * Specify this API key with the X-Api-Key header to use the Org1 connection profile and credentials
 */
exports.org1ApiKey = env
    .get('ORG1_APIKEY')
    .required()
    .example('123')
    .asString();
/**
 * API key for Org2
 * Specify this API key with the X-Api-Key header to use the Org2 connection profile and credentials
 */
exports.org2ApiKey = env
    .get('ORG2_APIKEY')
    .required()
    .example('456')
    .asString();
//# sourceMappingURL=config.js.map