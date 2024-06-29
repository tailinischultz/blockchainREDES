/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class AssetTransfer extends Contract {

    async InitLedger(ctx) {
        const assets = [
            {
                ID: 'lote1',
                InsumosUtilizados: 'Fertilizante X',
                Tipo: 'Cultivo e Colheita',
                DataInicio: '22/03/2023',
                DataFinal: '22/04/2023',
                Responsavel: 'Fazenda A',
                Status: 'Concluído',
            },
            {
                ID: 'lote2',
                InsumosUtilizados: 'Fertilizante Y',
                Tipo: 'Transporte',
                DataInicio: '22/03/2023',
                DataFinal: '22/04/2023',
                Responsavel: 'Transportadora A',
                Status: 'Em trânsito',
            },
            {
                ID: 'lote3',
                InsumosUtilizados: 'Fertilizante Y',
                Tipo: 'Processamento',
                DataInicio: '22/03/2023',
                DataFinal: '22/04/2023',
                Responsavel: 'Usina A',
                Status: 'Processado',
            },
            {
                ID: 'lote4',
                InsumosUtilizados: 'Fertilizante Y',
                Tipo: 'Distribuição',
                DataInicio: '22/03/2023',
                DataFinal: '22/04/2023',
                Responsavel: 'Distribuidora A',
                Status: 'Entregue',
            },
            {
                ID: 'lote5',
                InsumosUtilizados: 'Fertilizante Y',
                Tipo: 'Venda',
                DataInicio: '22/03/2023',
                DataFinal: '22/04/2023',
                Responsavel: 'Supermercado A',
                Status: 'Vendido',
            },
            {
                ID: 'lote6',
                InsumosUtilizados: 'Fertilizante Y',
                Tipo: 'Venda',
                DataInicio: '22/03/2023',
                DataFinal: '22/04/2023',
                Responsavel: 'Supermercado B',
                Status: 'Vendido',
            },
        ];

        for (const asset of assets) {
            asset.docType = 'asset';
            await ctx.stub.putState(asset.ID, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
    }

    // CreateAsset issues a new asset to the world state with given details.
    async CreateAsset(ctx, id, insumosUtilizados, tipo, dataInicio, dataFinal, responsavel, status) {
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }

        const asset = {
            ID: id,
            InsumosUtilizados: insumosUtilizados,
            Tipo: tipo,
            DataInicio: dataInicio,
            DataFinal: dataFinal,
            Responsavel: responsavel,
            Status: status,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async ReadAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async UpdateAsset(ctx, id, insumosUtilizados, tipo, dataInicio, dataFinal, responsavel, status) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }

        // overwriting original asset with new asset
        const updatedAsset = {
            ID: id,
            InsumosUtilizados: insumosUtilizados,
            Tipo: tipo,
            DataInicio: dataInicio,
            DataFinal: dataFinal,
            Responsavel: responsavel,
            Status: status,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
    }

    // DeleteAsset deletes an given asset from the world state.
    async DeleteAsset(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // TransferAsset updates the owner field of asset with given id in the world state.
    async TransferAsset(ctx, id, novoResponsavel) {
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        const oldOwner = asset.Responsavel;
        asset.Responsavel = novoResponsavel;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return oldOwner;
    }

    // GetAllAssets returns all assets found in the world state.
    async GetAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = AssetTransfer;
