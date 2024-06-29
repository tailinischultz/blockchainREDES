"use strict";
/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * This sample uses BullMQ jobs to process submit transactions, which includes
 * retry support for failing jobs
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
exports.getJobCounts = exports.getJobSummary = exports.updateJobData = exports.addSubmitTransactionJob = exports.initJobQueueScheduler = exports.processSubmitTransactionJob = exports.initJobQueueWorker = exports.initJobQueue = exports.JobNotFoundError = void 0;
const bullmq_1 = require("bullmq");
const config = __importStar(require("./config"));
const errors_1 = require("./errors");
const fabric_1 = require("./fabric");
const logger_1 = require("./logger");
class JobNotFoundError extends Error {
    constructor(message, jobId) {
        super(message);
        Object.setPrototypeOf(this, JobNotFoundError.prototype);
        this.name = 'JobNotFoundError';
        this.jobId = jobId;
    }
}
exports.JobNotFoundError = JobNotFoundError;
const connection = {
    port: config.redisPort,
    host: config.redisHost,
    username: config.redisUsername,
    password: config.redisPassword,
};
/**
 * Set up the queue for submit jobs
 */
const initJobQueue = () => {
    const submitQueue = new bullmq_1.Queue(config.JOB_QUEUE_NAME, {
        connection,
        defaultJobOptions: {
            attempts: config.submitJobAttempts,
            backoff: {
                type: config.submitJobBackoffType,
                delay: config.submitJobBackoffDelay,
            },
            removeOnComplete: config.maxCompletedSubmitJobs,
            removeOnFail: config.maxFailedSubmitJobs,
        },
    });
    return submitQueue;
};
exports.initJobQueue = initJobQueue;
/**
 * Set up a worker to process submit jobs on the queue, using the
 * processSubmitTransactionJob function below
 */
const initJobQueueWorker = (app) => {
    const worker = new bullmq_1.Worker(config.JOB_QUEUE_NAME, async (job) => {
        return await (0, exports.processSubmitTransactionJob)(app, job);
    }, { connection, concurrency: config.submitJobConcurrency });
    worker.on('failed', (job) => {
        logger_1.logger.warn({ job }, 'Job failed');
    });
    // Important: need to handle this error otherwise worker may stop
    // processing jobs
    worker.on('error', (err) => {
        logger_1.logger.error({ err }, 'Worker error');
    });
    if (logger_1.logger.isLevelEnabled('debug')) {
        worker.on('completed', (job) => {
            logger_1.logger.debug({ job }, 'Job completed');
        });
    }
    return worker;
};
exports.initJobQueueWorker = initJobQueueWorker;
/**
 * Process a submit transaction request from the job queue
 *
 * The job will be retried if this function throws an error
 */
const processSubmitTransactionJob = async (app, job) => {
    var _a;
    logger_1.logger.debug({ jobId: job.id, jobName: job.name }, 'Processing job');
    const contract = (_a = app.locals[job.data.mspid]) === null || _a === void 0 ? void 0 : _a.assetContract;
    if (contract === undefined) {
        logger_1.logger.error({ jobId: job.id, jobName: job.name }, 'Contract not found for MSP ID %s', job.data.mspid);
        // Retrying will never work without a contract, so give up with an
        // empty job result
        return {
            transactionError: undefined,
            transactionPayload: undefined,
        };
    }
    const args = job.data.transactionArgs;
    let transaction;
    if (job.data.transactionState) {
        const savedState = job.data.transactionState;
        logger_1.logger.debug({
            jobId: job.id,
            jobName: job.name,
            savedState,
        }, 'Reusing previously saved transaction state');
        transaction = contract.deserializeTransaction(savedState);
    }
    else {
        logger_1.logger.debug({
            jobId: job.id,
            jobName: job.name,
        }, 'Using new transaction');
        transaction = contract.createTransaction(job.data.transactionName);
        await (0, exports.updateJobData)(job, transaction);
    }
    logger_1.logger.debug({
        jobId: job.id,
        jobName: job.name,
        transactionId: transaction.getTransactionId(),
    }, 'Submitting transaction');
    try {
        const payload = await (0, fabric_1.submitTransaction)(transaction, ...args);
        return {
            transactionError: undefined,
            transactionPayload: payload,
        };
    }
    catch (err) {
        const retryAction = (0, errors_1.getRetryAction)(err);
        if (retryAction === errors_1.RetryAction.None) {
            logger_1.logger.error({ jobId: job.id, jobName: job.name, err }, 'Fatal transaction error occurred');
            // Not retriable so return a job result with the error details
            return {
                transactionError: `${err}`,
                transactionPayload: undefined,
            };
        }
        logger_1.logger.warn({ jobId: job.id, jobName: job.name, err }, 'Retryable transaction error occurred');
        if (retryAction === errors_1.RetryAction.WithNewTransactionId) {
            logger_1.logger.debug({ jobId: job.id, jobName: job.name }, 'Clearing saved transaction state');
            await (0, exports.updateJobData)(job, undefined);
        }
        // Rethrow the error to keep retrying
        throw err;
    }
};
exports.processSubmitTransactionJob = processSubmitTransactionJob;
/**
 * Set up a scheduler for the submit job queue
 *
 * This manages stalled and delayed jobs and is required for retries with backoff
 */
