import { Context } from "../../entities/context";
import { GetDataManyOptionsDto } from "../dto/datasource.dto";
import { DataSource, QueryRunner } from "typeorm";
import { DataItem, Revision } from "./dataitem.entity";
import { FlakeId } from '../../flake-id'
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

export interface DataSourceConfigInterface {
    fields: any[],
    type: DataSourceType,
    title?: string,
    alias: string,
    readonly?: boolean,
    keyField?: string,
    isTree?: boolean,
    source?: DataSourceSource,
    script?: string
}

export class InternalDataSource {
    constructor(config: DataSourceConfigInterface, dataSource: DataSource, context: Context) {
        this.config = config
        this.dataSource = dataSource
        this.context = context
    }
    readonly config: DataSourceConfigInterface
    readonly dataSource: DataSource
    readonly context: Context

    /**
     * @deprecated
     * Get all data store from the data source
     */
    async getAll(): Promise<any[]> {
        console.log('DataSource.getAll', this.context)
        return await this.getMany()
    }

    async getMany(options: GetDataManyOptionsDto = {}): Promise<any[]> {
        console.log("DataSource.getMany", JSON.stringify(options))
        let data = await this.getManyRaw(options);
        return data.map(d => d.data)
    }

    async getManyRaw(options: GetDataManyOptionsDto = {}): Promise<any[]> {
        const rep = this.dataSource.getRepository(DataItem);
        let query = rep.createQueryBuilder()
            .select()
            .where(`account_id = ${this.context.accountId} AND alias = '${this.config.alias}' AND deleted_at IS NULL`)

        if (options.take) query.take(options.take)
        if (options.skip) query.skip(options.skip)
        if (options.sort) query.addOrderBy(`data ->> '${options.sort.field}'`, options.sort.ask ? "ASC" : "DESC")


        for(let i in options.filter) {
            let f = options.filter[i]
            switch (f.op) {
                case "==": query.andWhere(`data ->> '${f.key}' = '${f.compare}'`); break;
                case "!=": query.andWhere(`data ->> '${f.key}' <> '${f.compare}'`); break;
                case "like": query.andWhere(`data ->> '${f.key}' LIKE '${f.compare}'`); break;
                case "!like": query.andWhere(`data ->> '${f.key}' NOT LIKE '${f.compare}'`); break;
                case "<":
                case "<=":
                case ">":
                case ">=": query.andWhere(`data ->> '${f.key}' ${f.op} '${f.compare}'`); break;
            }
        }

        console.log('getMany.query', query.getQuery())
        return await query.getMany()

    }

    async getByIdRaw(id: string) : Promise<DataItem | undefined> {
        const rep = this.dataSource.getRepository(DataItem);

        return await rep.findOneBy({
            accountId: this.context.accountId,
            alias: this.config.alias,
            id: id
        })
    }

    async getById(id: string) : Promise<any | undefined> {
        let item = await this.getByIdRaw(id)
        return item ? item.data : undefined
    }

    async insert(value: any,  id?: string, parentId?: string): Promise<DataItem> {
        let queryRunner = this.dataSource.createQueryRunner()
        await queryRunner.startTransaction()

        let item = {
            id: id || String(flakeId.generateId()),
            rev: "",
            version: 1,
            parentId: parentId,
            alias: this.config.alias,
            accountId: this.context.accountId,
            data: value,
            createdBy: this.context.userId,
            updatedAt: new Date(),
            updatedBy: this.context.userId,
            createdAt: new Date(),
            deletedBy: null,
            deletedAt: null
        }
        item.rev = await this.createRevision(queryRunner, item)

        try {
            await queryRunner.manager.createQueryBuilder()
                .insert()
                .into(DataItem)
                .values(item)
                .execute()
            await queryRunner.commitTransaction();

        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e
        }
        await queryRunner.release();
        return item
    }

    async updateById(id: string, value: object, silentMode = false): Promise<DataItem> {
        let item = await this.getByIdRaw(id);
        if (!item) {
            throw new Error(`Item by id "${id}" not found`)
        }
        console.log("updateById, silentMode", silentMode)

        let queryRunner = this.dataSource.createQueryRunner()
        await queryRunner.startTransaction()

        item.data = value
        item.rev = await this.createRevision(queryRunner, item)
        item.updatedAt = new Date()
        item.updatedBy = this.context.userId

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
        }
        await queryRunner.release();
        return item
    }

    async removeById(id: string, soft = true): Promise<DataItem> {
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
        }
        await queryRunner.release();
        return item
    }

    async setValue(id: string, field: string, value: any, silent = true): Promise<DataItem> {
        let item = await this.getByIdRaw(id);
        if (!item) {
            throw new Error(`Item by id "${id}" not found`)
        }
        item.data[field] = value

        return await this.updateById(id, item.data, silent)
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
}