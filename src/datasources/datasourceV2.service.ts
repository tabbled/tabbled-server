import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, QueryRunner, Table, TableColumn } from "typeorm";
import { Context } from '../entities/context'
import { FunctionsService } from '../functions/functions.service'
import {
    DataReindexDto,
    DatasourceFieldDto,
    DataSourceV2Dto,
    DeleteDataSourceDataRequestDto,
    GetDataManyRequestDto,
    GetFieldsManyDto,
    GetRevisionByIdDto,
    GetRevisionsDto,
    GetRevisionsResponseDto,
    InsertDataSourceRequestDto,
    SystemFields,
    UpsertDataSourceDataRequestDto,
    FieldType, ExportDataRequestDto
} from "./dto/datasourceV2.dto";
import { DataItem, Revision } from "./entities/dataitem.entity";
import { User } from "../users/entities/user.entity";
import { ConfigItem } from "../config/entities/config.entity";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { DataIndexer } from "../data-indexer/data-indexer";
import { ConfigService } from "@nestjs/config";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { DatasourceField } from "./entities/field.entity";
import { DatasourceV2Entity } from "./entities/datasourceV2.entity";
import {flakeId} from "../flake-id"
import { InternalDBDatasource } from "./datasourceV2.internal";



@Injectable()
export class DataSourceV2Service {
    constructor(
        @Inject(forwardRef(() => FunctionsService))
        private functionsService: FunctionsService,
        @InjectDataSource('default')
        private datasource: DataSource,
        @InjectQueue('datasource-data-indexing') private dataIndexingQueue: Queue,
        private configService: ConfigService,
        private eventEmitter: EventEmitter2
    ) {
        this.indexer = new DataIndexer(configService, datasource)
        this.timezone = configService.get<string>('DEFAULT_TIMEZONE') || 'Europe/Moscow'
        this.indexer.setTimezone(this.timezone)
    }

    private readonly logger = new Logger(DataSourceV2Service.name);
    private readonly indexer : DataIndexer = null
    private readonly timezone : string

    async getRevisions(params: GetRevisionsDto, context: Context) : Promise<GetRevisionsResponseDto> {
        let rep = this.datasource.getRepository(Revision)
        const query = await rep
            .createQueryBuilder('rev')
            .select('rev.id, version, rev.created_at, created_by, user.username, user.firstname, user.lastname')
            .where(
                `alias = :alias AND account_id = :accountId AND item_id = :itemId`,
                {
                    alias: params.dataSourceAlias,
                    itemId: params.itemId,
                    accountId: context.accountId
                }
            ).leftJoin(User, 'user', 'user.id = rev.created_by')
            .orderBy('created_at', "DESC")

        let items = await query.getRawMany()

        return {
            items: items.map(i => { return {
                id: i.id,
                version: i.version,
                createdAt: i.created_at,
                createdBy: {
                    id: i.created_by,
                    username: i.created_by ? i.username : 'system',
                    title: i.created_by ? `${i.firstname} ${i.lastname}` : undefined
                }
            }}),
            count: items.length
        }
    }

    async getRevisionById(params: GetRevisionByIdDto, context: Context) : Promise<any> {
        let rep = this.datasource.getRepository(Revision)
        const query = await rep
            .createQueryBuilder('rev')
            .select('rev.id, version, rev.created_at, created_by, user.username, user.firstname, user.lastname, rev.data')
            .where(
                'alias = :alias AND account_id = :accountId AND item_id = :itemId AND rev.id = :revId',
                {
                    alias: params.dataSourceAlias,
                    itemId: params.itemId,
                    accountId: context.accountId,
                    revId: params.revisionId
                }
            ).leftJoin(User, 'user', 'user.id = rev.created_by')

        let item = await query.getRawOne()
        return {
            id: item.id,
            version: item.version,
            createdAt: item.created_at,
            createdBy: {
                id: item.created_by,
                username: item.created_by ? item.username : undefined,
                title: item.created_by ? `${item.firstname} ${item.lastname}` : undefined
            },
            data: item.data
        }
    }

    async dataReindex(params: DataReindexDto, context: Context) : Promise<{ jobId: string }> {
        if (params.dataSourceConfig.type !== 'internal' && params.dataSourceConfig.type !== 'internal-db')
            throw `DataSource is not an internal or internal-db source`

        // await this.indexer.dataReindex(params, context)
        // return {
        //     jobId: "0"
        // }

        //console.log("dataReindex!!!")

        this.dataIndexingQueue.count().then(i => {
            console.log('datasource-data-indexing, jobs count: ', i)
        })

        let job = await this.dataIndexingQueue.add("index-all-datasource",{
            datasource: params.dataSourceConfig,
            ids: params.ids,
            context
        }, {})
        return {
            jobId: job.id
        }
    }

