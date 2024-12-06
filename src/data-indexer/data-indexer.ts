import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { Index, MeiliSearch } from "meilisearch";
import {
    DataReindexDto,
    DataSourceType,
    DataSourceV2Dto, ExportDataRequestDto,
    GetDataManyDto,
    GetDataManyRequestDto, GetTotalDataManyRequestDto, GetTotalsResponseDto
} from "../datasources/dto/datasourceV2.dto";
import { Context } from "../entities/context";
import { DataItem } from "../datasources/entities/dataitem.entity";
import * as dayjs from "dayjs";
import { SearchParams } from "meilisearch/src/types/types";
import { FilterItemInterface } from "../datasources/dto/datasource.dto";
import * as utc from "dayjs/plugin/utc";
import * as timezone from "dayjs/plugin/timezone";
import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";
import { DatasourceField } from "../datasources/entities/field.entity";
import { IndexerDataAdapter } from "./data-indexer.adapter";
import { InternalAdapter } from "./internal.adapter";
import { InternalDbAdapter } from "./internal-db.adapter";
import * as _ from "lodash";
import 'dayjs/locale/ru'
import * as numeral from "numeral";


dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale()

numeral.register('locale', 'ru', {
    delimiters: {
        thousands: ' ',
        decimal: ','
    },
    abbreviations: {
        thousand: 'k',
        million: 'm',
        billion: 'b',
        trillion: 't'
    },
    ordinal : function (number) {
        return number === 1 ? '' : '';
    },
    currency: {
        symbol: '₽'
    }
});
numeral.locale('ru');


export class DataIndexer {
    constructor(configService: ConfigService,
                @InjectDataSource('default')
                private datasource: DataSource) {
        this.searchClient = new MeiliSearch({
            host: configService.get<string>('MAILISEARCH_HOST'),
            apiKey: configService.get<string>('MAILISEARCH_MASTER_KEY')
        })
        this.internalAdapter = new InternalAdapter(this.datasource, this.searchClient);
        this.internalDbAdapter = new InternalDbAdapter(this.datasource, this.searchClient);
    }

    private readonly logger = new Logger(DataIndexer.name);
    private readonly searchClient:MeiliSearch = null
    private timezone = 'Europe/Moscow'
    private readonly internalAdapter: InternalAdapter
    private readonly internalDbAdapter: InternalDbAdapter
    public setTimezone(val) {
        this.timezone = val
        dayjs.tz.setDefault(this.timezone)
    }

    public getIndexUid = (alias, context) => `${context.accountId}_${alias}`

    private getAdapter(type: DataSourceType) {
        switch (type) {
            case DataSourceType.internal: return this.internalAdapter;
            case DataSourceType.internalDB: return this.internalDbAdapter;
            default: return null
        }
    }

    public async getDataMany(params: GetDataManyRequestDto, dataSourceConfig: DataSourceV2Dto , context: Context) : Promise<GetDataManyDto> {
        //console.log("getDataMany from", dataSourceConfig.alias, params)
        let index:Index
        try {
            index = await this.searchClient.getIndex(this.getIndexUid(dataSourceConfig.alias, context))
        } catch (e) {
            throw e
        }

        let dsFields = dataSourceConfig.fields
        const allFields = new Map(dsFields.map(i => [i.alias, i]))

        let filterBy = params.filterBy

        if (!filterBy && params.filter) {
            filterBy = this.convertFilterToSearch(params.filter, allFields)
        }

        if (dataSourceConfig.isTree && params.parentId !== undefined) {

            if (params.parentId) {
                if (filterBy) {
                    filterBy = `(${filterBy}) AND parent_id = ${params.parentId}`
                } else {
                    filterBy = `parent_id = ${params.parentId}`
                }
            } else {
                if (filterBy) {
                    filterBy = `(${filterBy}) AND parent_id IS NULL`
                } else {
                    filterBy = `parent_id IS NULL`
                }
            }
        }

        await this.validateFieldIsSortable(index, params.sort, params.searchBy)

        let searchParams:SearchParams = {
            sort: params.sort,
            attributesToSearchOn: params.searchBy,
            filter: filterBy,
            limit: params.limit,
            offset: params.offset,
            attributesToRetrieve: params.fields
        }
        let res = await index.search(params.query, searchParams)

        return {
            items: res.hits.map(i=> this.prepareItemForUser(i, allFields, params.fields, this.timezone, params.formatValues)),
            totalCount: res.estimatedTotalHits,
            count: res.hits.length,
            processingTimeMs: res.processingTimeMs,
            isTree: dataSourceConfig.isTree ? dataSourceConfig.isTree : undefined
        }
    }

