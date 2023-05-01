import { Injectable } from "@nestjs/common";
import { DataItem, Revision } from "../datasources/entities/dataitem.entity";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository, QueryRunner } from "typeorm";
import { DataItemDto } from "./dto/dataitem.dto";
import { ConfigItem } from "../config/entities/config.entity";
import { Context } from "../entities/context";

@Injectable()
export class DataItemService {
    constructor(
                @InjectRepository(DataItem)
                private dataItemsRepository: Repository<DataItem>,
                @InjectDataSource('default')
                private datasource: DataSource) {
    }

    async getManyAfterRevision(accountId: number, rev: number): Promise<any> {

        console.log('getManyAfterRevision, rev', rev, 'account', accountId)

        const rep = this.datasource.getRepository(DataItem);
        return await rep.createQueryBuilder()
            .select()
            .where(`account_id = :accountId AND rev > :rev`, {
                accountId: accountId,
                rev: rev
            })
            .getMany()
    }

    async update(item: DataItemDto, context: Context, silentMode: boolean = false) {
        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()

        console.log('update', item, context, silentMode)

        try {
            //let change = await this.updateItem(queryRunner, item, context)
            await this.updateItem(queryRunner, item, context)
            await queryRunner.commitTransaction();
            await queryRunner.release();

            // if (!silentMode)
            //     this.invokeEvents(change, context)
        } catch (e) {
            console.error(e)
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
            throw e;
        }
    }

    async updateItem(queryRunner: QueryRunner, item: DataItemDto, context: Context): Promise<void> {
        const current_item = await queryRunner.manager.findOne(DataItem, {
            where: {
                id: item.id
            }
        })

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

            }
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

}

