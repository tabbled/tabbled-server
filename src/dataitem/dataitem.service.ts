import { Injectable } from '@nestjs/common';
import { DataItem, DataItemType, Revision } from "./entities/dataitem.entity";
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

    async getMany(accountId: number, type: any, filter?: any): Promise<any> {
        console.log(filter)
        return await this.dataItemsRepository.findBy({
            accountId: accountId,
            type: type
        })
    }

    async getManyAfterRevision(accountId: number, type: any, rev: number): Promise<any> {
        console.log(rev)
        return await this.dataItemsRepository.findBy({
            accountId: accountId,
            type: type,
            rev: MoreThan(rev)
        })
    }

    async update(type: DataItemType, data: DataItemDto, accountId: number, userId: number) {
        const item = await this.dataItemsRepository.findOne({
            where: {id: data.id}
        })
        console.log(item)
        console.log('update', accountId, userId)

        //console.log(this.datasource)

        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()

        let newRevision = null

        try {
            let revRes = await queryRunner.manager.insert(Revision, {
                type: type,
                alias: data.alias,
                ver: data.ver,
                accountId: accountId,
                data: data.data,
                createdBy: userId
            })
            newRevision = revRes.identifiers[0].id;
        } catch (e) {
            console.error(e)
            await queryRunner.rollbackTransaction();
            throw e;
        }

        if (!newRevision)
            throw Error(`Revision didn't create for item`)

        try {
            if (!item) {
                await queryRunner.manager.createQueryBuilder()
                    .insert()
                    .into(DataItem)
                    .values({
                        id: data.id,
                        rev: newRevision,
                        ver: data.ver,
                        alias: data.alias,
                        type: type,
                        accountId: accountId,
                        data: data.data,
                        updatedBy: data.updatedBy,
                        deletedBy: data.deletedBy,
                        createdBy: data.createdBy,
                        updatedAt: data.updatedAt,
                        createdAt: data.createdAt,
                        deletedAt: data.deletedAt
                    })
                    .execute()
            } else {
                await queryRunner.manager.createQueryBuilder()
                    .insert()
                    .update(DataItem)
                    .set({
                        rev: newRevision,
                        ver: data.ver,
                        alias: data.alias,
                        type: type,
                        accountId: accountId,
                        data: data.data,
                        updatedBy: data.updatedBy,
                        deletedBy: data.deletedBy,
                        createdBy: data.createdBy,
                        updatedAt: data.updatedAt,
                        createdAt: data.createdAt,
                        deletedAt: data.deletedAt
                    }).andWhere({
                        id: data.id
                    })
                    .execute()
            }


            await queryRunner.commitTransaction()
        } catch (e) {
            console.error(e)
            await queryRunner.rollbackTransaction();
        }
    }
}
