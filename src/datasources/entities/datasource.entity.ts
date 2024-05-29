import { Context } from '../../entities/context'
import {
    GetDataManyOptionsDto,
    GetManyResponse,
    ImportDataOptionsDto,
} from '../dto/datasource.dto'
import { DataSource, QueryRunner, Brackets, SelectQueryBuilder } from 'typeorm'
import { DataItem, Revision } from './dataitem.entity'
import { FlakeId } from '../../flake-id'
import { FieldConfigInterface } from '../../entities/field'
import { FunctionsService } from '../../functions/functions.service'
import { RoomsService } from '../../rooms/rooms.service'
import { DataSourcesService } from "../datasources.service";
let flakeId = new FlakeId()

export enum DataSourceType {
    config = 'config',
    data = 'data',
}

export enum DataSourceSource {
    internal = 'internal',
    custom = 'custom',
    restapi = 'restapi',
    sql = 'sql',
    field = 'field',
}

export type HandlerType = 'script' | 'function'
export type DataSourceEvent = 'onAdd' | 'onUpdate' | 'onRemove'

export interface EventHandlerInterface {
    event: DataSourceEvent
    handler: HandlerInterface
}
export interface HandlerInterface {
    type: HandlerType
    script?: string
    functionId?: string | null
}

export interface DataSourceConfigInterface {
    fields: FieldConfigInterface[]
    type: DataSourceType
    title?: string
    alias: string
    readonly?: boolean
    keyField?: string
    isTree?: boolean
    source?: DataSourceSource
    script?: string
    eventHandlers: EventHandlerInterface[]
    keyFields: string[] // for aggregation datasource
    aggFields: string[] // for aggregation datasource
    isAggregator: boolean
}

export class InternalDataSource {
    constructor(
        config: DataSourceConfigInterface,
        dataSource: DataSource,
        functionsService: FunctionsService,
        context: Context,
        rooms: RoomsService,
        service: DataSourcesService
    ) {
        this.config = config
        this.dataSource = dataSource
        this.context = context
        this.functionsService = functionsService
        this.rooms = rooms
        this.service = service

        for (const i in config.fields) {
            let field = config.fields[i]
            this.fieldByAlias.set(field.alias, field)
        }
    }
    readonly config: DataSourceConfigInterface
    readonly dataSource: DataSource
    readonly context: Context
    readonly functionsService: FunctionsService
    readonly rooms: RoomsService
    readonly service: DataSourcesService

    private fieldByAlias: Map<string, FieldConfigInterface> = new Map()

    /**
     * @deprecated
     * Get all data store from the data source
     */
    async getAll(): Promise<GetManyResponse> {
        console.log('DataSource.getAll', this.context)
        return await this.getMany()
    }

    getFieldByAlias(alias: string) {
        return this.fieldByAlias.get(alias)
    }