    // For internal use without context
    // Don't use it to response to user
    async getConfigByAlias(alias: string, withNestedFields = false): Promise<DataSourceV2Dto> {
        const rep = this.datasource.getRepository(DatasourceV2Entity)
        let item = await rep
            .createQueryBuilder('ds')
            .where(
                `alias = :alias and deleted_at IS NULL`,
                { alias: alias }
            )
            .getOne()

        if (item) {
            item.fields = (await this.getFieldsMany({datasource: alias, nested: withNestedFields})).items
        }

        if (item) {
            item.fields.push(...SystemFields)
        }

        return item ? item : null
    }

    async getDataSource(alias: string, withNestedFields: boolean, context: Context) {
        let ds = await this.getConfigByAlias(alias, withNestedFields)
        if (!ds)
            throw `Datasource ${alias} not found`

        return  new InternalDBDatasource({
            config: ds,
            dataSource: this.datasource,
            context: context,
            logger: this.logger,
            indexer: this.indexer,
            timezone: this.timezone,
            eventEmitter: this.eventEmitter
        })
    }

    async getManyV1() {
        const rep = this.datasource.getRepository(ConfigItem)
        let items = await rep
            .createQueryBuilder()
            .select(`id, version, data ->> 'title' as title, data ->> 'alias' as alias, data ->> 'source' as source `)
            .where(
                `alias = 'datasource' and deleted_at IS NULL`
            )
            .orderBy("data ->> 'title'")
            .getRawMany()

        return {
            items,
            count: items.length
        }
    }

    async getManyV2(context: Context) {
        const rep = this.datasource.getRepository(DatasourceV2Entity)
        let items = await rep
            .createQueryBuilder()
            .select('id, version, title, type, alias')
            .where('account_id = :account', { account: context.accountId })
            .orderBy('title')
            .getRawMany()

        return {
            items,
            count: items.length
        }
    }

    async isExists(alias: string, context: Context) {
        const rep = this.datasource.getRepository(DatasourceV2Entity)
        return await rep.createQueryBuilder()
            .where(`alias = :alias AND account_id = :account`,
                { alias: alias,
                account: context.accountId})
            .getExists()
    }

    async getFieldsMany(params: GetFieldsManyDto) {
        const getFields = async (alias: string) => {
            const rep = this.datasource.getRepository(DatasourceField)
            return await rep
                .createQueryBuilder()
                .where(
                    `datasource_alias = :alias AND deleted_at IS NULL`,
                    { alias: alias }
                )
                .getMany() as DatasourceField[]
        }

        let items = await getFields(params.datasource)



        items.push(...SystemFields)


        // Need to collect all nested fields in linked datasource
        if (params.nested) {
            let links = items.filter(f => f.type === 'link' && f.datasourceReference && !f.isSystem)
            for(let i in links) {
                const field = links[i]
                let linked = (await getFields(field.datasourceReference))
                    .filter(f => ['number', 'string', 'bool', 'text', 'enum', 'image', 'datetime', 'date', 'time', 'link']
                        .includes(f.type))

                linked.forEach(f => {
                    f.alias = `${field.alias}.${f.alias}`
                    f.title = `${field.title} -> ${f.title}`
                    f.isLinked = true
                    items.push(f)
                })
            }
        }

        return {
            items,
            count: items.length
        }
    }

    async updateFieldsFromV1(queryRunner:QueryRunner, item: DataItem, context: Context) {
        if (!item.data?.fields) {
            return
        }

        for(const i in item.data.fields) {
            let field = item.data.fields[i]
            let d: DatasourceField = new DatasourceField()

            d.datasourceId = item.data.id
            d.datasourceAlias = item.data.alias
            d.alias = field.alias
            d.type = field.type
            d.title = field.title
            d.searchable = !!field.searchable
            d.filterable = !!field.filterable
            d.sortable = !!field.sortable
            d.isMultiple = !!field.isMultiple
            d.defaultValue = field.default ? field.default : ""
            d.datasourceReference = field.datasource
            d.autoincrement = !!field.autoincrement
            d.isNullable = !!field.required
            d.enumValues = field.values
            d.precision = field.precision ? field.precision : null
            d.format = field.format ? field.format : ""
            d.accountId = context.accountId
            d.updatedAt = new Date()
            d.createdBy = context.userId
            d.updatedBy = context.userId
            d.version = item.version
            d.deletedAt = null
            d.deletedBy = null

            await queryRunner.manager
                .createQueryBuilder()
                .insert()
                .into(DatasourceField)
                .values(d)
                .orUpdate(['type', 'title', 'searchable', 'filterable',
                    'sortable', 'is_multiple','default_value', 'datasource_ref',
                    'autoincrement', 'nullable', 'enum_values', 'precision',
                    'format', 'updated_by', 'updated_at', 'deleted_at',
                    'deleted_by', 'version'],
                    ['account_id', 'datasource_alias', 'alias'])
                .execute()
        }

        let del = {
            deletedBy: context.userId,
            deletedAt: new Date()
        }

        await queryRunner.manager
            .createQueryBuilder()
            .update(DatasourceField)
            .set(del)
            .where(`version <> ${item.version} AND account_id = '${context.accountId}' AND datasource_alias = '${item.data.alias}'`
            )
            .execute()
    }

