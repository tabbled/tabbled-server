import { Injectable } from "@nestjs/common";
import { ApplyDto, ApplyEntityDto } from "./dto/aggregation.dto";
import { DataSourcesService } from "../datasources/datasources.service";
import { Context } from "../entities/context";

@Injectable()
export class AggregationsService {
    constructor(
        private dataSourcesService: DataSourcesService
    ) {}

    /** Move inventory in aggregation datasource from source to target aggregator
     */
    async conduct(params: ApplyDto, context: Context) {
        let ds = await this.dataSourcesService.getByAlias(params.dataSource, context)
        if (!ds.config.isAggregator) {
            throw 'DataSource is not an aggregator'
        }

        let queryRunner = ds.dataSource.createQueryRunner()
        await queryRunner.startTransaction()

        try {
            for(const i in params.records) {
                const rec = params.records[i]

                if (rec.target && rec.target.keys) {
                    let target = await ds.getByKeys(rec.target.keys)
                    if (!target) {
                        target = await makeNew(rec.target)
                        await ds.insertData(target, queryRunner)
                    } else {
                        Object.keys(rec.target.values).forEach(f => {
                            target.data[f] += rec.target.values[f]
                        })
                        await ds.updateData(target.id, target, queryRunner)
                    }
                }

                if (rec.source && rec.source.keys) {
                    let source = await ds.getByKeys(rec.source.keys)
                    if (!source) {
                        source = await makeNew(rec.source)
                        await ds.insertData(source, queryRunner)
                    } else {
                        Object.keys(rec.source.values).forEach(f => {
                            source.data[f] -= rec.source.values[f]
                        })
                        await ds.updateData(source.id, source, queryRunner)
                    }
                }
            }

            await queryRunner.commitTransaction();
            return true
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e
        } finally {
            await queryRunner.release();
        }



        async function makeNew(params: ApplyEntityDto) {
            let data = {}
            Object.keys(params.keys).forEach(f => {
                data[f] = params.keys[f]
            })
            Object.keys(params.values).forEach(f => {
                data[f] = Number(params.values[f])
            })

            return await ds.setDefaultValues(data)
        }
    }
}