    async getMany(
        options: GetDataManyOptionsDto = {}
    ): Promise<GetManyResponse> {
        console.log('DataSource.getMany', JSON.stringify(options))

        const sal = 'ds'
        let query = this.getManyQueryBuilder(options, sal)

        let joins = new Set<string>()
        let select = [`${sal}."id"`, `${sal}."parent_id" AS "parentId"`]
        let fields =
            options.fields && options.fields.length
                ? options.fields
                : [...this.fieldByAlias.keys()]

        for (let i in fields) {
            let f
            let linkFieldAlias
            let sp = fields[i].split('->')
            if (sp.length < 2) {
                f = this.fieldByAlias.get(fields[i])
            } else {
                let link = this.fieldByAlias.get(sp[0])
                if (link && link.type === 'link' && link.datasource) {
                    let linkDs = await this.service.getByAlias(link.datasource, this.context)

                    if (!['table', 'link'].includes(linkDs.getFieldByAlias(sp[1]).type)) {
                        f = link
                        linkFieldAlias = sp[1]
                    }
                }
            }

            if (!f) continue

            if (!linkFieldAlias) {
                select.push(
                    `(${sal}.data ->> '${f.alias}')${this.castTypeToSql(
                        f.alias
                    )} AS "${f.alias}"`
                )
            }


            if (f.type === 'link') {
                const displayProp = f.displayProp ? f.displayProp : 'name'
                if (!f.isMultiple) {
                    if (!joins.has(`link_${f.alias}`)) {
                        query.leftJoin(
                            `data_items`,
                            `link_${f.alias}`,
                            `(${sal}.data ->> '${f.alias}')::numeric = link_${f.alias}.id AND link_${f.alias}.alias = '${f.datasource}'`
                        )
                        joins.add(`link_${f.alias}`)
                    }

                    select.push(
                        `(link_${f.alias}.data ->> '${displayProp}') as "__${f.alias}_title"`
                    )
                    if (linkFieldAlias) {
                        select.push(
                            `(link_${f.alias}.data ->> '${linkFieldAlias}') as "${f.alias}->${linkFieldAlias}"`
                        )
                    }
                } else {
                    select.push(`(SELECT json_agg(t) from (SELECT id::text, data->>'${displayProp}' AS "${displayProp}"
                              FROM data_items  
                              WHERE alias = '${f.datasource}' 
                              AND id::text in (SELECT * FROM jsonb_array_elements_text((${sal}.data ->> '${f.alias}')::jsonb))) t
                             ) __${f.alias}_entities`)
                }
            }
        }

        if (this.config.isTree) {
            select.push(
                `CASE WHEN (SELECT count(*) FROM data_items WHERE parent_id = ${sal}."id" and alias = '${this.config.alias}' and deleted_at IS NULL LIMIT 1) > 0 THEN true ELSE false END  "hasChildren"`
            )
        }

        query.select(select)

        console.log('getMany.query', query.getQuery())

        let data = await query.getRawMany()

        // Includes additional ids to response
        if (options.include) {
            let additional = options.include.filter((el) => {
                return !data.find((val) => val.id === el)
            })

            if (additional.length) {
                query.andWhere(`${sal}.id IN (${additional.join(',')})`)
                data = data.concat(await query.getRawMany())
            }
        }

        return {
            items: data,
            count: await query.getCount(),
        }
    }

    async getManyRaw(
        options: GetDataManyOptionsDto = {}
    ): Promise<GetManyResponse> {
        let query = this.getManyQueryBuilder(options).select()

        console.log('getManyRaw.query', query.getQuery())

        return {
            items: await query.getMany(),
            count: await query.getCount(),
        }
    }