    async updateDatasourceFromV1(queryRunner:QueryRunner, ds: any, context: Context) {
        console.log(context)
        let data: DatasourceV2Entity = {
            accountId: 1,
            alias: ds.data.alias,
            context: ds.data.context,
            createdAt: ds.createdAt,
            createdBy: ds.createdBy,
            deletedAt: ds.deletedAt,
            deletedBy: ds.deletedBy,
            isSystem: false,
            isTree: ds.data.isTree,
            permissions: ds.data.permissions,
            script: ds.data.script,
            type: ds.data.source,
            updatedAt: ds.updatedAt,
            updatedBy: ds.updatedBy,
            version: ds.version,
            id: ds.id,
            title: ds.data.title
        }

        await queryRunner.manager
            .createQueryBuilder()
            .insert()
            .into(DatasourceV2Entity)
            .values(data)
            .orUpdate(['alias', 'title', 'script', 'context', 'is_tree',
                    'permissions', 'updated_by', 'updated_at', 'deleted_at',
                    'type', 'deleted_by', 'version'],
                ['id'])
            .execute()

    }

    async insertDataSource(ds: InsertDataSourceRequestDto, context: Context) {
        if (await this.dataSourceAliasExists(ds.alias)) {
            throw `Datasource with alias '${ds.alias}' exists`
        }

        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()
        try {

            let data: DatasourceV2Entity = {
                id: flakeId().toString(),
                accountId: context.accountId,
                version: 1,
                type: ds.type,
                title: ds.title,
                isSystem: false,
                isTree: ds.isTree,
                alias: ds.alias,
                createdBy: context.userId,
                updatedBy: context.userId,
                permissions: ds.permissions,
                createdAt: new Date(),
                updatedAt: new Date()
            }
            await queryRunner.manager
                .createQueryBuilder()
                .insert()
                .into(DatasourceV2Entity)
                .values(data)
                .execute()

            await this.upsertFields(queryRunner, data, ds.fields, context)
            await this.addDataSourceSchema({
                queryRunner,
                ds: data,
                fields: ds.fields,
                context,
            })

            await queryRunner.commitTransaction()

            try {
                await this.upsertIndex(ds.alias, context)
            } catch (e) {
                this.logger.error(e)
            }

            return {
                id: data.id
            }
        } catch (e) {
            await queryRunner.rollbackTransaction()
            this.logger.error(e)
            throw e
        } finally {
            await queryRunner.release()
        }
    }

    async updateDataSource(alias: string, ds: InsertDataSourceRequestDto, context: Context) {
        let currentDs = await this.getConfigByAlias(alias)
        if (!currentDs) {
            throw `DataSource with alias '${alias}' doesn't exist`
        }

        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()
        try {

            let data: DatasourceV2Entity = {
                id: currentDs.id,
                accountId: context.accountId,
                version: currentDs.version + 1,
                type: ds.type,
                title: ds.title,
                isSystem: false,
                isTree: ds.isTree,
                alias: ds.alias,
                createdBy: currentDs.createdBy,
                createdAt: currentDs.createdAt,
                updatedAt: new Date(),
                updatedBy: context.userId,
                permissions: ds.permissions ? ds.permissions : undefined
            }
            await queryRunner.manager
                .createQueryBuilder()
                .update(DatasourceV2Entity)
                .set(data)
                .where("id = :id", {id: currentDs.id})
                .execute()

            await this.upsertFields(queryRunner, data, ds.fields, context)

            await this.updateDataSourceSchema({queryRunner, ds: data, fields: ds.fields, oldDs: currentDs, context})

            await queryRunner.commitTransaction()

            try {
                await this.upsertIndex(ds.alias, context)
            } catch (e) {
                this.logger.error(e)
            }

            return {
                id: currentDs.id
            }
        } catch (e) {
            await queryRunner.rollbackTransaction()
            this.logger.error(e)
            throw e
        } finally {
            await queryRunner.release()
        }
    }

