import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, QueryRunner } from "typeorm";
import { Context } from '../entities/context'
import { FunctionsService } from '../functions/functions.service'
import { RoomsService } from '../rooms/rooms.service'
import {
    DataReindexDto, GetDataManyParamsDto, GetFieldsManyDto,
    GetRevisionByIdDto,
    GetRevisionsDto,
    GetRevisionsResponseDto, SystemFields
} from "./dto/datasourceV2.dto";
import { DataItem, Revision } from "./entities/dataitem.entity";
import { User } from "../users/entities/user.entity";
import { DataSourceConfigInterface } from "./entities/datasource.entity";
import { ConfigItem } from "../config/entities/config.entity";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { DataIndexer } from "../data-indexer/data-indexer";
import { ConfigService } from "@nestjs/config";
import { OnEvent } from "@nestjs/event-emitter";
import { DatasourceField } from "./entities/field.entity";



@Injectable()
export class DataSourceV2Service {
    constructor(
        @Inject(forwardRef(() => FunctionsService))
        private functionsService: FunctionsService,
        @InjectDataSource('default')
        private datasource: DataSource,
        @Inject(RoomsService)
        private rooms: RoomsService,
        @InjectQueue('datasource-data-indexing') private dataIndexingQueue: Queue,
        private configService: ConfigService
    ) {
        this.indexer = new DataIndexer(configService, datasource)
        this.indexer.setTimezone(configService.get<string>('DEFAULT_TIMEZONE') || 'Europe/Moscow')
    }

    private readonly indexer:DataIndexer = null

    async getDataMany(params: GetDataManyParamsDto, context: Context) {
        return await this.indexer.getDataMany(params, context)
    }

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
        if (params.dataSourceConfig.source !== 'internal')
            throw `DataSource is not an internal source`

        // await this.indexer.dataReindex(params, context)
        // return {
        //     jobId: "0"
        // }

        let job = await this.dataIndexingQueue.add("index-all-datasource",{
            datasource: params.dataSourceConfig,
            ids: params.ids,
            context
        }, {})
        return {
            jobId: job.id
        }
    }

    async getConfigByAlias(alias: string): Promise<DataSourceConfigInterface> {
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

    async getFieldsMany(params: GetFieldsManyDto, context: Context) {
        console.log(params, context)

        const getFields = async (alias: string) => {
            const rep = this.datasource.getRepository(DatasourceField)
            return await rep
                .createQueryBuilder()
                .where(
                    `datasource_alias = :alias AND deleted_at IS NULL`,
                    { alias: alias }
                )
                .getMany()
        }

        let items = await getFields(params.datasource)


        // Need to collect all nested fields in linked datasource
        if (params.nested) {
            let links = items.filter(f => f.type === 'link' && f.datasourceReference)
            for(let i in links) {
                const field = links[i]
                let linked = (await getFields(field.datasourceReference))
                    .filter(f => ['number', 'string', 'bool', 'text', 'enum', 'image', 'datetime', 'date', 'time', 'link']
                        .includes(f.type))

                linked.forEach(f => {
                    f.alias = `${field.alias}.${f.alias}`
                    f.title = `${field.title} -> ${f.title}`
                    items.push(f)
                })
            }
        }

        return {
            items,
            count: items.length
        }

    }

    async updateField(queryRunner:QueryRunner, item: DataItem, context: Context) {
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
            d.required = !!field.required
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
                    'autoincrement', 'required', 'enum_values', 'precision',
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



    @OnEvent('config-update.datasource.*', {async: true})
    async handleDataSourceConfigUpdate(data) {

        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()
        try {
            await this.updateField(queryRunner, data.item, data.context)
            await queryRunner.commitTransaction()
        } catch (e) {
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

    @OnEvent('data-update.**', {async: true})
    async handleDataSourceDataUpdate(data) {
        //console.log(data)
        let config = await this.getConfigByAlias(data.item.alias)
        await this.dataReindex({
            dataSourceConfig: config,
            ids: [data.item.id]
        }, data.context)
    }

    @OnEvent('data-update.*.imported')
    async handleDataSourceDataImported(data) {
        //console.log('data-update.*.imported', data)
        let config = await this.getConfigByAlias(data.item.data.alias)
        await this.dataReindex({
            dataSourceConfig: config,
        }, data.context)
    }
}