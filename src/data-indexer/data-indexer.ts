import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { Index, MeiliSearch } from "meilisearch";
import {
    DataReindexDto,
    GetDataManyDto,
    GetDataManyParamsDto,
    SystemFields
} from "../datasources/dto/datasourceV2.dto";
import { Context } from "../entities/context";
import { DataItem } from "../datasources/entities/dataitem.entity";
import { DataSourceConfigInterface } from "../datasources/entities/datasource.entity";
import { FieldConfigInterface } from "../entities/field";
import * as dayjs from "dayjs";
import { ConfigItem } from "../config/entities/config.entity";
import { SearchParams } from "meilisearch/src/types/types";
import { FilterItemInterface } from "../datasources/dto/datasource.dto";
import * as utc from "dayjs/plugin/utc";
import * as timezone from "dayjs/plugin/timezone";

import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";
import { DatasourceField } from "../datasources/entities/field.entity";
dayjs.extend(utc);
dayjs.extend(timezone);


export class DataIndexer {
    constructor(configService: ConfigService,
                @InjectDataSource('default')
                private datasource: DataSource) {
        this.searchClient = new MeiliSearch({
            host: configService.get<string>('MAILISEARCH_HOST'),
            apiKey: configService.get<string>('MAILISEARCH_MASTER_KEY') ,
        })
    }

    private readonly logger = new Logger(DataIndexer.name);
    private readonly searchClient:MeiliSearch = null
    private timezone = 'Europe/Moscow'
    public setTimezone(val) {
        this.timezone = val
        dayjs.tz.setDefault(this.timezone)
    }

    public getIndexUid = (alias, context) => `${context.accountId}_${alias}`

    public async getDataMany(params: GetDataManyParamsDto, context: Context) : Promise<GetDataManyDto> {
        let index:Index
        try {
            index = await this.searchClient.getIndex(this.getIndexUid(params.dataSourceConfig.alias, context))
        } catch (e) {
            throw e
        }

        let dsFields = params.dataSourceConfig.fields
        const allFields = new Map(dsFields.map(i => [i.alias, i]))

        let filterBy = params.filterBy

        if (!filterBy && params.filter) {
            filterBy = this.convertFilterToSearch(params.filter, allFields)
        }


        let searchParams:SearchParams = {
            sort: params.sort,
            attributesToSearchOn: params.searchBy,
            filter: filterBy,
            offset: params.offset,
            limit: params.limit,
            attributesToRetrieve: params.fields
        }

        let res = await index.search(params.query, searchParams)

        return {
            items: res.hits.map(i=> this.prepareItemForUser(i, allFields)),
            count: res.estimatedTotalHits
        }
    }

    public async dataReindex(params: DataReindexDto, context: Context) : Promise<number> {
        if (params.dataSourceConfig.source !== 'internal')
            throw `DataSource is not an internal source`



        const indexUid = this.getIndexUid(params.dataSourceConfig.alias, context)
        this.logger.log(`Indexing data to index ${indexUid}, ids: ${params.ids?.join(',')}`, )
        let newIndexUid = ""

        let index: Index = await this.getIndex(indexUid)
        if (!index) {
            await this.createIndex(indexUid)
            index = await this.getIndex(indexUid)
            await this.updateIndexSettings(index, params.dataSourceConfig.fields)
        } else if (!params.ids || !params.ids.length){
            newIndexUid = `${indexUid}__new__`
            await this.searchClient.deleteIndexIfExists(newIndexUid)
            await this.createIndex(newIndexUid)
            index = await this.getIndex(newIndexUid)
            await this.updateIndexSettings(index, params.dataSourceConfig.fields)
        }

        const rep = this.datasource.getRepository(DataItem)
        let query = rep
            .createQueryBuilder()
            .select('data, ' + params.dataSourceConfig.fields.filter(f=>f.isSystem).map(f => f.alias).join(','))
            .where(
                `alias = :alias`,
                { alias: params.dataSourceConfig.alias }
            )

        if (params.ids && params.ids.length > 0) {
            query.andWhere(`id IN (${params.ids.join(',')})`)
        }

        let items = await query.getRawMany()

        let dsFields = params.dataSourceConfig.fields

        // Get all data source configs for link nesting
        let linkDataSource: Map<string, DataSourceConfigInterface> = new Map()
        for (let i in dsFields) {
            const f = dsFields[i]
            if (f.type === 'link' && !f.isSystem) {
                let config = await this.getConfigByAlias(f.datasource)
                if (config)
                    linkDataSource.set(f.datasource, config)
            }
        }

        let docs = []
        for (let i in items) {
            docs.push(await this.prepareItemForIndex(items[i], dsFields, linkDataSource))
        }

        let taskUid = (await index.addDocuments(docs)).taskUid

        let task = await this.searchClient.waitForTask(taskUid)
        if (task.status !== 'succeeded')
            throw task.error

        if (newIndexUid !== "") {
            await this.searchClient.swapIndexes([{indexes: [indexUid, newIndexUid]}])
        }


        if (params.ids && params.ids.length > 0) {
            await this.updateLinkedData(params, context)
        }

        return items.length
    }