    private async upsertIndex(alias: string, context: Context) {
        let ds = await this.getConfigByAlias(alias)
        let indexUid = this.indexer.getIndexUid(ds.alias, context)
        let index = await this.indexer.getIndex(indexUid)
        if (!index) {
            await this.indexer.createIndex(indexUid)
            index = await this.indexer.getIndex(indexUid)
        }
        let full = await this.getConfigByAlias(alias, true)
        await this.indexer.updateIndexSettings(index, full.fields)
        await this.indexer.dataReindex({dataSourceConfig: ds}, context)
    }

    async updateDataSourceSchema(params: {queryRunner:QueryRunner, ds: DatasourceV2Entity, oldDs: DataSourceV2Dto, fields: DatasourceFieldDto[], context: Context}) {
        const schema = `account_data${params.context.accountId}`

        //Rename old datasource table if exists
        if(params.oldDs.alias !== params.ds.alias) {
            let table = new Table({
                schema: schema,
                name: params.oldDs.alias
            })
            if (await params.queryRunner.hasTable(table)) {
                await params.queryRunner.renameTable(table, params.ds.alias)
            }
        }

        let table = new Table({
            schema: schema,
            name: params.ds.alias
        })

        if (!(await params.queryRunner.hasTable(table))) {
            await this.addDataSourceSchema({
                queryRunner: params.queryRunner,
                ds: params.ds,
                fields: params.fields,
                context: params.context
            })
            return
        }

        let oldTable = await params.queryRunner.getTable(`${schema}.${params.ds.alias}`)

        for(let i in params.fields) {
            const field = params.fields[i]
            const column = oldTable.columns.find(c => c.name === field.alias)
            if (!column) {
                await params.queryRunner.addColumn(oldTable, new TableColumn({
                    name: field.alias,
                    type: this.dataSourceTypeToColumnType(field.type),
                    comment: field.title,
                    isNullable: !!field.isNullable || true,
                    default: field.defaultValue ? field.defaultValue : undefined
                }))
            } else {
                await params.queryRunner.changeColumn(oldTable, column, new TableColumn({
                    name: field.alias,
                    type: this.dataSourceTypeToColumnType(field.type),
                    comment: field.title,
                    isNullable: !!field.isNullable || true,
                    default: field.defaultValue ? field.defaultValue : undefined
                }))
            }
        }
    }

    async addDataSourceSchema(params: {queryRunner:QueryRunner, ds: DatasourceV2Entity, context: Context, fields: DatasourceFieldDto[]}) {
        const schema = `account_data${params.context.accountId}`

        let columns: any[] = [{
            name: "id",
            type: "bigserial",
            comment: "",
            isPrimary: true,
        }]

        columns.push(...params.fields.map(f => {
            return {
                name: f.alias,
                type: this.dataSourceTypeToColumnType(f.type),
                comment: f.title,
                default: f.defaultValue
            }
        }))
        SystemFields.forEach(f => {
            if (f.alias !== 'id') {
                columns.push({
                    name: f.alias,
                    type: this.dataSourceTypeToColumnType(f.type),
                    comment: f.title,
                    isNullable: !!f.isNullable,
                    default: f.defaultValue
                })
            }
        })

        let table = new Table({
            schema: schema,
            name: params.ds.alias,
            columns: columns
        })

        if (await params.queryRunner.hasTable(table)) {
            throw `Table ${params.ds.alias} in schema ${schema} exists`
        }

        await params.queryRunner.createSchema(schema, true)
        await params.queryRunner.createTable(table)
    }

    dataSourceTypeToColumnType(type: FieldType) : string {
        switch (type) {
            case "number": return "numeric"
            case "date": return "date"
            case "datetime": return "timestamp with time zone"
            case "time": return "time"
            case "text": return "text"
            case "bool": return "bool"
            case "table":return "jsonb"
            case "link": return "bigint"
            case "string":
            case "enum":
            case "image":
            case "file": return "varchar"
            default: return "varchar"
        }
    }



