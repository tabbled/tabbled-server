import { Injectable } from '@nestjs/common';
import { DataSource, MoreThan, Repository, QueryRunner } from "typeorm";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { ConfigItem, ConfigRevision } from "./entities/config.entity";
import { ConfigImportDto } from "./dto/request.dto";

@Injectable()
export class ConfigService {
    constructor(@InjectRepository(ConfigItem)
                private dataItemsRepository: Repository<ConfigItem>,
                @InjectDataSource('default')
                private datasource: DataSource) {
    }

    async getMany(filter?: any): Promise<any> {
        console.log(filter)
        return await this.dataItemsRepository.findBy({
        })
    }

    async getManyAfterRevision(rev: number): Promise<any> {
        return await this.dataItemsRepository.findBy({
            rev: MoreThan(rev)
        })
    }

    async getLastRevisionNumber(): Promise<number> {
        const rep = this.datasource.getRepository(ConfigItem);
        const val = await rep
            .createQueryBuilder('config')
            .select('MAX(rev)', 'rev')
            .getRawOne();

        return val.rev
    }

    async update(item: ConfigItem, userId: number) {

        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()

        try {
            await this.updateItem(queryRunner, item, userId)
            await queryRunner.commitTransaction();
        } catch (e) {
            console.error(e)
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
            throw e;
        }

        await queryRunner.release();
    }

    async updateItem(queryRunner: QueryRunner, item: ConfigItem, userId: number) {
        const current_item = await queryRunner.manager.findOne(ConfigItem, {
            where: {
                id: item.id
            }
        })
        let newRevision = null

        try {
            let revRes = await queryRunner.manager.insert(ConfigRevision, {
                alias: item.alias,
                version: item.version,
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
            throw Error(`Revision didn't create for config item`)

        if (!current_item) {
            await queryRunner.manager.createQueryBuilder()
                .insert()
                .into(ConfigItem)
                .values({
                    id: item.id,
                    rev: newRevision,
                    version: item.version,
                    alias: item.alias,
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
                .update(ConfigItem)
                .set({
                    rev: newRevision,
                    version: item.version,
                    alias: item.alias,
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
        return newRevision
    }

    async updateBatch(queryRunner: QueryRunner, items: ConfigItem[], userId: number) {
        for(let i in items) {
            await this.updateItem(queryRunner, items[i], userId)
        }
    }

    async import(config: ConfigImportDto, userId: number) {
        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()

        try {
            if (config.datasource)
                await this.updateBatch(queryRunner, config.datasource, userId)

            if (config.page)
                await this.updateBatch(queryRunner, config.page, userId)

            if (config.menu)
                await this.updateBatch(queryRunner, config.menu, userId)

            if (config.function)
                await this.updateBatch(queryRunner, config.function, userId)

            await queryRunner.commitTransaction();
        } catch (e) {
            console.error(e)
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
            throw e;
        }

        await queryRunner.release();
    }
}