    public async updateLinkedData(params: DataReindexDto, context: Context) {
        if (params.dataSourceConfig.source !== 'internal')
            throw `DataSource is not an internal source`

        if (!params.ids.length)
            return

        const itemsRep = await this.datasource.getRepository(DataItem)
        let items = await itemsRep
            .createQueryBuilder()
            .select('id, data')
            .where(
                `alias = :alias AND id IN (${params.ids.join(',')})`,
                { alias: params.dataSourceConfig.alias }
            ).getRawMany()

        this.logger.log(`Indexing linked docs to ${params.dataSourceConfig.alias}`)


        let rep = this.datasource.getRepository(DatasourceField)
        let links = await rep
            .createQueryBuilder()
            .select('datasource_alias, alias as field_alias')
            .where(
                `datasource_ref = :ref`,
                { ref: params.dataSourceConfig.alias }
            )
            .getRawMany()



        for(let i in links) {
            let link = links[i]
            await this.updateLinkItem(items, link, context)
        }


    }

    private async updateLinkItem(items: any[], link: {datasource_alias: string, field_alias: string}, context: Context) {
        let index = await this.getIndex(this.getIndexUid(link.datasource_alias, context))
        if (!index) {
            this.logger.error(`Linked index ${link.datasource_alias} doesn't exist`)
            return;
        }


        let rep = this.datasource.getRepository(DataItem)

        for(let i in items) {
            let item = items[i]



            let linkedItems = await rep.createQueryBuilder()
                .select('id')
                .where(`data ->> '${link.field_alias}' = '${item.id}' AND alias = '${link.datasource_alias}'`)
                .getRawMany()

            if (!linkedItems.length)
                continue

            this.logger.log(`Indexing linked docs ${link.datasource_alias} for item ${item.id}, to update: ${linkedItems.length}`)

            let docs = linkedItems.map(i => {
                return {
                    id: i.id,
                    [link.field_alias]: item.data
                }
            })

            let taskUid = (await index.updateDocuments(docs)).taskUid
            let task = await this.searchClient.waitForTask(taskUid)
            if (task.status !== 'succeeded') {
                this.logger.error(`Got error while indexing`)
                this.logger.error(task.error)
                throw task.error
            }
        }
    }