    getManyQueryBuilder(
        options: GetDataManyOptionsDto = {},
        alias = 'ds'
    ): SelectQueryBuilder<DataItem> {
        const rep = this.dataSource.getRepository(DataItem)
        let query = rep
            .createQueryBuilder(alias)
            .where(
                `${alias}.alias = '${this.config.alias}' AND ${alias}.deleted_at IS NULL`
            )

        if (this.context.accountId) {
            query.andWhere(`${alias}.account_id = ${this.context.accountId}`)
        }

        if (options.take) query.limit(options.take)
        if (options.skip) query.offset(options.skip)
        if (options.sort)
            query.addOrderBy(
                `(${alias}.data ->> '${
                    options.sort.field
                }')${this.castTypeToSql(options.sort.field)}`,
                options.sort.ask ? 'ASC' : 'DESC'
            )

        for (let i in options.filter) {
            let f = options.filter[i]
            switch (f.op) {
                case '==':
                    query.andWhere(
                        `(${alias}.data ->> '${f.key}')${this.castTypeToSql(
                            f.key
                        )} = '${f.compare}'`
                    )
                    break
                case '!=':
                    query.andWhere(
                        `(${alias}.data ->> '${f.key}')${this.castTypeToSql(
                            f.key
                        )} <> '${f.compare}'`
                    )
                    break
                case 'like':
                    query.andWhere(
                        `(${alias}.data ->> '${f.key}')${this.castTypeToSql(
                            f.key
                        )} ILIKE '${f.compare}'`
                    )
                    break
                case '!like':
                    query.andWhere(
                        `(${alias}.data ->> '${f.key}')${this.castTypeToSql(
                            f.key
                        )} NOT ILIKE '${f.compare}'`
                    )
                    break
                case '<':
                case '<=':
                case '>':
                case '>=':
                    query.andWhere(
                        `(${alias}.data ->> '${f.key}')${this.castTypeToSql(
                            f.key
                        )} ${f.op} '${f.compare}'`
                    )
                    break
                case 'in':
                    query.andWhere(
                        `(${alias}.data ->> '${f.key}')${this.castTypeToSql(
                            f.key
                        )} IN (${arrayToSqlString(f.compare)})`
                    )
                    break
                case '!in':
                    query.andWhere(
                        `(${alias}.data ->> '${f.key}')${this.castTypeToSql(
                            f.key
                        )} NOT IN ('${arrayToSqlString(f.compare)}')`
                    )
                    break
            }
        }

        if (this.config.isTree && options.parentId !== undefined) {
            query.andWhere(
                options.parentId
                    ? `parent_id = ${options.parentId}`
                    : `parent_id IS NULL`
            )
        }

        if (options.id && options.id.length > 0) {
            query.andWhere(`id IN (${options.id.join(',')})`)
        }

        if (options.search) {
            console.log('search - ', options.search)

            let searchFields: Array<FieldConfigInterface> = []
            this.config.fields.forEach((field) => {
                if (field.searchable) {
                    searchFields.push(field)
                }
            })

            //for cases when no fields that chosen as searchable
            if (!searchFields.length) {
                let f = this.fieldByAlias.get('name')
                if (f) searchFields.push(f)
            }

            if (searchFields.length) {
                query.andWhere(
                    new Brackets((qb) => {
                        searchFields.forEach((f) => {
                            if (f.type === 'string' || f.type === 'text') {
                                qb.orWhere(
                                    `(${alias}.data ->> '${f.alias}')::varchar ILIKE '%${options.search}%'`
                                )
                            } else if (f.type === 'number') {
                                qb.orWhere(
                                    `(${alias}.data ->> '${f.alias}')::varchar = '${options.search}'`
                                )
                            } else if (f.type === 'link') {
                                //query.leftJoin('data_items', `${f.alias}_link`, `(${alias}.data ->> '${f.alias}')::numeric = ${f.alias}_link.id`)
                                qb.orWhere(
                                    `(${alias}.data ->> '__${f.alias}_title')::varchar ILIKE '%${options.search}%'`
                                )
                            }
                        })
                    })
                )
            }
        }

        return query

        function arrayToSqlString(arr) {
            let str = ''
            arr.forEach((item) => {
                if (str) str += ','
                str += `'${item}'`
            })
            return str
        }
    }

    castTypeToSql(alias) {
        let field = this.fieldByAlias.get(alias)
        if (!field) return ''

        let cast
        switch (field.type) {
            case 'bool':
                cast = '::bool'
                break
            case 'datetime':
                cast = '::timestamp'
                break
            case 'date':
                cast = '::timestamp::date'
                break
            case 'time':
                cast = '::timestamp::time'
                break
            case 'text':
            case 'link':
            case 'enum':
            case 'string':
                cast = ''
                break //cast = field.isMultiple ? '::jsonb' : '::varchar';
            case 'number':
                cast = '::float'
                break

            default:
                cast = ''
        }

        return cast
    }