    async getDataManyAndGroup(params: GetDataManyRequestDto, dataSourceConfig: DataSourceV2Dto , context: Context) {
        if (!params.groupBy || !params.groupBy.length)
            return null


        let index:Index
        try {
            index = await this.searchClient.getIndex(this.getIndexUid(dataSourceConfig.alias, context))
        } catch (e) {
            throw e
        }

        let filterBy = params.filterBy
        const allFields = new Map(dataSourceConfig.fields.map(i => [i.alias, i]))

        if (!filterBy && params.filter) {
            filterBy = this.convertFilterToSearch(params.filter, allFields)
        }

        let fields = params.agg.map(f => f.field)
        fields.push(...params.fields)

        let groupBy: string[] = []
        for(let i in params.groupBy) {
            const gr = params.groupBy[i]
            let field = dataSourceConfig.fields.find(f => f.alias === gr)
            if (field) {
                groupBy.push(field.type === 'link' ? field.alias + '.id' : field.alias )
            }
        }

        fields.push(...groupBy)

        let searchParams:SearchParams = {
            attributesToSearchOn: params.searchBy,
            filter: filterBy,
            limit: 100000,
            attributesToRetrieve: fields
        }

        let res = (await index.search(params.query, searchParams)).hits

        let itemsByGroup = new Map<string, any>()
        let totals = {}

        for(let i in res) {
            let item = res[i]
            let key = getKey(item)

            if (itemsByGroup.has(key)) {
                let agg = itemsByGroup.get(key)
                agg.__count += 1
                params.agg.forEach(ag => {
                    switch (ag.func) {
                        case "sum":
                            _.set(agg, ag.field, _.get(agg, ag.field, 0) + _.get(item, ag.field, 0) )
                            break
                        case "min":
                            _.set(agg, ag.field, _.min([_.get(agg, ag.field), _.get(item, ag.field, 0)]))
                            break
                        case "max":
                            _.set(agg, ag.field, _.max([_.get(agg, ag.field), _.get(item, ag.field, 0)]))
                            break
                        case "avg":
                            _.set(agg, `__sum_${ag.field}`, _.get(agg, `__sum_${ag.field}`) + _.get(item, ag.field) )
                            _.set(agg, ag.field, _.get(agg, `__sum_${ag.field}`) / agg.__count )
                    }
                })


                itemsByGroup.set(key, agg)
            } else {
                let agg = {
                    __count: 1
                }
                params.groupBy.forEach(i => {
                    _.set(agg, i, _.get(item, i))
                })

                params.agg.forEach(ag => {
                    _.set(agg, ag.field, _.get(item, ag.field))
                    if (ag.func === 'avg') {
                        _.set(agg, `__sum_${ag.field}`, _.get(item, ag.field))
                    }
                })
                itemsByGroup.set(key, agg)
            }
        }

        function getKey(item) {
            const o = groupBy.map(i => _.get(item, i))
            return o.join('-')
        }

        let r = Array.from(itemsByGroup.values())

        if(params.sort?.length) {
            let s1 = []
            let s2 = []
            params.sort.forEach(f=> {
                let split = f.split(':')
                s1.push(split[0])
                s2.push(split[1])
            })
            r = _.orderBy(r, s1, s2)
        }

        for(let i in params.agg) {
            let a = params.agg[i]
            switch (a.func) {
                case "sum": totals[a.field] = _.sumBy(res, s => _.get(s, a.field)); break;
                case "avg": totals[a.field] = _.meanBy(res, s => _.get(s, a.field)); break;
                case "min": let min = _.minBy(res, s => _.get(s, a.field));
                    totals[a.field] = min ? _.get(min, a.field) : null
                    break;
                case "max":
                    let max = _.maxBy(res, s => _.get(s, a.field));
                    totals[a.field] = max ? _.get(max, a.field) : null
                    break;
                default:
                    totals[a.field] = 0
            }
        }

        return {
            items: r.map(i=> this.prepareItemForUser(i, allFields, params.fields, this.timezone, params.formatValues)),
            totalCount: r.length,
            totals
        }
    }

