import { IndexerDataAdapter } from "./data-indexer.adapter";
import { DataSource } from "typeorm";
import { MeiliSearch } from "meilisearch";
import { Context } from "../entities/context";
import { DataSourceV2Dto } from "../datasources/dto/datasourceV2.dto";
import { DatasourceField } from "../datasources/entities/field.entity";
import * as dayjs from "dayjs";
import { DataItem } from "../datasources/entities/dataitem.entity";

export class InternalAdapter extends IndexerDataAdapter {
    constructor(dataSource: DataSource, searchClient: MeiliSearch) {
        super(dataSource, searchClient)
    }

    async getData(ds: DataSourceV2Dto, context: Context, ids?: string[]) : Promise<any[]> {
        const rep = this.dataSource.getRepository(DataItem)
        let query = rep
            .createQueryBuilder()
            .select('data, ' + ds.fields.filter(f=>f.isSystem).map(f => f.alias).join(','))
            .where(
                `alias = :alias`,
                { alias: ds.alias }
            )

        if (ids && ids.length > 0) {
            query.andWhere(`id IN (${ids.join(',')})`)
        }

        let items = await query.getRawMany()

        let docs = []
        for (let i in items) {
            docs.push(await this.prepareItemForIndex(items[i], ds.fields/*, linkDataSource*/))
        }
        return docs
    }

    private async prepareItemForIndex(item: any, fields: DatasourceField[]): Promise<object> {
        let o = {}

        for(let i in fields) {
            const field = fields[i]
            let val = field.isSystem ? item[field.alias] : item.data[field.alias]

            if(['datetime', 'time', 'date'].includes(field.type)) {
                val = val ? dayjs(val).utc(false).valueOf() : null
            }

            if (field.type === 'number') {
                val = Number(val)
            }

            if (!field.isMultiple && field.type === 'string' ) {
                val = val !== undefined && val !== null ? String(val) : ""
            }

            o[field.alias] = val
        }
        return o
    }

}