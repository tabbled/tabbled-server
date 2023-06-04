import { Context } from "../../entities/context";
import { GetDataManyOptionsDto, GetManyResponse, ImportDataOptionsDto } from "../dto/datasource.dto";
import { DataSource, QueryRunner, Brackets, SelectQueryBuilder } from "typeorm";
import { DataItem, Revision } from "./dataitem.entity";
import { FlakeId } from '../../flake-id'
import { FieldConfigInterface } from "../../entities/field";
import { FunctionsService } from "../../functions/functions.service";
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
    field = 'field'
}

export type HandlerType = 'script' | 'function'
export type DataSourceEvent = 'onAdd' | 'onUpdate' | 'onRemove'

export interface EventHandlerInterface {
    event: DataSourceEvent,
    handler: HandlerInterface
}
export interface HandlerInterface {
    type: HandlerType,
    script?: string,
    functionId?: string | null
}

export interface DataSourceConfigInterface {
    fields: FieldConfigInterface[],
    type: DataSourceType,
    title?: string,
    alias: string,
    readonly?: boolean,
    keyField?: string,
    isTree?: boolean,
    source?: DataSourceSource,
    script?: string,
    eventHandlers: EventHandlerInterface[]
}

export class InternalDataSource {
    constructor(config: DataSourceConfigInterface, dataSource: DataSource, functionsService: FunctionsService, context: Context) {
        this.config = config
        this.dataSource = dataSource
        this.context = context
        this.functionsService = functionsService

        for(const i in config.fields) {
            let field = config.fields[i]
            this.fieldByAlias.set(field.alias, field)
        }
    }
    readonly config: DataSourceConfigInterface
    readonly dataSource: DataSource
    readonly context: Context
    readonly functionsService: FunctionsService

    private fieldByAlias: Map<string,FieldConfigInterface> = new Map()

    /**
     * @deprecated
     * Get all data store from the data source
     */
    async getAll(): Promise<GetManyResponse> {
        console.log('DataSource.getAll', this.context)
        return await this.getMany()
    }

    async getMany(options: GetDataManyOptionsDto = {}): Promise<GetManyResponse> {
        console.log("DataSource.getMany", JSON.stringify(options))

        const sal = 'ds'
        let query = this.getManyQueryBuilder(options, sal)

        let select = [`${sal}."id"`, `${sal}."parent_id" as "parentId"`]
        let fields = options.fields && options.fields.length ? options.fields : [...this.fieldByAlias.keys()]

        for(let i in fields) {
            let f = this.fieldByAlias.get(fields[i])
            if (!f) continue

            select.push(`(${sal}.data ->> '${f.alias}')${this.castTypeToSql(f.alias)} as ${f.alias}`)
        }
        query.select(select)

        console.log('getMany.query', query.getQuery())

        let data = await query.getRawMany()

        if (this.config.isTree) {
            return {
                items: await this.getNested(data),
                count: data.length
            }
        }
        //let self = this

        // //Inject link field titles
        // for (const i in this.config.fields) {
        //     let field = this.config.fields[i]
        //     if (field.type === 'link') {
        //         await injectTitle(field.alias)
        //     }
        // }

        return {
            items: data,
            count: await query.getCount()
        }

        // async function injectTitle(alias:string) {
        //     for(let i in data) {
        //         let item = data[i]
        //         let title = ""
        //         if (item[alias] && BigInt(item[alias])) {
        //             const rep = self.dataSource.getRepository(DataItem);
        //             let linkItem = await rep.createQueryBuilder()
        //                 .select()
        //                 .where(`id = '${BigInt(item[alias])}'`)
        //                 .getOne()
        //
        //             if (linkItem)
        //                 title = linkItem.data['name'].toString()
        //
        //         }
        //
        //         item[`_${alias}_title`] = title
        //     }
        // }
    }

    async getManyRaw(options: GetDataManyOptionsDto = {}): Promise<GetManyResponse> {

        let query = this.getManyQueryBuilder(options)
            .select()

        console.log('getMany.query', query.getQuery())

        return {
            items: await query.getMany(),
            count: await query.getCount()
        }
    }

