"use strict";
/*
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fabric_network_1 = require("fabric-network");
const errors_1 = require("./errors");
const jest_mock_extended_1 = require("jest-mock-extended");
describe('Errors', () => {
    describe('isErrorLike', () => {
        it('returns false for null', () => {
            expect((0, errors_1.isErrorLike)(null)).toBe(false);
        });
        it('returns false for undefined', () => {
            expect((0, errors_1.isErrorLike)(undefined)).toBe(false);
        });
        it('returns false for empty object', () => {
            expect((0, errors_1.isErrorLike)({})).toBe(false);
        });
        it('returns false for string', () => {
            expect((0, errors_1.isErrorLike)('true')).toBe(false);
        });
        it('returns false for non-error object', () => {
            expect((0, errors_1.isErrorLike)({ size: 42 })).toBe(false);
        });
        it('returns false for invalid error object', () => {
            expect((0, errors_1.isErrorLike)({ name: 'MockError', message: 42 })).toBe(false);
        });
        it('returns false for error like object with invalid stack', () => {
            expect((0, errors_1.isErrorLike)({
                name: 'MockError',
                message: 'Fail',
                stack: false,
            })).toBe(false);
        });
        it('returns true for error like object', () => {
            expect((0, errors_1.isErrorLike)({ name: 'MockError', message: 'Fail' })).toBe(true);
        });
        it('returns true for new Error', () => {
            expect((0, errors_1.isErrorLike)(new Error('Error'))).toBe(true);
        });
    });
    describe('isDuplicateTransactionError', () => {
        it('returns true for a TransactionError with a transaction code of DUPLICATE_TXID', () => {
            const mockDuplicateTransactionError = (0, jest_mock_extended_1.mock)();
            mockDuplicateTransactionError.transactionCode = 'DUPLICATE_TXID';
            expect((0, errors_1.isDuplicateTransactionError)(mockDuplicateTransactionError)).toBe(true);
        });
        it('returns false for a TransactionError without a transaction code of MVCC_READ_CONFLICT', () => {
            const mockDuplicateTransactionError = (0, jest_mock_extended_1.mock)();
            mockDuplicateTransactionError.transactionCode =
                'MVCC_READ_CONFLICT';
            expect((0, errors_1.isDuplicateTransactionError)(mockDuplicateTransactionError)).toBe(false);
        });
        it('returns true for an error when all endorsement details are duplicate transaction found', () => {
            const mockDuplicateTransactionError = {
                errors: [
                    {
                        endorsements: [
                            {
                                details: 'duplicate transaction found',
                            },
                            {
                                details: 'duplicate transaction found',
                            },
                            {
                                details: 'duplicate transaction found',
                            },
                        ],
                    },
                ],
            };
            expect((0, errors_1.isDuplicateTransactionError)(mockDuplicateTransactionError)).toBe(true);
        });
        it('returns true for an error when at least one endorsement details are duplicate transaction found', () => {
            const mockDuplicateTransactionError = {
                errors: [
                    {
                        endorsements: [
                            {
                                details: 'duplicate transaction found',
                            },
                            {
                                details: 'mock endorsement details',
                            },
                            {
                                details: 'mock endorsement details',
                            },
                        ],
                    },
                ],
            };
            expect((0, errors_1.isDuplicateTransactionError)(mockDuplicateTransactionError)).toBe(true);
        });
        it('returns false for an error without duplicate transaction endorsement details', () => {
            const mockDuplicateTransactionError = {
                errors: [
                    {
                        endorsements: [
                            {
                                details: 'mock endorsement details',
                            },
                            {
                                details: 'mock endorsement details',
                            },
                        ],
                    },
                ],
            };
            expect((0, errors_1.isDuplicateTransactionError)(mockDuplicateTransactionError)).toBe(false);
        });
        it('returns false for an error without endorsement details', () => {
            const mockDuplicateTransactionError = {
                errors: [
                    {
                        rejections: [
                            {
                                details: 'duplicate transaction found',
                            },
                        ],
                    },
                ],
            };
            expect((0, errors_1.isDuplicateTransactionError)(mockDuplicateTransactionError)).toBe(false);
        });
        it('returns false for a basic Error object without endorsement details', () => {
            expect((0, errors_1.isDuplicateTransactionError)(new Error('duplicate transaction found'))).toBe(false);
        });
        it('returns false for an undefined error', () => {
            expect((0, errors_1.isDuplicateTransactionError)(undefined)).toBe(false);
        });
        it('returns false for a null error', () => {
            expect((0, errors_1.isDuplicateTransactionError)(null)).toBe(false);
        });
    });
    describe('getRetryAction', () => {
        it('returns RetryAction.None for duplicate transaction errors', () => {
            const mockDuplicateTransactionError = {
                errors: [
                    {
                        endorsements: [
                            {
                                details: 'duplicate transaction found',
                            },
                            {
                                details: 'duplicate transaction found',
                            },
                            {
                                details: 'duplicate transaction found',
                            },
                        ],
                    },
                ],
            };
            expect((0, errors_1.getRetryAction)(mockDuplicateTransactionError)).toBe(errors_1.RetryAction.None);
        });
        it('returns RetryAction.None for a TransactionNotFoundError', () => {
            const mockTransactionNotFoundError = new errors_1.TransactionNotFoundError('Failed to get transaction with id txn, error Entry not found in index', 'txn1');
            expect((0, errors_1.getRetryAction)(mockTransactionNotFoundError)).toBe(errors_1.RetryAction.None);
        });
        it('returns RetryAction.None for an AssetExistsError', () => {
            const mockAssetExistsError = new errors_1.AssetExistsError('The asset MOCK_ASSET already exists', 'txn1');
            expect((0, errors_1.getRetryAction)(mockAssetExistsError)).toBe(errors_1.RetryAction.None);
        });
        it('returns RetryAction.None for an AssetNotFoundError', () => {
            const mockAssetNotFoundError = new errors_1.AssetNotFoundError('the asset MOCK_ASSET does not exist', 'txn1');
            expect((0, errors_1.getRetryAction)(mockAssetNotFoundError)).toBe(errors_1.RetryAction.None);
        });
        it('returns RetryAction.WithExistingTransactionId for a TimeoutError', () => {
            const mockTimeoutError = new fabric_network_1.TimeoutError('MOCK TIMEOUT ERROR');
            expect((0, errors_1.getRetryAction)(mockTimeoutError)).toBe(errors_1.RetryAction.WithExistingTransactionId);
        });
        it('returns RetryAction.WithNewTransactionId for an MVCC_READ_CONFLICT TransactionError', () => {
            const mockTransactionError = (0, jest_mock_extended_1.mock)();
            mockTransactionError.transactionCode = 'MVCC_READ_CONFLICT';
            expect((0, errors_1.getRetryAction)(mockTransactionError)).toBe(errors_1.RetryAction.WithNewTransactionId);
        });
        it('returns RetryAction.WithNewTransactionId for an Error', () => {
            const mockError = new Error('MOCK ERROR');
            expect((0, errors_1.getRetryAction)(mockError)).toBe(errors_1.RetryAction.WithNewTransactionId);
        });
        it('returns RetryAction.WithNewTransactionId for a string error', () => {
            const mockError = 'MOCK ERROR';
            expect((0, errors_1.getRetryAction)(mockError)).toBe(errors_1.RetryAction.WithNewTransactionId);
        });
    });
    describe('handleError', () => {
        it.each([
            'the asset GOCHAINCODE already exists',
            'Asset JAVACHAINCODE already exists',
            'The asset JSCHAINCODE already exists',
        ])('returns a AssetExistsError for errors with an asset already exists message: %s', (msg) => {
            expect((0, errors_1.handleError)('txn1', new Error(msg))).toStrictEqual(new errors_1.AssetExistsError(msg, 'txn1'));
        });
        it.each([
            'the asset GOCHAINCODE does not exist',
            'Asset JAVACHAINCODE does not exist',
            'The asset JSCHAINCODE does not exist',
        ])('returns a AssetNotFoundError for errors with an asset does not exist message: %s', (msg) => {
            expect((0, errors_1.handleError)('txn1', new Error(msg))).toStrictEqual(new errors_1.AssetNotFoundError(msg, 'txn1'));
        });
        it.each([
            'Failed to get transaction with id txn, error Entry not found in index',
            'Failed to get transaction with id txn, error no such transaction ID [txn] in index',
        ])('returns a TransactionNotFoundError for errors with a transaction not found message: %s', (msg) => {
            expect((0, errors_1.handleError)('txn1', new Error(msg))).toStrictEqual(new errors_1.TransactionNotFoundError(msg, 'txn1'));
        });
        it('returns the original error for errors with other messages', () => {
            expect((0, errors_1.handleError)('txn1', new Error('MOCK ERROR'))).toStrictEqual(new Error('MOCK ERROR'));
        });
        it('returns the original error for errors of other types', () => {
            expect((0, errors_1.handleError)('txn1', 42)).toEqual(42);
        });
    });
});
//# sourceMappingURL=errors.spec.js.map