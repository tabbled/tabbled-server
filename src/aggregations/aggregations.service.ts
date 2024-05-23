import { Injectable } from '@nestjs/common'
import {
    ConductDto,
    ApplyEntityDto,
    HistoryDto,
    MovementDto,
    ReverseDto,
} from './dto/aggregation.dto'
import { DataSourcesService } from '../datasources/datasources.service'
import { Context } from '../entities/context'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, QueryRunner } from 'typeorm'
import {
    AggregationHistory,
    AggregationMovement,
} from './entities/aggregation.entity'

@Injectable()
export class AggregationsService {
    constructor(
        private dataSourcesService: DataSourcesService,
        @InjectDataSource('default')
        private datasource: DataSource
    ) {}

    /** Move inventory in aggregation datasource from source to target aggregator
     */
    async conduct(params: ConductDto, context: Context) {
        let ds = await this.dataSourcesService.getByAlias(
            params.dataSource,
            context
        )
        if (!ds.config.isAggregator) {
            throw 'DataSource is not an aggregator'
        }

        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()

        try {
            for (const i in params.records) {
                const rec = params.records[i]

                if (rec.target && rec.target.keys) {
                    let target = await ds.getByKeysRaw(rec.target.keys)
                    if (!target) {
                        target = await makeNew(rec.target)
                        await ds.insertData(target, queryRunner)
                    } else {
                        Object.keys(rec.target.values).forEach((f) => {
                            target.data[f] += rec.target.values[f]
                        })
                        await ds.updateData(target.id, target, queryRunner)
                    }

                    await this.addHistory(queryRunner, {
                        issuerId: params.issuerId,
                        dataSource: params.dataSource,
                        keys: rec.target.keys,
                        values: rec.target.values,
                    })
                }

                if (rec.source && rec.source.keys) {
                    let source = await ds.getByKeysRaw(rec.source.keys)
                    if (!source) {
                        source = await makeNew(rec.source)
                        await ds.insertData(source, queryRunner)
                    } else {
                        Object.keys(rec.source.values).forEach((f) => {
                            source.data[f] -= rec.source.values[f]
                        })
                        await ds.updateData(source.id, source, queryRunner)
                    }

                    let values = {}
                    Object.keys(rec.source.values).forEach((f) => {
                        values[f] = -rec.source.values[f]
                    })

                    await this.addHistory(queryRunner, {
                        issuerId: params.issuerId,
                        dataSource: params.dataSource,
                        keys: rec.source.keys,
                        values: values,
                    })
                }

                await this.addMovements(queryRunner, {
                    dataSource: params.dataSource,
                    issuerId: params.issuerId,
                    target: rec.target,
                    source: rec.source,
                })
            }

            await queryRunner.commitTransaction()
            return true
        } catch (e) {
            await queryRunner.rollbackTransaction()
            throw e
        } finally {
            await queryRunner.release()
        }

        async function makeNew(params: ApplyEntityDto) {
            let data = {}
            Object.keys(params.keys).forEach((f) => {
                data[f] = params.keys[f]
            })
            Object.keys(params.values).forEach((f) => {
                data[f] = Number(params.values[f])
            })

            return await ds.setDefaultValues(data)
        }
    }

    /* Reverse values fo all items of conducted document
     * */
    async reverse(params: ReverseDto, context: Context) {
        let ds = await this.dataSourcesService.getByAlias(
            params.dataSource,
            context
        )
        if (!ds.config.isAggregator) {
            throw 'DataSource is not an aggregator'
        }

        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()

        try {
            let hist = await this.getHistoryByIssuerId(
                queryRunner,
                params.dataSource,
                params.issuerId
            )

            for (const i in hist) {
                let source = await ds.getByKeysRaw(hist[i].keys)
                let h = hist[i]

                if (!source) continue

                Object.keys(h.values).forEach((f) => {
                    source.data[f] -= h.values[f]
                })

                await ds.updateData(source.id, source, queryRunner)
            }

            await queryRunner.manager
                .createQueryBuilder()
                .delete()
                .from(AggregationMovement)
                .where({
                    issuerId: params.issuerId,
                })
                .execute()
            await queryRunner.manager
                .createQueryBuilder()
                .delete()
                .from(AggregationHistory)
                .where({
                    issuerId: params.issuerId,
                })
                .execute()

            await queryRunner.commitTransaction()
            return true
        } catch (e) {
            await queryRunner.rollbackTransaction()
            throw e
        } finally {
            await queryRunner.release()
        }
    }

    async addMovements(queryRunner: QueryRunner, movement: MovementDto) {
        try {
            await queryRunner.manager.insert(AggregationMovement, {
                issuerId: movement.issuerId,
                sourceDatasource: movement.dataSource,
                targetDatasource: movement.dataSource,
                sourceKeys: movement.source.keys,
                targetKeys: movement.target.keys,
                sourceValues: movement.source.values,
                targetValues: movement.target.values,
            })
        } catch (e) {
            throw e
        }
    }

    async addHistory(queryRunner: QueryRunner, history: HistoryDto) {
        try {
            await queryRunner.manager
                .createQueryBuilder()
                .insert()
                .into(AggregationHistory)
                .values({
                    issuerId: history.issuerId,
                    datasource: history.dataSource,
                    keys: history.keys,
                    values: history.values,
                })
                .execute()
        } catch (e) {
            throw e
        }
    }

    async getHistoryByIssuerId(queryRunner: QueryRunner, datasource, issuerId) {
        return await queryRunner.manager.find(AggregationHistory, {
            where: {
                issuerId: issuerId,
                datasource: datasource,
            },
        })
    }
}