    async getTotals(params: GetTotalDataManyRequestDto, dataSourceConfig: DataSourceV2Dto , context: Context): Promise<GetTotalsResponseDto> {
        if (!params.agg || !params.agg.length) {
            return undefined
        }
        let index:Index
        try {
            index = await this.searchClient.getIndex(this.getIndexUid(dataSourceConfig.alias, context))
        } catch (e) {
            throw e
        }

        let vals = {}

        let filterBy = params.filterBy
        const allFields = new Map(dataSourceConfig.fields.map(i => [i.alias, i]))

        if (!filterBy && params.filter) {
            filterBy = this.convertFilterToSearch(params.filter, allFields)
        }

        let searchParams:SearchParams = {
            attributesToSearchOn: params.searchBy,
            filter: filterBy,
            limit: 10000,
            attributesToRetrieve: params.agg.map(f => f.field)
        }



        let res = (await index.search(params.query, searchParams)).hits

        for(let i in params.agg) {
            let a = params.agg[i]
            switch (a.func) {
                case "sum": vals[a.field] = _.sumBy(res, s => _.get(s, a.field)); break;
                case "avg": vals[a.field] = _.meanBy(res, s => _.get(s, a.field)); break;
                case "min": let min = _.minBy(res, s => _.get(s, a.field));
                    vals[a.field] = min ? _.get(min, a.field) : null
                    break;
                case "max":
                    let max = _.maxBy(res, s => _.get(s, a.field));
                    vals[a.field] = max ? _.get(max, a.field) : null
                    break;
                default:
                    vals[a.field] = 0
            }
        }
        return {
            totals: vals
        }
    }

    public async exportData(params: ExportDataRequestDto, dataSourceConfig: DataSourceV2Dto , context: Context) {
        let data = await this.getDataMany({
            ...params,
            limit: 10000,
            offset: 0,
            formatValues: true
        }, dataSourceConfig, context)


        return {
            file: this.arrayToCsv(data.items, params.fields)
        }
    }

    private arrayToCsv(data, fields) {
        let d = ''
        fields.forEach(field => {
            d += `${field};`
        })
        d += '\n'

        data.forEach((row) => {
            let strRow = ''
            fields.forEach(field => {
                let val = _.get(row, field)

                strRow += `${val ? val.toString() : ''};`
            })
            strRow += '\n'
            d += strRow
        })
        return Buffer.from(d).toString('base64')
    }

