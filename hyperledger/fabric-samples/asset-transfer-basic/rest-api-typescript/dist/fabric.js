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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlockHeight = exports.getTransactionValidationCode = exports.submitTransaction = exports.evatuateTransaction = exports.getContracts = exports.getNetwork = exports.createGateway = exports.createWallet = void 0;
const fabric_network_1 = require("fabric-network");
const protos = __importStar(require("fabric-protos"));
const config = __importStar(require("./config"));
const errors_1 = require("./errors");
const logger_1 = require("./logger");
/**
 * Creates an in memory wallet to hold credentials for an Org1 and Org2 user
 *
 * In this sample there is a single user for each MSP ID to demonstrate how
 * a client app might submit transactions for different users
 *
 * Alternatively a REST server could use its own identity for all transactions,
 * or it could use credentials supplied in the REST requests
 */
const createWallet = async () => {
    const wallet = await fabric_network_1.Wallets.newInMemoryWallet();
    const org1Identity = {
        credentials: {
            certificate: config.certificateOrg1,
            privateKey: config.privateKeyOrg1,
        },
        mspId: config.mspIdOrg1,
        type: 'X.509',
    };
    await wallet.put(config.mspIdOrg1, org1Identity);
    const org2Identity = {
        credentials: {
            certificate: config.certificateOrg2,
            privateKey: config.privateKeyOrg2,
        },
        mspId: config.mspIdOrg2,
        type: 'X.509',
    };
    await wallet.put(config.mspIdOrg2, org2Identity);
    return wallet;
};
exports.createWallet = createWallet;
/**
 * Create a Gateway connection
 *
 * Gateway instances can and should be reused rather than connecting to submit every transaction
 */
const createGateway = async (connectionProfile, identity, wallet) => {
    logger_1.logger.debug({ connectionProfile, identity }, 'Configuring gateway');
    const gateway = new fabric_network_1.Gateway();
    const options = {
        wallet,
        identity,
        discovery: { enabled: true, asLocalhost: config.asLocalhost },
        eventHandlerOptions: {
            commitTimeout: config.commitTimeout,
            endorseTimeout: config.endorseTimeout,
            strategy: fabric_network_1.DefaultEventHandlerStrategies.PREFER_MSPID_SCOPE_ANYFORTX,
        },
        queryHandlerOptions: {
            timeout: config.queryTimeout,
            strategy: fabric_network_1.DefaultQueryHandlerStrategies.PREFER_MSPID_SCOPE_ROUND_ROBIN,
        },
    };
    await gateway.connect(connectionProfile, options);
    return gateway;
};
exports.createGateway = createGateway;
/**
 * Get the network which the asset transfer sample chaincode is running on
 *
 * In addion to getting the contract, the network will also be used to
 * start a block event listener
 */
const getNetwork = async (gateway) => {
    const network = await gateway.getNetwork(config.channelName);
    return network;
};
exports.getNetwork = getNetwork;
/**
 * Get the asset transfer sample contract and the qscc system contract
 *
 * The system contract is used for the liveness REST endpoint
 */
const getContracts = async (network) => {
    const assetContract = network.getContract(config.chaincodeName);
    const qsccContract = network.getContract('qscc');
    return { assetContract, qsccContract };
};
exports.getContracts = getContracts;
/**
 * Evaluate a transaction and handle any errors
 */
const evatuateTransaction = async (contract, transactionName, ...transactionArgs) => {
    const transaction = contract.createTransaction(transactionName);
    const transactionId = transaction.getTransactionId();
    logger_1.logger.trace({ transaction }, 'Evaluating transaction');
    try {
        const payload = await transaction.evaluate(...transactionArgs);
        logger_1.logger.trace({ transactionId: transactionId, payload: payload.toString() }, 'Evaluate transaction response received');
        return payload;
    }
    catch (err) {
        throw (0, errors_1.handleError)(transactionId, err);
    }
};
exports.evatuateTransaction = evatuateTransaction;
/**
 * Submit a transaction and handle any errors
 */
const submitTransaction = async (transaction, ...transactionArgs) => {
    logger_1.logger.trace({ transaction }, 'Submitting transaction');
    const txnId = transaction.getTransactionId();
    try {
        const payload = await transaction.submit(...transactionArgs);
        logger_1.logger.trace({ transactionId: txnId, payload: payload.toString() }, 'Submit transaction response received');
        return payload;
    }
    catch (err) {
        throw (0, errors_1.handleError)(txnId, err);
    }
};
exports.submitTransaction = submitTransaction;
/**
 * Get the validation code of the specified transaction
 */
const getTransactionValidationCode = async (qsccContract, transactionId) => {
    const data = await (0, exports.evatuateTransaction)(qsccContract, 'GetTransactionByID', config.channelName, transactionId);
    const processedTransaction = protos.protos.ProcessedTransaction.decode(data);
    const validationCode = protos.protos.TxValidationCode[processedTransaction.validationCode];
    logger_1.logger.debug({ transactionId }, 'Validation code: %s', validationCode);
    return validationCode;
};
exports.getTransactionValidationCode = getTransactionValidationCode;
/**
 * Get the current block height
 *
 * This example of using a system contract is used for the liveness REST
 * endpoint
 */
const getBlockHeight = async (qscc) => {
    const data = await qscc.evaluateTransaction('GetChainInfo', config.channelName);
    const info = protos.common.BlockchainInfo.decode(data);
    const blockHeight = info.height;
    logger_1.logger.debug('Current block height: %d', blockHeight);
    return blockHeight;
};
exports.getBlockHeight = getBlockHeight;
//# sourceMappingURL=fabric.js.map