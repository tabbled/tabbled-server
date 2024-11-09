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

        let fields = ds.fields.filter(f=>!f.isLinked)
        let query = `SELECT ${fields.map(f => `"${f.alias}"` ).join(', ')} FROM ${schema}`

        if (ids && ids.length > 0) {
            query += ` WHERE id IN (${ids.join(',')})`
        }

        let items = await this.dataSource.query(query)

        let docs = []
        for (let i in items) {
            docs.push(await this.prepareItemForIndex(items[i], fields))
        }

        if (ds.isTree) {
            this.prepareTree(docs)
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
                if(field.type === 'datetime') {
                    val = val ? dayjs(val).utc().valueOf() : null
                } else if (field.type === 'date') {
                    if (val) {
                        let d = dayjs.tz(val.slice(0,10), 'YYYY-MM-DD', 'UTC')
                        val = Number(d.format('YYYYMMDD'))
                    } else
                        val = null
                } else if (field.type === 'time') {
                    if (val) {
                        let s = val.split(':')
                        val = s.length === 3 ? Number(s[0]) * 60 * 60 + Number(s[1]) * 60 + Number(s[2]) : null
                    }
                } else if (field.type === 'number') {
                    val = val ? Number(val) : null
                } else if (field.type === 'string' ) {
                    val = val !== undefined && val !== null ? String(val) : ""
                }
            }

            o[field.alias] = val
        }
        return o
    }
}