    public async dataReindex(params: DataReindexDto, context: Context) : Promise<number> {
        let adapter: IndexerDataAdapter = this.getAdapter(params.dataSourceConfig.type)

        if (!adapter)
            throw `DataSource has no ability to index`



        const indexUid = this.getIndexUid(params.dataSourceConfig.alias, context)
        this.logger.log(`Indexing data for datasource ${params.dataSourceConfig.alias} to index ${indexUid}, ids: ${params.ids?.join(',')}`, )
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
        let docs = await adapter.getData(params.dataSourceConfig, context, params.ids)
        docs = await this.replaceEnumDataToItems(params.dataSourceConfig, docs)
        docs = await this.replaceLinkedDataToItems(params.dataSourceConfig, docs, context)

        let taskUid = (await index.addDocuments(docs)).taskUid
        let task = await this.searchClient.waitForTask(taskUid, {timeOutMs: 60 * 1000})
        if (task.status !== 'succeeded')
            throw task.error

        if (newIndexUid !== "") {
            await this.searchClient.swapIndexes([{indexes: [indexUid, newIndexUid]}])
        }


        if (params.ids && params.ids.length > 0) {
            await this.updateLinkedData(docs, params.dataSourceConfig, context)
        }

        return docs.length
    }

    private async replaceEnumDataToItems(ds: DataSourceV2Dto, items: any[]) {
        let enums = ds.fields.filter(f => f.type === 'enum')
        if (!enums.length)
            return items

        for(let i in enums) {
            let field = enums[i]
            for(let j in items) {
                let item = items[j]

                if (item[field.alias] === null || item[field.alias] === undefined)
                    continue

                if (field.isMultiple) {
                    let arr = []
                    item[field.alias].forEach(d => {
                        let val = field.enumValues.find(f => f.key === d)

                        arr.push({ id: val ? val.key : d, title: val ? val.title : d })

                    })

                    item[field.alias] = arr
                } else {
                    let val = field.enumValues.find(f => f.key === item[field.alias])
                    item[field.alias] = val ? { id: val.key, title: val.title } : null
                }
            }
        }

        return items
    }

    private async replaceLinkedDataToItems(ds: DataSourceV2Dto, items: any[], context: Context) {
        let linksField = ds.fields.filter(f => f.type === 'link')
        if (!linksField.length)
            return items

        for(const i in linksField) {
            const field = linksField[i]
            if (field.isSystem)
                continue

            const indexUid = this.getIndexUid(field.datasourceReference, context)
            const fields = await this.getFieldForLinkIndex(field.datasourceReference)
            const index = await this.getIndex(indexUid)
            if (!index) {
                this.logger.warn(`Index ${indexUid} for add linked data into item`)
                continue
            }

            //TODO This is not support multiple field type
            for(let j in items) {
                items[j][field.alias] = await this.replaceLinkedDataToItem(items[j][field.alias], index, fields)
            }

        }

        return items
    }

    private async replaceLinkedDataToItem(id: string, index: Index, fields: string[]) {
        if (typeof id === 'string') {
            let doc
            try {
                doc = await index.getDocument(id, {
                    fields: fields
                })
                return doc
            } catch (e) {
                //this.logger.warn(`Document with id ${id} not found in index ${index.uid}`)
                return {
                    id: id
                }
            }


        } else {
            //this.logger.warn(`Item id must be a type of string, current type is ${typeof id}, may by field is multiple?`)
            return {
                id: id
            }
        }
    }

