import { IndexerDataAdapter } from "./data-indexer.adapter";
import { DataSource } from "typeorm";
import { MeiliSearch } from "meilisearch";
import { Context } from "../entities/context";
import { DataSourceV2Dto } from "../datasources/dto/datasourceV2.dto";
import { DatasourceField } from "../datasources/entities/field.entity";
import * as dayjs from "dayjs";

export class InternalDbAdapter  extends IndexerDataAdapter {
    constructor(dataSource: DataSource, searchClient: MeiliSearch) {
        super(dataSource, searchClient)
    }

    // Get items from database to index documents into meilisearch
    async getData(ds: DataSourceV2Dto, context: Context, ids?: string[]) : Promise<any[]> {
        const schema = `"account_data${context.accountId}"."${ds.alias}"`
        console.log("Reindex for schema ", schema)

        let fields = ds.fields.map(f => `"${f.alias}"` )
        let query = `SELECT ${fields.join(', ')} FROM ${schema}`

        if (ids && ids.length > 0) {
            query += ` WHERE id IN (${ids.join(',')})`
        }

        let items = await this.dataSource.query(query)

        let docs = []
        for (let i in items) {
            docs.push(await this.prepareItemForIndex(items[i], ds.fields))
        }
        return docs
    }

    private async prepareItemForIndex(item: any, fields: DatasourceField[]): Promise<object> {
        let o = {}
        for(let i in fields) {
            const field = fields[i]
            let val = item[field.alias]

            if (field.isMultiple) {
                val = JSON.parse(val)
            } else {
                if(['datetime', 'date'].includes(field.type)) {
                    val = val ? dayjs(val).utc(false).valueOf() : null
                }

                if (field.type === 'number') {
                    val = Number(val)
                }

                if (field.type === 'string' ) {
                    val = val !== undefined && val !== null ? String(val) : ""
                }
            }

            o[field.alias] = val
        }
        return o
    }
}