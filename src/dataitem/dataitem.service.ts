import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { DataItem, Revision } from "./entities/dataitem.entity";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository, MoreThan, QueryRunner } from "typeorm";
import { DataItemDto } from "./dto/dataitem.dto";
import { ConfigItem } from "../config/entities/config.entity";
import { FunctionsService } from "../functions/functions.service";
import { Context } from "../entities/context";

interface ItemChangeInterface {
    old: DataItemDto | undefined,
    new: DataItemDto | undefined
}

@Injectable()
export class DataItemService {
    constructor(@Inject(forwardRef(() => FunctionsService))
                private readonly functionsService: FunctionsService,
                @InjectRepository(DataItem)
                private dataItemsRepository: Repository<DataItem>,
                @InjectDataSource('default')
                private datasource: DataSource) {
    }

    async getMany(context: Context, alias?: string, filter?: any): Promise<any> {
        console.log(filter)
        return await this.dataItemsRepository.findBy({
            accountId: context.accountId,
            alias: alias
        })
    }

    async getById(id: string, context: Context): Promise<any> {
        let item = await this.dataItemsRepository.findOneBy({
            accountId: context.accountId,
            id: id
        })

        console.log('getById', id, context, item)

        return item
    }

    async getManyAfterRevision(accountId: number, rev: number): Promise<any> {
        console.log('getManyAfterRevision, rev', rev, 'account', accountId)
        const rep = this.datasource.getRepository(DataItem);
        return await rep.findBy({
            accountId: accountId,
            rev: MoreThan(rev)
        })
    }

    async update(item: DataItemDto, context: Context, silentMode: boolean = false) {
        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()

        console.log('update', item, context)

        try {
            let change = await this.updateItem(queryRunner, item, context)
            await queryRunner.commitTransaction();
            await queryRunner.release();

            if (!silentMode)
                this.invokeEvents(change, context)
        } catch (e) {
            console.error(e)
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
            throw e;
        }
    }

    async updateItem(queryRunner: QueryRunner, item: DataItemDto, context: Context): Promise<ItemChangeInterface> {
        const current_item = await queryRunner.manager.findOne(DataItem, {
            where: {
                id: item.id
            }
        })

        let change: ItemChangeInterface = {
            old: current_item,
            new: item
        }
        let newRevision = null

        try {
            let revRes = await queryRunner.manager.insert(Revision, {
                alias: item.alias,
                version: item.version,
                accountId: context.accountId,
                data: item.data,
                createdBy: context.userId
            })
            newRevision = revRes.identifiers[0].id;
        } catch (e) {
            throw e;
        }

        if (!newRevision)
            throw Error(`Revision didn't create for item`)


            if (!current_item) {
                await queryRunner.manager.createQueryBuilder()
                    .insert()
                    .into(DataItem)
                    .values({
                        id: item.id,
                        rev: newRevision,
                        version: item.version,
                        alias: item.alias,
                        accountId: context.accountId,
                        data: item.data,
                        updatedBy: item.updatedBy,
                        deletedBy: item.deletedBy,
                        createdBy: item.createdBy,
                        updatedAt: item.updatedAt,
                        createdAt: item.createdAt,
                        deletedAt: item.deletedAt
                    })
                    .execute()
            } else {
                await queryRunner.manager.createQueryBuilder()
                    .insert()
                    .update(DataItem)
                    .set({
                        rev: newRevision,
                        version: item.version,
                        alias: item.alias,
                        accountId: context.accountId,
                        data: item.data,
                        updatedBy: item.updatedBy,
                        deletedBy: item.deletedBy,
                        createdBy: item.createdBy,
                        updatedAt: item.updatedAt,
                        createdAt: item.createdAt,
                        deletedAt: item.deletedAt
                    }).andWhere({
                        id: item.id
                    })
                    .execute()

                if (item.deletedAt && !current_item.deletedAt) {
                    change.new = undefined
                }
            }
            return change
    }

    async updateBatch(queryRunner: QueryRunner, items: DataItemDto[], context: Context) {
        for(let i in items) {
            await this.updateItem(queryRunner, items[i], context)
        }
    }

    async import(data: any, context: Context) {
        let dataSources = await this.getInternalDataSources()

        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()

        try {
            for (const i in dataSources) {
                const alias = dataSources[i].alias

                if (data[alias] && data[alias] instanceof Array) {
                    await this.updateBatch(queryRunner, data[alias], context)
                }
            }
            await queryRunner.commitTransaction();
            await queryRunner.release();
        } catch (e) {
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
            throw e;
        }
    }

    async getInternalDataSources() {
        const rep = this.datasource.getRepository(ConfigItem);
        return await rep.createQueryBuilder('ds')
            .select([`data ->> 'alias' alias`])
            .where(`alias = 'datasource' and deleted_at IS NULL and (data ->> 'source')::varchar = 'internal'`)
            .getRawMany()
    }

    async getDataSourceConfig(alias: string) {
        const rep = this.datasource.getRepository(ConfigItem);
        let item = await rep.createQueryBuilder()
            .where(`alias = 'datasource' AND (data ->> 'alias')::varchar = :alias and deleted_at IS NULL`, { alias: alias })
            .getOne()
        return item.data
    }

    async invokeEvents(change: ItemChangeInterface, context: Context) {
        console.log(change)
        let alias = change.new?.alias || change.old?.alias

        let ds = await this.getDataSourceConfig(alias)
        if (!ds || !ds.eventHandlers || !ds.eventHandlers.length)
            return

        let event = ''
        if (change.new && !change.old) event = 'onAdd'
        else if (change.new && change.old) event = 'onUpdate'
        else if (!change.new && change.old) event = 'onRemove'
        else return

        for(const i in ds.eventHandlers) {
            let event_handler = ds.eventHandlers[i]
            console.log(`Event handler for dataSource "${ds.alias}"- `, ds.eventHandlers)
            if (event_handler.event === event && event_handler.handler.type === 'function') {

                let func = await this.functionsService.getById(event_handler.handler.functionId)

                let ctx = Object.assign(context, change)
                await this.functionsService.call(func.alias, ctx)
            }
        }
    }

}