    async upsertFields(queryRunner:QueryRunner, ds: DatasourceV2Entity, fields: DatasourceFieldDto[], context: Context) {
        if (!fields.length) {
            return
        }

        for(const i in fields) {
            let field = fields[i]
            let d: DatasourceField = new DatasourceField()

            d.datasourceId = ds.id
            d.datasourceAlias = ds.alias
            d.alias = field.alias
            d.type = field.type
            d.title = field.title
            d.searchable = !!field.searchable
            d.filterable = !!field.filterable
            d.sortable = !!field.sortable
            d.isMultiple = !!field.isMultiple
            d.defaultValue = field.defaultValue
            d.datasourceReference = field.datasourceReference
            d.autoincrement = field.autoincrement
            d.isNullable = field.isNullable
            d.enumValues = field.enumValues
            d.precision = field.precision
            d.format = field.format
            d.accountId = context.accountId
            d.updatedAt = new Date()
            d.createdBy = context.userId
            d.updatedBy = context.userId
            d.version = ds.version
            d.deletedAt = null
            d.deletedBy = null

            await queryRunner.manager
                .createQueryBuilder()
                .insert()
                .into(DatasourceField)
                .values(d)
                .orUpdate(['type', 'title', 'searchable', 'filterable',
                        'sortable', 'is_multiple','default_value', 'datasource_ref',
                        'autoincrement', 'nullable', 'enum_values', 'precision',
                        'format', 'updated_by', 'updated_at', 'deleted_at',
                        'deleted_by', 'version', 'datasource_alias'],
                    ['datasource_id', 'alias'])
                .execute()
        }

        let del = {
            deletedBy: context.userId,
            deletedAt: new Date()
        }

        await queryRunner.manager
            .createQueryBuilder()
            .update(DatasourceField)
            .set(del)
            .where(`version <> ${ds.version} AND datasource_id = '${ds.id}'`
            )
            .execute()
    }

    async dataSourceAliasExists(alias: string) : Promise<boolean> {
        const rep = this.datasource.getRepository(DatasourceV2Entity)
        let cnt = await rep.countBy({alias: alias})

        return cnt > 0
    }

    async getDataMany(alias: string, params: GetDataManyRequestDto, context: Context) {
        let inst = await this.getDataSource(alias, true, context)
        return inst.getMany(params)
    }

    async getTotals(alias: string, params: GetDataManyRequestDto, context: Context) {
        let inst = await this.getDataSource(alias, false, context)
        return inst.getTotals(params)
    }

    async exportData(alias: string, params: ExportDataRequestDto, context: Context) {
        let inst = await this.getDataSource(alias, true, context)
        return inst.exportData(params)
    }

    async upsertDataSourceItems(alias: string, data: UpsertDataSourceDataRequestDto, context: Context) {
        let inst = await this.getDataSource(alias, false, context)
        return inst.upsert(data)
    }

    async deleteDataSourceItems(alias, data: DeleteDataSourceDataRequestDto, context: Context) {
        let inst = await this.getDataSource(alias, false, context)
        if (data.ids) {
            return inst.deleteById({ids: data.ids, soft: data.soft !== undefined ? data.soft : true})
        } else if (data.where) {
            return inst.deleteBy({where: data.where, soft: data.soft !== undefined ? data.soft : true})
        } else
            throw "No items to delete"

    }

    @OnEvent('config-update.datasource.*', {async: true})
    async handleDataSourceConfigUpdate(data) {
        console.log('config-update.datasource.*')

        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()
        try {
            await this.updateFieldsFromV1(queryRunner, data.item, data.context)
            await this.updateDatasourceFromV1(queryRunner, data.item, data.context)
            await queryRunner.commitTransaction()
        } catch (e) {
            console.log(e)
            await queryRunner.rollbackTransaction()
            throw e
        } finally {
            await queryRunner.release()
        }

        let config = await this.getConfigByAlias(data.item.data.alias)
        await this.dataReindex({
            dataSourceConfig: config,
        }, data.context)
    }

    @OnEvent('data-update.*.updated', {async: true})
    async handleDataSourceDataUpdate(data) {
        this.logger.log("New event 'data-update.*.updated'")
        if (!data.alias) {
            this.logger.error("Event data-update.** doesn't have alias of datasource")
            return;
        }



        let config = await this.getConfigByAlias(data.alias)
        await this.dataReindex({
            dataSourceConfig: config,
            ids: data.ids
        }, data.context)
    }

    @OnEvent('data-update.*.deleted', {async: true})
    async handleDataSourceDataDelete(data) {
        this.logger.log("New event data-update.*.deleted")
        if (!data.alias) {
            this.logger.error("Event data-update.** doesn't have alias of datasource")
            return;
        }

        let config = await this.getConfigByAlias(data.alias)
        await this.indexer.deleteDocsById(config, data.ids, data.context)
    }

    @OnEvent('data-update.*.imported')
    async handleDataSourceDataImported(data) {
        this.logger.log('New event data-update.*.imported')
        let config = await this.getConfigByAlias(data.item.data.alias)
        await this.dataReindex({
            dataSourceConfig: config,
        }, data.context)
    }
}