const initJobQueueScheduler = () => {
    const queueScheduler = new bullmq_1.QueueScheduler(config.JOB_QUEUE_NAME, {
        connection,
    });
    queueScheduler.on('failed', (jobId, failedReason) => {
        logger_1.logger.error({ jobId, failedReason }, 'Queue sceduler failure');
    });
    return queueScheduler;
};
exports.initJobQueueScheduler = initJobQueueScheduler;
/**
 * Helper to add a new submit transaction job to the queue
 */
const addSubmitTransactionJob = async (submitQueue, mspid, transactionName, ...transactionArgs) => {
    const jobName = `submit ${transactionName} transaction`;
    const job = await submitQueue.add(jobName, {
        mspid,
        transactionName,
        transactionArgs: transactionArgs,
        transactionIds: [],
    });
    if ((job === null || job === void 0 ? void 0 : job.id) === undefined) {
        throw new Error('Submit transaction job ID not available');
    }
    return job.id;
};
exports.addSubmitTransactionJob = addSubmitTransactionJob;
/**
 * Helper to update the data for an existing job
 */
const updateJobData = async (job, transaction) => {
    const newData = { ...job.data };
    if (transaction != undefined) {
        const transationIds = [].concat(newData.transactionIds, transaction.getTransactionId());
        newData.transactionIds = transationIds;
        newData.transactionState = transaction.serialize();
    }
    else {
        newData.transactionState = undefined;
    }
    await job.update(newData);
};
exports.updateJobData = updateJobData;
/**
 * Gets a job summary
 *
 * This function is used for the jobs REST endpoint
 */
const getJobSummary = async (queue, jobId) => {
    const job = await queue.getJob(jobId);
    logger_1.logger.debug({ job }, 'Got job');
    if (!(job && job.id != undefined)) {
        throw new JobNotFoundError(`Job ${jobId} not found`, jobId);
    }
    let transactionIds;
    if (job.data && job.data.transactionIds) {
        transactionIds = job.data.transactionIds;
    }
    else {
        transactionIds = [];
    }
    let transactionError;
    let transactionPayload;
    const returnValue = job.returnvalue;
    if (returnValue) {
        if (returnValue.transactionError) {
            transactionError = returnValue.transactionError;
        }
        if (returnValue.transactionPayload &&
            returnValue.transactionPayload.length > 0) {
            transactionPayload = returnValue.transactionPayload.toString();
        }
        else {
            transactionPayload = '';
        }
    }
    const jobSummary = {
        jobId: job.id,
        transactionIds,
        transactionError,
        transactionPayload,
    };
    return jobSummary;
};
exports.getJobSummary = getJobSummary;
/**
 * Get the current job counts
 *
 * This function is used for the liveness REST endpoint
 */
const getJobCounts = async (queue) => {
    const jobCounts = await queue.getJobCounts('active', 'completed', 'delayed', 'failed', 'waiting');
    logger_1.logger.debug({ jobCounts }, 'Current job counts');
    return jobCounts;
};
exports.getJobCounts = getJobCounts;
//# sourceMappingURL=jobs.js.map