    async getByIdRaw(id: string): Promise<DataItem | undefined> {
        const rep = this.dataSource.getRepository(DataItem)
        let query = rep
            .createQueryBuilder()
            .select()
            .where(` id = ${id} AND alias = '${this.config.alias}'`)

        if (this.context.accountId) {
            query.andWhere(`account_id = ${this.context.accountId}`)
        }

        console.log('getByIdRaw', query.getQuery())

        return await query.getOne()
    }

    async getById(id: string): Promise<any | undefined> {
        let item = await this.getByIdRaw(id)

        if (!item) return undefined

        let data: any = item.data

        if (this.config.isTree) {
            data.children = (await this.getChildren(id)).map((d) => d.data)
            data.hasChildren = !!data.children
        }

        return data
    }

    async insert(
        value: any,
        id?: string,
        parentId?: string,
        invokeEvents = true,
        route?: string[]
    ): Promise<DataItem> {
        let queryRunner = this.dataSource.createQueryRunner()
        await queryRunner.startTransaction()

        let item = null

        try {
            item = await this.insertData(value, queryRunner, id, parentId)
            await queryRunner.commitTransaction()
        } catch (e) {
            await queryRunner.rollbackTransaction()
            throw e
        } finally {
            await queryRunner.release()
        }

        if (invokeEvents) {
            await this.invokeEvents('onAdd', {
                old: null,
                new: item,
            })
        }

        if (parentId && item) {
            item.parent = await this.getById(parentId)
        }

        this.rooms.emitUpdates({
            type: 'data',
            action: 'add',
            context: this.context,
            entity: {
                alias: this.config.alias,
                id: item?.id,
                data: item?.data,
                rev: item?.rev,
            },
            parent: item?.parent,
            route: route,
        })

        return item
    }

    async updateById(
        id: string,
        value: object,
        invokeEvents = true,
        route: string[]
    ): Promise<DataItem> {
        console.log(
            `DataSource "${this.config.alias}" updateById`,
            id,
            'invokeEvents: ',
            invokeEvents
        )
        let item = await this.getByIdRaw(id)
        console.log(item)
        if (!item) {
            throw new Error(`Item by id "${id}" not found`)
        }
        let origin = Object.assign({}, item)

        let queryRunner = this.dataSource.createQueryRunner()
        await queryRunner.startTransaction()

        item.data = await this.addLinkTitle(value)

        try {
            await this.updateData(id, item, queryRunner)
            await queryRunner.commitTransaction()
        } catch (e) {
            await queryRunner.rollbackTransaction()
            throw e
        } finally {
            await queryRunner.release()
        }

        console.log(item)

        if (this.config.isTree) {
            item.data.hasChildren = !!(await this.getChildren(item.id))
        }

        if (invokeEvents) {
            await this.invokeEvents('onUpdate', {
                old: origin,
                new: item,
            })
        }

        this.rooms.emitUpdates({
            type: 'data',
            context: this.context,
            entity: {
                alias: this.config.alias,
                id: item?.id,
                data: item.data,
                rev: item?.rev,
            },
            action: 'update',
            route: route,
        })

        return item
    }

    async setDefaultValues(data: any): Promise<any> {
        if (typeof data !== 'object') {
            data = {}
        }
        let item = {
            id: data.id || flakeId.generateId().toString(),
        }
        for (let i in this.config.fields) {
            const f = this.config.fields[i]

            if (!(f.alias in data)) {
                switch (f.type) {
                    case 'bool':
                        item[f.alias] = f.default ? f.default : false
                        break
                    case 'string':
                    case 'enum':
                    case 'text':
                        item[f.alias] = f.default ? f.default : ''
                        break
                    case 'list':
                    case 'table':
                        item[f.alias] = []
                        break
                    default:
                        item[f.alias] = null
                }
            } else {
                item[f.alias] = data[f.alias]
            }

            if (f.type === 'number' && f.autoincrement && !data[f.alias]) {
                const rep = this.dataSource.getRepository(DataItem)
                let query = rep
                    .createQueryBuilder()
                    .select(`MAX((data ->> '${f.alias}')::numeric)`)
                    .where(`alias = '${this.config.alias}'`)

                let d = await query.getRawOne()

                item[f.alias] = Number(d.max) + 1
            }
        }
        return item
    }