    private async prepareItemForIndex(item: any, fields: FieldConfigInterface[], linkDs: Map<string, DataSourceConfigInterface>): Promise<object> {
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

            if (field.type === 'link' && !field.isSystem) {
                val = await this.getLinkItemForIndex(val, field, linkDs)
            }

            if (!field.isMultiple && field.type === 'string' ) {
                val = val !== undefined && val !== null ? String(val) : ""
            }

            o[field.alias] = val
        }
        return o
    }

    private async getLinkItemForIndex(id: string | string[], field: FieldConfigInterface, linkDs: Map<string, DataSourceConfigInterface>): Promise<object | null> {
        if (!id)
            return null

        let ds = linkDs.get(field.datasource)
        if (!ds) return {
            id
        }

        const rep = this.datasource.getRepository(DataItem)

        let val = <Array<string>>id
        if (field.isMultiple) {
            if (!Array.isArray(id))
                val = [id]

            if (!val.length)
                return []

            let items = await rep
                .createQueryBuilder()
                .select('data')
                .where(
                    `alias = :alias AND id in (${val.join(',')})`,
                    { alias: ds.alias }
                )
                .getRawMany()

            val = items.map(i => i.data)
        } else {
            let item = await rep
                .createQueryBuilder()
                .select('data')
                .where(
                    `alias = :alias AND id = :id`,
                    { alias: ds.alias, id }
                )
                .getRawOne()

            val = item.data
        }

        return val
    }

    private async getConfigByAlias(alias: string): Promise<DataSourceConfigInterface> {
        const rep = this.datasource.getRepository(ConfigItem)
        let item = await rep
            .createQueryBuilder()
            .where(
                `alias = 'datasource' AND (data ->> 'alias')::varchar = :alias and deleted_at IS NULL`,
                { alias: alias }
            )
            .getOne()

        if (item) {
            item.data.fields.push(...SystemFields)
        }

        return item ? item.data : null
    }

    private prepareItemForUser(item: any, fields: Map<string, FieldConfigInterface>, timezone = this.timezone):DataItem {
        let o = item
        Object.keys(item).forEach(alias => {
            if (fields.has(alias) && ['datetime', 'time', 'date'].includes(fields.get(alias).type)) {
                item[alias] = item[alias] ? dayjs(Number(item[alias])).tz(timezone).format() : null
            }
        })
        return o
    }

    private convertFilterToSearch(filter: FilterItemInterface[], fields: Map<string, FieldConfigInterface>) {
        let query:string = ""
        const andWhere = (where) => {
            if (where) query += query.length > 0 ? ` AND ${where}` : where
        }
        const convertValue = (val, field: FieldConfigInterface) => {
            if(['datetime', 'time', 'date'].includes(field.type)) {
                return val ? dayjs(val).utc(false).valueOf() : null
            }
            if(['string', 'enum', 'link'].includes(field.type)) {
                return `'${val}'`
            }

            return val
        }
        for (let i in filter) {
            let f = filter[i]

            let field = fields.get(f.key)

            if (!field || !field.filterable) {
                this.logger.log(`Field ${f.key} is not filterable or not exists`)
                continue
            }

            switch (f.op) {
                case '==':
                    andWhere(`${f.key} = ${convertValue(f.compare, field)}`)
                    break
                case '!=':
                case '<':
                case '<=':
                case '>':
                case '>=':
                    andWhere(`${f.key} ${f.op} ${convertValue(f.compare, field)}`)
                    break
                case 'in':
                case '!in':
                    let strArr = f.compare.join(',')
                    if (strArr)
                        andWhere(`${f.key} ${f.op === '!in' ? 'NOT' : ""} IN [${strArr}]`)
                    break
                case 'between':
                    if (f.compare && f.compare_2) {
                        andWhere(`${f.key} ${convertValue(f.compare, field)} TO ${convertValue(f.compare_2, field)}`)
                    } else if (f.compare) {
                        andWhere(`${f.key} >= ${convertValue(f.compare, field)}`)
                    } else {
                        andWhere(`${f.key} <= ${convertValue(f.compare_2, field)}`)
                    }
                    break
                case "empty":
                case "!empty":
                    andWhere(`(${f.op === '!empty' ? 'NOT' : ""} ${f.key} IS EMPTY ${ f.op === '!empty' ? 'AND' : "OR" } ${f.op === '!empty' ? 'NOT' : ""} ${f.key} IS NULL)`)
                    break
                default:
                    this.logger.log(`Unknown '${f.op}' operator`)
            }
        }
        return query
    }

    async getIndex(uid: string) : Promise<Index> {
        try {
            return await this.searchClient.getIndex(uid)
        } catch (e) {
            if (e.httpStatus === 404) {
                return null
            } else
                throw e
        }
    }

    async createIndex(uid) {
        let taskUid = (await this.searchClient.createIndex(uid, {
            primaryKey: "id"
        })).taskUid
        let task = await this.searchClient.waitForTask(taskUid)
        if (task.status !== 'succeeded')
            throw task.error
    }

    async updateIndexSettings(index: Index, fields: FieldConfigInterface[]) {
        let sort = fields.filter(f=>f.sortable).map(f=>f.alias)
        let filter = fields.filter(f=>f.filterable).map(f=>f.alias)
        let search = fields.filter(f=>f.searchable).map(f=>f.alias)

        let taskUid = (await index.updateSettings({
            sortableAttributes: sort,
            displayedAttributes: ['*'],
            filterableAttributes: filter,
            searchableAttributes: search.length ? search : ['*']
        })).taskUid

        let task = await this.searchClient.waitForTask(taskUid)
        if (task.status !== 'succeeded')
            throw task.error
    }
}