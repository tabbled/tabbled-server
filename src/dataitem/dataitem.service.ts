import { Injectable } from '@nestjs/common';
import { DataItem, Revision } from "./entities/dataitem.entity";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository, MoreThan } from "typeorm";
import { DataItemDto } from "./dto/dataitem.dto";

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
            console.error(e)
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
            throw e;
        }

        if (!newRevision)
            throw Error(`Revision didn't create for item`)

        try {
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
            await queryRunner.commitTransaction();
            await queryRunner.release();
        } catch (e) {
            console.error(e)
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
            throw e;
        }
    }

}