    async insertData(
        data: any,
        queryRunner: QueryRunner,
        id?: string,
        parentId?: string
    ): Promise<DataItem> {
        let mData = await this.setDefaultValues(data)

        let item = {
            id: id || String(flakeId.generateId()),
            rev: '',
            version: 1,
            parentId: parentId,
            alias: this.config.alias,
            accountId: this.context.accountId ? this.context.accountId : null,
            data: mData,
            createdBy: this.context.userId,
            updatedAt: new Date(),
            updatedBy: this.context.userId,
            createdAt: new Date(),
            deletedBy: null,
            deletedAt: null,
        }

        item.rev = await this.createRevision(queryRunner, item)

        await queryRunner.manager
            .createQueryBuilder()
            .insert()
            .into(DataItem)
            .values(item)
            .execute()

        return item
    }

    async updateData(
        id: string,
        item: DataItem,
        queryRunner: QueryRunner
    ): Promise<void> {
        item.rev = await this.createRevision(queryRunner, item)
        item.updatedAt = new Date()
        item.updatedBy = this.context.userId

        await queryRunner.manager
            .createQueryBuilder()
            .update(DataItem)
            .set(item)
            .andWhere({
                id: item.id,
            })
            .execute()
    }

    async removeById(
        id: string,
        invokeEvents = true,
        soft = true,
        route?: string[]
    ): Promise<DataItem> {
        console.log('Remove by id', id, 'soft', soft)
        let item = await this.getByIdRaw(id)
        if (!item) {
            throw new Error(`Item by id "${id}" not found`)
        }

        let queryRunner = this.dataSource.createQueryRunner()
        await queryRunner.startTransaction()

        item.deletedAt = new Date()
        item.deletedBy = this.context.userId
        item.rev = await this.createRevision(queryRunner, item)

        try {
            await queryRunner.manager
                .createQueryBuilder()
                .insert()
                .update(DataItem)
                .set(item)
                .andWhere({
                    id: item.id,
                })
                .execute()
            await queryRunner.commitTransaction()
        } catch (e) {
            await queryRunner.rollbackTransaction()
            throw e
        } finally {
            await queryRunner.release()
        }

        if (invokeEvents) {
            await this.invokeEvents('onRemove', {
                old: item,
                new: null,
            })
        }

        this.rooms.emitUpdates({
            type: 'data',
            context: this.context,
            entity: {
                alias: this.config.alias,
                id: item?.id,
                rev: item?.rev,
            },
            action: 'remove',
            route: route,
        })

        return item
    }

    async setValue(
        id: string,
        field: string,
        value: any,
        invokeEvents = true,
        route: string[]
    ): Promise<DataItem> {
        let item = await this.getByIdRaw(id)
        if (!item) {
            throw new Error(`Item by id "${id}" not found`)
        }
        item.data[field] = value

        return await this.updateById(id, item.data, invokeEvents, route)
    }

    async getByKeys(keys: any) {
        let rw = await this.getByKeysRaw(keys)
        return rw ? rw.data : null
    }

    async getByKeysRaw(keys: any) {
        const rep = this.dataSource.getRepository(DataItem)
        let query = rep
            .createQueryBuilder()
            .select()
            .where(`alias = '${this.config.alias}'`)

        let fields = Object.keys(keys)
        for (const i in fields) {
            if (this.config.keyFields.includes(fields[i])) {
                if (!keys[fields[i]]) {
                    query.andWhere(`(data ->> '${fields[i]}') IS NULL`)
                } else {
                    query.andWhere(
                        `(data ->> '${fields[i]}') = '${keys[fields[i]]}'`
                    )
                }
            } else {
                throw `Key ${fields[i]} is not a field of keys. Keys are ${this.config.keyFields}`
            }
        }

        if (this.context.accountId) {
            query.andWhere(`account_id = ${this.context.accountId}`)
        }

        return await query.getOne()
    }

