import { Injectable } from '@nestjs/common';
import { DataSource, Repository, QueryRunner } from "typeorm";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { ConfigItem, ConfigParam, ConfigRevision } from "./entities/config.entity";
import { ConfigImportDto, GetByIdDto, GetByKeyDto, GetManyDto } from "./dto/request.dto";
import { Context } from "../entities/context";
import { FlakeId } from "../flake-id";
let flakeId = new FlakeId()

@Injectable()
export class ConfigService {
    constructor(@InjectRepository(ConfigItem)
                private dataItemsRepository: Repository<ConfigItem>,
                @InjectDataSource('default')
                private datasource: DataSource) {
    }

    async getMany(params: GetManyDto): Promise<any> {
        const rep = this.datasource.getRepository(ConfigItem);
        let query = rep.createQueryBuilder('cfg')
            .where(`alias = :alias AND deleted_at IS NULL`, { alias: params.alias})

        let items = await query.getMany()
        let data = items.map(i => i.data)

        return {
            items: data,
            count: await query.getCount()
        }
    }

    async getByIdRaw(params: GetByIdDto) : Promise<ConfigItem | undefined> {
        const rep = this.datasource.getRepository(ConfigItem);
        let query = rep.createQueryBuilder()
            .select()
            .where(` id = :id AND alias = :alias`, { alias: params.alias, id: params.id})

        return await query.getOne()
    }

    async getByKeyRaw(params: GetByKeyDto) : Promise<ConfigItem | undefined> {
        const rep = this.datasource.getRepository(ConfigItem);
        let query = rep.createQueryBuilder()
            .select()
            .where(`(data ->> 'alias')::varchar = :key AND alias = :alias`, { alias: params.alias, key: params.key})

        return await query.getOne()
    }

    async insert(alias: string, id: string, value: any, context: Context) {
        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()
        let item = null
        try {
            item  = await this.insertData(alias, value, queryRunner, context, id)
            await queryRunner.commitTransaction();

        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e
        } finally {
            await queryRunner.release();
        }
        return item
    }

    async updateById(alias: string, id: string, value: object, context: Context): Promise<ConfigItem> {
        let item = await this.getByIdRaw({alias: alias, id: id});

        if (!item) {
            throw new Error(`Config item for "${alias}" by id "${id}" not found`)
        }

        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()

        item.data = value
        try {
            await this.updateData(alias, id, item, queryRunner, context)
            await queryRunner.commitTransaction();
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e
        } finally {
            await queryRunner.release();
        }

        return item
    }

    async insertData(alias: string, data: any, queryRunner: QueryRunner, context: Context, id?:string): Promise<ConfigItem> {
        let item = {
            id: id || String(flakeId.generateId()),
            rev: "",
            version: 1,
            alias: alias,
            data: data,
            createdBy: context.userId,
            updatedAt: new Date(),
            updatedBy: context.userId,
            createdAt: new Date(),
            deletedBy: null,
            deletedAt: null
        }
        item.rev = await this.createRevision(queryRunner, item, context)

        await queryRunner.manager.createQueryBuilder()
            .insert()
            .into(ConfigItem)
            .values(item)
            .execute()

        return item
    }

    async updateData(alias: string, id: string, item: ConfigItem, queryRunner: QueryRunner, context: Context): Promise<void> {
        item.rev = await this.createRevision(queryRunner, item, context)
        item.updatedAt = new Date()
        item.updatedBy = context.userId

        await queryRunner.manager.createQueryBuilder()
            .update(ConfigItem)
            .set(item)
            .andWhere({
                id: item.id
            })
            .execute()
    }

    async removeById(alias: string, id: string, context: Context, soft = true): Promise<ConfigItem> {
        console.log("Remove config by id", id, "soft", soft)
        let item = await this.getByIdRaw({
            alias: alias,
            id: id
        });

        if (!item) {
            throw new Error(`Item by id "${id}" not found`)
        }

        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()

        item.deletedAt = new Date()
        item.deletedBy = context.userId
        item.rev = await this.createRevision(queryRunner, item, context)

        try {
            await queryRunner.manager.createQueryBuilder()
                .insert()
                .update(ConfigItem)
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

        return item
    }

    private async createRevision(queryRunner: QueryRunner, item: ConfigItem, context: Context) {
        try {
            let revRes = await queryRunner.manager.insert(ConfigRevision, {
                alias: item.alias,
                version: item.version,
                data: item.data,
                createdBy: context.userId
            })
            return revRes.identifiers[0].id;
        } catch (e) {
            throw e;
        }
    }




    // async getManyAfterRevision(rev: number): Promise<any> {
    //     return await this.dataItemsRepository.findBy({
    //         rev: MoreThan(rev)
    //     })
    // }

    async getLastRevisionNumber(): Promise<number> {
        const rep = this.datasource.getRepository(ConfigItem);
        const val = await rep
            .createQueryBuilder('config')
            .select('MAX(rev)', 'rev')
            .getRawOne();

        return val.rev
    }

    async update(item: ConfigItem, context: Context) {

        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()

        try {
            await this.updateItem(queryRunner, item, context.userId)
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

    async setParameter(id: string, value: any, accountId: number) {
        const rep = this.datasource.getRepository(ConfigParam);
        await rep.createQueryBuilder()
            .insert()
            .into(ConfigParam)
            .values({ accountId: accountId, id: id, value: value})
            .orUpdate( ['value'], ['id', 'account_id'])
            .execute()
    }

    async getParameter(id: string, accountId: number) {
        console.log(id, accountId)
        const rep = this.datasource.getRepository(ConfigParam);
        let item = await rep
            .createQueryBuilder()
            .select()
            .whereInIds({id: id, accountId: accountId})
            .getOne();

        return item ? item.value : null
    }
}