    public async updateLinkedData(items: any[], ds: DataSourceV2Dto, context: Context) {
        let adapter: IndexerDataAdapter = this.getAdapter(ds.type)
        if (!adapter)
            throw `DataSource is not an internal or internal-db source`

        this.logger.log(`Indexing linked docs to ${ds.alias}`)


        let rep = this.datasource.getRepository(DatasourceField)
        let links = await rep
            .createQueryBuilder()
            .select('datasource_alias, alias as field_alias')
            .where(
                `datasource_ref = :ref`,
                { ref: ds.alias }
            )
            .getRawMany()

        for(let i in links) {
            await this.updateLinkItem(items, links[i], context)
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


    private prepareItemForUser(item: any, fields: Map<string, DatasourceField>, fieldsToSelect: string[], timezone = this.timezone, formatValues = false):DataItem {
        if (!fieldsToSelect || !fieldsToSelect.length)
            return item

        let o = item
        fieldsToSelect.forEach(f => {
            if (fields.has(f)) {
                let field = fields.get(f)
                if (field.type === 'datetime') {

                    _.set(item, f, _.has(item, f) && _.get(item, f) !== null
                        ? dayjs(Number(_.get(item, f))).tz(timezone).format(formatValues ? 'DD.MM.YYYY hh:mm:ss' : '')
                        : null )

                } else if (field.type === 'date') {
                    _.set(item, f, _.has(item, f) && _.get(item, f) !== null
                        ? dayjs(String(_.get(item, f)), 'YYYYMMDD').format(formatValues ? 'DD.MM.YYYY' : 'YYYY-MM-DD')
                        : null )
                } else if (field.type === 'time') {
                    _.set(item, f, _.has(item, f) && _.get(item, f) !== null
                        ? numeral(Number(_.get(item, f))).format('00:00:00')
                        : null )

                } else if (formatValues && field.type === 'number' && !field.isMultiple) {

                    _.set(item, f, _.has(item, f) && _.get(item, f) !== null
                        ? numeral(_.get(item, f)).format(`0.[${field.precision ? '0'.repeat(field.precision) : '00'}]`)
                        : null )

                }
            }



        })
        return o
    }

    private convertFilterToSearch(filter: FilterItemInterface[], fields: Map<string, DatasourceField>) {
        let query:string = ""
        const andWhere = (where) => {
            if (where) query += query.length > 0 ? ` AND ${where}` : where
        }
        const convertValue = (val, field: DatasourceField) => {
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

    async updateIndexSettings(index: Index, fields: DatasourceField[]) {
        let filter = fields.filter(f=> f.type !== 'table' && f.type !== 'link').map(f=>f.alias)

        //Need add filterable link field id to index linked data after update linked item
        fields.filter(f => f.type === 'link' || f.type === 'enum').forEach(i => {
            filter.push(`${i.alias}.id`)
        })

        let taskUid = (await index.updateSettings({
            sortableAttributes: ['*'],
            displayedAttributes: ['*'],
            filterableAttributes: filter,
            searchableAttributes: ['*'],
            pagination: {
                maxTotalHits: 100000
            }
        })).taskUid

        let task = await this.searchClient.waitForTask(taskUid)
        if (task.status !== 'succeeded')
            throw task.error
    }

    async validateFieldIsSortable(index: Index, sort: string[], searchBy: string[]) : Promise<boolean> {
        let settings = await index.getSettings()
        let sortable = settings.sortableAttributes

        let needUpdate = false
        for(const i in sort) {
            const s = sort[i]

            let field = s.split(':')[0]
            if (!sortable.includes(field)) {
                needUpdate = true
                sortable.push(field)
            }
        }

        if (searchBy) {

        }

        if (needUpdate) {
            let taskUid = (await index.updateSortableAttributes(sortable)).taskUid
            let task = await this.searchClient.waitForTask(taskUid)
            if (task.status !== 'succeeded') {
                this.logger.error(`Got error while indexing`)
                this.logger.error(task.error)
                throw "Field is not sortable"
            }
        }

        return true
    }

    async getFieldForLinkIndex(alias): Promise<string[]> {
        let rep = this.datasource.getRepository(DatasourceField)
        let fields = await rep.createQueryBuilder()
            .select('alias')
            .where(`datasource_alias = :alias AND deleted_at IS NULL and type <> 'table'`,
                { alias: alias})
            .getRawMany()

        let f = fields.map(f=> f.alias)
        f.push('id')
        return f

    }

    async deleteDocsById(config, ids, context) {
        let index:Index
        try {
            index = await this.searchClient.getIndex(this.getIndexUid(config.alias, context))
        } catch (e) {
            throw e
        }

        await index.deleteDocuments({
            filter: `id IN [${ids.join(',')}]`
        })
    }
}