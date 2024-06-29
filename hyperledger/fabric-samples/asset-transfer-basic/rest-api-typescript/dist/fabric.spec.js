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
const fabric_1 = require("./fabric");
const config = __importStar(require("./config"));
const errors_1 = require("./errors");
const fabricProtos = __importStar(require("fabric-protos"));
const jest_mock_extended_1 = require("jest-mock-extended");
jest.mock('./config');
jest.mock('fabric-network', () => {
    const originalModule = jest.requireActual('fabric-network');
    const mockModule = jest.createMockFromModule('fabric-network');
    return {
        __esModule: true,
        ...mockModule,
        Wallets: originalModule.Wallets,
    };
});
jest.mock('ioredis', () => require('ioredis-mock/jest'));
describe('Fabric', () => {
    describe('createWallet', () => {
        it('creates a wallet containing identities for both orgs', async () => {
            const wallet = await (0, fabric_1.createWallet)();
            expect(await wallet.list()).toStrictEqual(['Org1MSP', 'Org2MSP']);
        });
    });
    describe('createGateway', () => {
        it('creates a Gateway and connects using the provided arguments', async () => {
            const connectionProfile = config.connectionProfileOrg1;
            const identity = config.mspIdOrg1;
            const mockWallet = (0, jest_mock_extended_1.mock)();
            const gateway = await (0, fabric_1.createGateway)(connectionProfile, identity, mockWallet);
            expect(gateway.connect).toBeCalledWith(connectionProfile, expect.objectContaining({
                wallet: mockWallet,
                identity,
                discovery: expect.any(Object),
                eventHandlerOptions: expect.any(Object),
                queryHandlerOptions: expect.any(Object),
            }));
        });
    });
    describe('getNetwork', () => {
        it('gets a Network instance for the required channel from the Gateway', async () => {
            const mockGateway = (0, jest_mock_extended_1.mock)();
            await (0, fabric_1.getNetwork)(mockGateway);
            expect(mockGateway.getNetwork).toHaveBeenCalledWith(config.channelName);
        });
    });
    describe('getContracts', () => {
        it('gets the asset and qscc contracts from the network', async () => {
            const mockBasicContract = (0, jest_mock_extended_1.mock)();
            const mockSystemContract = (0, jest_mock_extended_1.mock)();
            const mockNetwork = (0, jest_mock_extended_1.mock)();
            mockNetwork.getContract
                .calledWith(config.chaincodeName)
                .mockReturnValue(mockBasicContract);
            mockNetwork.getContract
                .calledWith('qscc')
                .mockReturnValue(mockSystemContract);
            const contracts = await (0, fabric_1.getContracts)(mockNetwork);
            expect(contracts).toStrictEqual({
                assetContract: mockBasicContract,
                qsccContract: mockSystemContract,
            });
        });
    });
    describe('evatuateTransaction', () => {
        const mockPayload = Buffer.from('MOCK PAYLOAD');
        let mockTransaction;
        let mockContract;
        beforeEach(() => {
            mockTransaction = (0, jest_mock_extended_1.mock)();
            mockTransaction.evaluate.mockResolvedValue(mockPayload);
            mockContract = (0, jest_mock_extended_1.mock)();
            mockContract.createTransaction
                .calledWith('txn')
                .mockReturnValue(mockTransaction);
        });
        it('gets the result of evaluating a transaction', async () => {
            const result = await (0, fabric_1.evatuateTransaction)(mockContract, 'txn', 'arga', 'argb');
            expect(result.toString()).toBe(mockPayload.toString());
        });
        it('throws an AssetExistsError an asset already exists error occurs', async () => {
            mockTransaction.evaluate.mockRejectedValue(new Error('The asset JSCHAINCODE already exists'));
            await expect(async () => {
                await (0, fabric_1.evatuateTransaction)(mockContract, 'txn', 'arga', 'argb');
            }).rejects.toThrow(errors_1.AssetExistsError);
        });
        it('throws an AssetNotFoundError if an asset does not exist error occurs', async () => {
            mockTransaction.evaluate.mockRejectedValue(new Error('The asset JSCHAINCODE does not exist'));
            await expect(async () => {
                await (0, fabric_1.evatuateTransaction)(mockContract, 'txn', 'arga', 'argb');
            }).rejects.toThrow(errors_1.AssetNotFoundError);
        });
        it('throws a TransactionNotFoundError if a transaction not found error occurs', async () => {
            mockTransaction.evaluate.mockRejectedValue(new Error('Failed to get transaction with id txn, error Entry not found in index'));
            await expect(async () => {
                await (0, fabric_1.evatuateTransaction)(mockContract, 'txn', 'arga', 'argb');
            }).rejects.toThrow(errors_1.TransactionNotFoundError);
        });
        it('throws an Error for other errors', async () => {
            mockTransaction.evaluate.mockRejectedValue(new Error('MOCK ERROR'));
            await expect(async () => {
                await (0, fabric_1.evatuateTransaction)(mockContract, 'txn', 'arga', 'argb');
            }).rejects.toThrow(Error);
        });
    });
    describe('submitTransaction', () => {
        let mockTransaction;
        beforeEach(() => {
            mockTransaction = (0, jest_mock_extended_1.mock)();
        });
        it('gets the result of submitting a transaction', async () => {
            const mockPayload = Buffer.from('MOCK PAYLOAD');
            mockTransaction.submit.mockResolvedValue(mockPayload);
            const result = await (0, fabric_1.submitTransaction)(mockTransaction, 'txn', 'arga', 'argb');
            expect(result.toString()).toBe(mockPayload.toString());
        });
        it('throws an AssetExistsError an asset already exists error occurs', async () => {
            mockTransaction.submit.mockRejectedValue(new Error('The asset JSCHAINCODE already exists'));
            await expect(async () => {
                await (0, fabric_1.submitTransaction)(mockTransaction, 'mspid', 'txn', 'arga', 'argb');
            }).rejects.toThrow(errors_1.AssetExistsError);
        });
        it('throws an AssetNotFoundError if an asset does not exist error occurs', async () => {
            mockTransaction.submit.mockRejectedValue(new Error('The asset JSCHAINCODE does not exist'));
            await expect(async () => {
                await (0, fabric_1.submitTransaction)(mockTransaction, 'mspid', 'txn', 'arga', 'argb');
            }).rejects.toThrow(errors_1.AssetNotFoundError);
        });
        it('throws a TransactionNotFoundError if a transaction not found error occurs', async () => {
            mockTransaction.submit.mockRejectedValue(new Error('Failed to get transaction with id txn, error Entry not found in index'));
            await expect(async () => {
                await (0, fabric_1.submitTransaction)(mockTransaction, 'mspid', 'txn', 'arga', 'argb');
            }).rejects.toThrow(errors_1.TransactionNotFoundError);
        });
        it('throws an Error for other errors', async () => {
            mockTransaction.submit.mockRejectedValue(new Error('MOCK ERROR'));
            await expect(async () => {
                await (0, fabric_1.submitTransaction)(mockTransaction, 'mspid', 'txn', 'arga', 'argb');
            }).rejects.toThrow(Error);
        });
    });
    describe('getTransactionValidationCode', () => {
        it('gets the validation code from a processed transaction', async () => {
            const processedTransactionProto = fabricProtos.protos.ProcessedTransaction.create();
            processedTransactionProto.validationCode =
                fabricProtos.protos.TxValidationCode.VALID;
            const processedTransactionBuffer = Buffer.from(fabricProtos.protos.ProcessedTransaction.encode(processedTransactionProto).finish());
            const mockTransaction = (0, jest_mock_extended_1.mock)();
            mockTransaction.evaluate.mockResolvedValue(processedTransactionBuffer);
            const mockContract = (0, jest_mock_extended_1.mock)();
            mockContract.createTransaction
                .calledWith('GetTransactionByID')
                .mockReturnValue(mockTransaction);
            expect(await (0, fabric_1.getTransactionValidationCode)(mockContract, 'txn1')).toBe('VALID');
        });
    });
    describe('getBlockHeight', () => {
        it('gets the current block height', async () => {
            const mockBlockchainInfoProto = fabricProtos.common.BlockchainInfo.create();
            mockBlockchainInfoProto.height = 42;
            const mockBlockchainInfoBuffer = Buffer.from(fabricProtos.common.BlockchainInfo.encode(mockBlockchainInfoProto).finish());
            const mockContract = (0, jest_mock_extended_1.mock)();
            mockContract.evaluateTransaction
                .calledWith('GetChainInfo', 'mychannel')
                .mockResolvedValue(mockBlockchainInfoBuffer);
            const result = (await (0, fabric_1.getBlockHeight)(mockContract));
            expect(result.toInt()).toStrictEqual(42);
        });
    });
});
//# sourceMappingURL=fabric.spec.js.map