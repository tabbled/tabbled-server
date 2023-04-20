import { Injectable } from '@nestjs/common';
import { DataItem, Revision } from "./entities/dataitem.entity";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository, MoreThan, QueryRunner } from "typeorm";
import { DataItemDto } from "./dto/dataitem.dto";
import { ConfigItem } from "../config/entities/config.entity";

@Injectable()
export class DataItemService {
    constructor(@InjectRepository(DataItem)
                private dataItemsRepository: Repository<DataItem>,
                @InjectDataSource('default')
                private datasource: DataSource) {
    }

    async getMany(accountId: number, filter?: any): Promise<any> {
        console.log(filter)
        return await this.dataItemsRepository.findBy({
            accountId: accountId
        })
    }

    async getManyAfterRevision(accountId: number, rev: number): Promise<any> {
        console.log('getManyAfterRevision, rev', rev, 'account', accountId)
        const rep = this.datasource.getRepository(DataItem);
        return await rep.findBy({
            accountId: accountId,
            rev: MoreThan(rev)
        })
    }

    async update(item: DataItemDto, accountId: number, userId: number) {
        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()

        try {
            await this.updateItem(queryRunner, item, accountId, userId)
            await queryRunner.commitTransaction();
            await queryRunner.release();
        } catch (e) {
            console.error(e)
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
            throw e;
        }
    }

    async updateItem(queryRunner: QueryRunner, item: DataItemDto, accountId: number, userId: number) {
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
                accountId: accountId,
                data: item.data,
                createdBy: userId
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
                        accountId: accountId,
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
                        accountId: accountId,
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

    async updateBatch(queryRunner: QueryRunner, items: DataItemDto[], accountId: number, userId: number) {
        for(let i in items) {
            await this.updateItem(queryRunner, items[i], accountId, userId)
        }
    }

    async import(data: any, accountId:number, userId: number) {
        let dataSources = await this.getInternalDataSource()

        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()

        try {
            for (const i in dataSources) {
                const alias = dataSources[i].alias

                if (data[alias] && data[alias] instanceof Array) {
                    await this.updateBatch(queryRunner, data[alias], accountId, userId)
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

    async getInternalDataSource() {
        const rep = this.datasource.getRepository(ConfigItem);
        return await rep.createQueryBuilder('ds')
            .select([`data ->> 'alias' alias`])
            .where(`alias = 'datasource' and deleted_at IS NULL and (data ->> 'source')::varchar = 'internal'`)
            .getRawMany()
    }

}