    async getChildren(parentId: string) {
        const rep = this.dataSource.getRepository(DataItem)
        let query = rep
            .createQueryBuilder()
            .select()
            .where(`alias = '${this.config.alias}' AND deleted_at IS NULL`)

        if (this.context.accountId) {
            query.andWhere(`account_id = ${this.context.accountId}`)
        }

        if (parentId) {
            query.andWhere(`parent_id = '${parentId}'`)
        }

        return await query.getMany()
    }

    async addLinkTitle(value): Promise<any> {
        let newValue = Object.assign({}, value)
        let keys = Object.keys(value)

        for (let i in keys) {
            const key = keys[i]
            let field = this.fieldByAlias.get(key)

            if (field && field.type === 'link') {
                if (!newValue[key]) {
                    newValue[`__${key}_title`] = ''
                    continue
                }

                const displayProp = field.displayProp
                    ? field.displayProp
                    : 'name'

                const rep = this.dataSource.getRepository(DataItem)

                if (field.isMultiple) {
                } else {
                    let query = await rep
                        .createQueryBuilder()
                        .where(
                            `alias = '${field.datasource}' AND id = ${newValue[key]}`
                        )
                        .select()

                    let item = await query.getOne()
                    if (item)
                        newValue[`__${key}_title`] = item.data[displayProp]
                }
            }
        }

        return newValue
    }

    async import(data: any[], options: ImportDataOptionsDto) {
        console.log('import', data.length, options)
        let queryRunner = this.dataSource.createQueryRunner()
        await queryRunner.startTransaction()

        let total = {
            inserted: 0,
            updated: 0,
        }

        try {
            for (let i in data) {
                let newItem = data[i]

                let existingItem = null

                if (newItem.id) {
                    existingItem = await this.getByIdRaw(newItem.id)
                }

                if (existingItem) {
                    if (options.replaceExisting) {
                        console.log('update existing item ', newItem.id)
                        existingItem.data = newItem
                        await this.updateData(
                            existingItem.id,
                            existingItem,
                            queryRunner
                        )
                        total.updated++
                    }
                } else {
                    console.log('insert new item ', newItem.id)
                    await this.insertData(
                        newItem,
                        queryRunner,
                        newItem.id,
                        newItem.parentId
                    )
                    total.inserted++
                }
            }
            await queryRunner.commitTransaction()
        } catch (e) {
            await queryRunner.rollbackTransaction()
            throw e
        } finally {
            await queryRunner.release()
        }
        return total
    }

    private async createRevision(queryRunner: QueryRunner, item: DataItem) {
        //console.log('createRevision', item)
        try {
            let revRes = await queryRunner.manager.insert(Revision, {
                alias: item.alias,
                version: item.version,
                accountId: this.context.accountId,
                itemParentId: item.parentId,
                itemId: item.id,
                data: item.data,
                createdBy: this.context.userId,
            })
            return revRes.identifiers[0].id
        } catch (e) {
            throw e
        }
    }

    invokeEvents(event: DataSourceEvent, context: any) {
        if (!this.config) return

        for (const i in this.config.eventHandlers) {
            let event_handler = this.config.eventHandlers[i]

            if (
                event_handler.event === event &&
                event_handler.handler.type === 'function'
            ) {
                try {
                    this.functionsService.callById(
                        event_handler.handler.functionId,
                        Object.assign(this.context, context)
                    )
                    console.log(
                        `Event handler found "${event}" for dataSource "${this.config.alias}". Task to call func ${event_handler.handler.functionId} added`
                    )
                } catch (e) {
                    console.error(e)
                    throw e
                }
            }
        }
    }
}