    getManyQueryBuilder(options: GetDataManyOptionsDto = {}, alias = 'ds'):SelectQueryBuilder<DataItem> {
        const rep = this.dataSource.getRepository(DataItem);
        let query = rep.createQueryBuilder(alias)
            .where(`${alias}.alias = '${this.config.alias}' AND ${alias}.deleted_at IS NULL`)

        if (this.context.accountId) {
            query.andWhere(`${alias}.account_id = ${this.context.accountId}`)
        }

        if (options.take) query.take(options.take)
        if (options.skip) query.skip(options.skip)
        if (options.sort) query.addOrderBy(`(${alias}.data ->> '${options.sort.field}')${this.castTypeToSql(options.sort.field)}`, options.sort.ask ? "ASC" : "DESC")



        for(let i in options.filter) {
            let f = options.filter[i]
            switch (f.op) {
                case "==": query.andWhere(`(${alias}.data ->> '${f.key}')${this.castTypeToSql(f.key)} = '${f.compare}'`); break;
                case "!=": query.andWhere(`(${alias}.data ->> '${f.key}')${this.castTypeToSql(f.key)} <> '${f.compare}'`); break;
                case "like": query.andWhere(`(${alias}.data ->> '${f.key}')${this.castTypeToSql(f.key)} ILIKE '${f.compare}'`); break;
                case "!like": query.andWhere(`(${alias}.data ->> '${f.key}')${this.castTypeToSql(f.key)} NOT ILIKE '${f.compare}'`); break;
                case "<":
                case "<=":
                case ">":
                case ">=": query.andWhere(`(${alias}.data ->> '${f.key}')${this.castTypeToSql(f.key)} ${f.op} '${f.compare}'`); break;
                case "in": query.andWhere(`(${alias}.data ->> '${f.key}')${this.castTypeToSql(f.key)} IN (${arrayToSqlString(f.compare)})`); break;
                case "!in": query.andWhere(`(${alias}.data ->> '${f.key}')${this.castTypeToSql(f.key)} NOT IN ('${arrayToSqlString(f.compare)}')`); break;
            }
        }

        if(options.search) {
            console.log('search - ', options.search)

            let searchFields:Array<FieldConfigInterface> = []
            this.config.fields.forEach(field => {
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
                query.andWhere(new Brackets(qb => {
                    searchFields.forEach(f => {
                        if (f.type === 'string' || f.type === 'text') {
                            qb.orWhere(`(${alias}.data ->> '${f.alias}')::varchar ILIKE '%${options.search}%'`)
                        } else if (f.type === 'number') {
                            qb.orWhere(`(${alias}.data ->> '${f.alias}')::varchar = '${options.search}'`)
                        } else if (f.type === 'link') {
                            query.leftJoin('data_items', `${f.alias}_link`, `(${alias}.data ->> '${f.alias}')::numeric = ${f.alias}_link.id`)
                            qb.orWhere(`(${f.alias}_link.data ->> 'name')::varchar ILIKE '%${options.search}%'`)
                        }
                    })
                }))
            }
        }

        return query

        function arrayToSqlString(arr) {
            let str = ''
            arr.forEach(item => {
                if (str)
                    str+=','
                str += `'${item}'`
            })
            return str
        }

    }

    castTypeToSql(alias) {
        let field = this.fieldByAlias.get(alias)
        if (!field)
            return ""

        let cast
        switch (field.type) {
            case "datetime": cast = '::timestamp'; break;
            case "date": cast = '::timestamp::date'; break;
            case "time": cast = '::timestamp::time'; break;
            case "text":
            case "string": cast = field.isMultiple ? '::jsonb' : '::varchar'; break;
            case "number": cast = '::numeric'; break;
            default: cast = ""
        }

        return cast
    }

    async getByIdRaw(id: string) : Promise<DataItem | undefined> {
        const rep = this.dataSource.getRepository(DataItem);
        let query = rep.createQueryBuilder()
            .select()
            .where(` id = ${id} AND alias = '${this.config.alias}'`)

        if (this.context.accountId) {
            query.andWhere(`account_id = ${this.context.accountId}`)
        }

        return await query.getOne()
    }

    async getById(id: string) : Promise<any | undefined> {
        let item = await this.getByIdRaw(id)

        if (!item)
            return undefined

        let data:any = item.data

        if (this.config.isTree) {
            data.children = (await this.getChildren(id)).map(d => d.data)
        }

        return data
    }

    async insert(value: any,  id?: string, parentId?: string, invokeEvents = true): Promise<DataItem> {
        let queryRunner = this.dataSource.createQueryRunner()
        await queryRunner.startTransaction()

        let item = null

        try {
            item = await this.insertData(value, queryRunner, id, parentId)
            await queryRunner.commitTransaction();
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e
        } finally {
            await queryRunner.release();
        }


        if (invokeEvents) {
            await this.invokeEvents('onAdd', {
                old: null,
                new: item
            });
        }

        return item
    }

    async updateById(id: string, value: object, invokeEvents = true): Promise<DataItem> {
        console.log(`DataSource "${this.config.alias}" updateById`, id, 'invokeEvents: ', invokeEvents)
        let item = await this.getByIdRaw(id);
        let origin = Object.assign({}, item)
        if (!item) {
            throw new Error(`Item by id "${id}" not found`)
        }

        let queryRunner = this.dataSource.createQueryRunner()
        await queryRunner.startTransaction()

        item.data = value
        try {
            await this.updateData(id, item, queryRunner)
            await queryRunner.commitTransaction();
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e
        } finally {
            await queryRunner.release();
        }

        if (invokeEvents) {
            await this.invokeEvents('onUpdate', {
                old: origin,
                new: item
            });
        }
        return item
    }

    async setDefaultValues(data: any):Promise<any> {
        let item = {
            id: data.id || flakeId.generateId().toString()
        }
        for (let i in this.config.fields) {
            const f = this.config.fields[i]

            if (!(f.alias in data)) {
                switch (f.type) {
                    case "bool": item[f.alias] = f.default ? f.default : false; break;
                    case "string":
                    case "enum":
                    case "text": item[f.alias] = f.default ? f.default : ""; break;
                    case "list":
                    case "table": item[f.alias] = []; break;
                    default: item[f.alias] = null;
                }
            } else {
                item[f.alias] = data[f.alias]
            }

            if (f.type === 'number' && f.autoincrement && !data[f.alias]) {
                const rep = this.dataSource.getRepository(DataItem);
                let query = rep.createQueryBuilder()
                    .select(`MAX((data ->> '${f.alias}')::numeric)`)
                    .where(`alias = '${this.config.alias}'`)


                let d = await  query.getRawOne()

                item[f.alias] = Number(d.max) + 1
            }
        }
        return item;
    }

    async insertData(data: any, queryRunner: QueryRunner, id?: string, parentId?: string): Promise<DataItem> {

        let mData = await this.setDefaultValues(data)

        let item = {
            id: id || String(flakeId.generateId()),
            rev: "",
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
            deletedAt: null
        }
        item.rev = await this.createRevision(queryRunner, item)

        await queryRunner.manager.createQueryBuilder()
            .insert()
            .into(DataItem)
            .values(item)
            .execute()

        return item
    }

    async updateData(id: string, item: DataItem, queryRunner: QueryRunner): Promise<void> {
        item.rev = await this.createRevision(queryRunner, item)
        item.updatedAt = new Date()
        item.updatedBy = this.context.userId

        await queryRunner.manager.createQueryBuilder()
            .update(DataItem)
            .set(item)
            .andWhere({
                id: item.id
            })
            .execute()
    }

    async removeById(id: string, invokeEvents = true, soft = true): Promise<DataItem> {
        console.log("Remove by id", id, "soft", soft)
        let item = await this.getByIdRaw(id);
        if (!item) {
            throw new Error(`Item by id "${id}" not found`)
        }

        let queryRunner = this.dataSource.createQueryRunner()
        await queryRunner.startTransaction()

        item.deletedAt = new Date()
        item.deletedBy = this.context.userId
        item.rev = await this.createRevision(queryRunner, item)

        try {
            await queryRunner.manager.createQueryBuilder()
                .insert()
                .update(DataItem)
                .set(item)
                .andWhere({
                    id: item.id
                })
                .execute()
            await queryRunner.commitTransaction();
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e
        } finally {
            await queryRunner.release();
        }


        if (invokeEvents) {
            await this.invokeEvents('onRemove', {
                old: item,
                new: null
            });
        }

        return item
    }

    async setValue(id: string, field: string, value: any, invokeEvents = true): Promise<DataItem> {
        let item = await this.getByIdRaw(id);
        if (!item) {
            throw new Error(`Item by id "${id}" not found`)
        }
        item.data[field] = value

        return await this.updateById(id, item.data, invokeEvents)
    }

    async getNested(data: DataItem[]) {

        return getChildren(null)

        function getChildren(parentId) {
            let f = data.filter((value => parentId ? value.parentId === parentId : !value.parentId ))

            let nested = []

            for(let i in f) {
                const item = f[i]
                let nestedItem:any = Object.assign({}, item)

                nestedItem.children = getChildren(item.id)
                nested.push(nestedItem)
            }

            return nested
        }
    }

    async getChildren(parentId: string) {
        const rep = this.dataSource.getRepository(DataItem);
        let query = rep.createQueryBuilder()
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

    async import(data: any[], options: ImportDataOptionsDto) {
        console.log('import' ,data.length, options)
        let queryRunner = this.dataSource.createQueryRunner()
        await queryRunner.startTransaction()

        let total = {
            inserted: 0,
            updated: 0
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
                        console.log('update existing item ',newItem.id)
                        existingItem.data = newItem
                        await this.updateData(existingItem.id, existingItem, queryRunner)
                        total.updated++
                    }
                } else {
                    console.log('insert new item ',newItem.id)
                    await this.insertData(newItem, queryRunner, newItem.id, newItem.parentId)
                    total.inserted++
                }
            }
            await queryRunner.commitTransaction();
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e
        } finally {
            await queryRunner.release();
        }
        return total
    }

    private async createRevision(queryRunner: QueryRunner, item: DataItem) {
        try {
            let revRes = await queryRunner.manager.insert(Revision, {
                alias: item.alias,
                version: item.version,
                accountId: this.context.accountId,
                itemParentId: item.parentId,
                itemId: item.id,
                data: item.data,
                createdBy: this.context.userId
            })
            return revRes.identifiers[0].id;
        } catch (e) {
            throw e;
        }
    }

    invokeEvents(event: DataSourceEvent, context: any) {
        if (!this.config)
            return

        for(const i in this.config.eventHandlers) {
            let event_handler = this.config.eventHandlers[i]


            if (event_handler.event === event && event_handler.handler.type === 'function') {


                try {
                    this.functionsService.callById(
                        event_handler.handler.functionId,
                        Object.assign(this.context, context))
                    console.log(`Event handler found "${event}" for dataSource "${this.config.alias}". Task to call func ${event_handler.handler.functionId} added`)
                } catch (e) {
                    console.error(e)
                    throw e
                }

            }
        }
    }
}