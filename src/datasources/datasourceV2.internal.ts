import { DataSourceV2Dto } from "./dto/datasourceV2.dto";
import { DataSource, QueryRunner } from "typeorm";
import { Context } from "../entities/context";
import { Logger } from "@nestjs/common";
import { FlakeId } from "../flake-id";
import * as dayjs from "dayjs";
import * as utc from "dayjs/plugin/utc";
import * as timezone from "dayjs/plugin/timezone";
import { DataIndexer } from "../data-indexer/data-indexer";
import { EventEmitter2 } from "@nestjs/event-emitter";
dayjs.extend(utc);
dayjs.extend(timezone);
const flakeId = new FlakeId()

export class UpsertParams {
    items: any[]
    returnItems?: boolean
}

export class CreateParamsDto {
    config: DataSourceV2Dto
    dataSource: DataSource
    context: Context
    logger: Logger
    indexer: DataIndexer
    timezone?: string
    eventEmitter: EventEmitter2
}

export class InternalDBDatasource {
    constructor(params: CreateParamsDto) {
        this.config = params.config
        this.datasource = params.dataSource
        this.context = params.context
        this.logger = params.logger
        this.indexer = params.indexer
        this.timezone = params.timezone || 'Europe/Moscow'
        this.eventEmitter = params.eventEmitter
    }

    private readonly config: DataSourceV2Dto = null
    private readonly datasource: DataSource = null
    private readonly context: Context = null
    private readonly logger: Logger
    private readonly indexer: DataIndexer
    private readonly timezone
    readonly eventEmitter: EventEmitter2
    private schema = () => {
        return `"account_data${this.context.accountId}"."${this.config.alias}"`
    }
    private schemaC = () => {
        return `account_data${this.context.accountId}.${this.config.alias}`
    }

    async getMany(params) {
        return await this.indexer.getDataMany(params, this.config, this.context)
    }

    async getTotals(params) {
        return await this.indexer.getTotals(params, this.config, this.context)
    }

    async exportData(params) {
        return await this.indexer.exportData(params, this.config, this.context)
    }

    async getById(id) {

        let fields = this.config.fields.map(f => `"${f.alias}"` )
        let query = `SELECT ${fields.join(', ')} FROM ${this.schema()} WHERE id = '${id}'`

        let data = await this.datasource.query(query)

        this.logger.log(`getById, ${query}`)

        if (!data.length)
            return null

        let item = data[0]
        for(let i in this.config.fields) {

            let field = this.config.fields[i]
            switch (field.type) {
                case 'datetime':
                    item[field.alias] = item[field.alias]
                        ? dayjs(item[field.alias]).tz(this.timezone).format()
                        : null
                    break
                case 'date':
                    item[field.alias] = item[field.alias]
                        ? dayjs(item[field.alias]).tz(this.timezone).format('YYYY-MM-DD')
                        :null
                    break;
                case 'text':
                case 'link':
                case 'enum':
                case 'string':
                case 'bool':
                case 'time':
                    break;
                case 'number':
                    item[field.alias] = Number(item[field.alias])
            }
        }

        return item
    }

    async upsert(params: UpsertParams) {
        this.logger.log(`upsert, ${params.items.length} items`)


        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()
        try {

            let items = []
            let ids = []
            for(let i in params.items) {
                let upsItem = params.items[i]

                let fItem = null
                let existItem = null

                if (upsItem.id) {
                    existItem = await this.getById(upsItem.id)
                }

                if (!existItem) {
                    fItem = await this.insertItem(queryRunner, upsItem)
                } else {
                    fItem = await this.updateItem(queryRunner, upsItem, existItem)
                }

                ids.push(fItem.id)

                if (params.returnItems)
                    items.push(fItem)
            }

            await queryRunner.commitTransaction()

            this.eventEmitter.emit(`data-update.${this.config.alias}.updated`, {
                ids: ids,
                alias: this.config.alias,
                context: this.context
            })

            return params.returnItems ? items : undefined
        } catch (e) {
            await queryRunner.rollbackTransaction()
            this.logger.error(e)
            throw e
        } finally {
            await queryRunner.release()
        }
    }

    async deleteById(params: {
        ids: string[]
        soft?: boolean
    }) {
        this.logger.log("deleteById", params)
        if (!params.ids.length)
            throw "Ids must by not empty"

        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()
        try {

            if (params.soft) {
                await queryRunner.manager.query(`UPDATE ${this.schema()} SET deleted_at = $1, deleted_by = $2 WHERE id IN (${params.ids.join(',')})`,
                    [new Date(), this.context.userId])
            } else {
                await queryRunner.manager.query(`DELETE FROM ${this.schema()} WHERE id IN (${params.ids.join(',')})`)
            }

            await queryRunner.commitTransaction()

            this.eventEmitter.emit(`data-update.${this.config.alias}.${params.soft ? "updated" : "deleted"}`, {
                ids: params.ids,
                alias: this.config.alias,
                context: this.context
            })
        } catch (e) {
            await queryRunner.rollbackTransaction()
            this.logger.error(e)
            throw e
        } finally {
            await queryRunner.release()
        }
    }

    async deleteBy(params: {where: string, soft?: boolean}) {
        if (!params || !params.where)
            throw "Where must by not null"

        this.logger.log("deleteBy", params)
        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()
        try {

            let ids = await queryRunner.manager.query(`SELECT id FROM ${this.schema()} WHERE ${params.where}`,
                [])


            if (params.soft) {
                await queryRunner.manager.query(`UPDATE ${this.schema()} SET deleted_at = $1, deleted_by = $2 WHERE ${params.where}`,
                    [new Date(), this.context.userId])
            } else {

                let query = `DELETE FROM ${this.schema()} WHERE ${params.where}`
                this.logger.log(query)
                await queryRunner.manager.query(query)
            }

            await queryRunner.commitTransaction()

            this.eventEmitter.emit(`data-update.${this.config.alias}.${params.soft ? "updated" : "deleted"}`, {
                ids: ids.map(m => m.id),
                alias: this.config.alias,
                context: this.context
            })


        } catch (e) {
            await queryRunner.rollbackTransaction()
            this.logger.error(e)
            throw e
        } finally {
            await queryRunner.release()
        }
    }

    private async insertItem(queryRunner:QueryRunner, item: any) {
        let notValid = this.isNotValid(item)
        if (notValid)
            throw notValid

        item = this.convertToDBValue(item)

        item['created_by'] = this.context.userId
        item['updated_by'] = this.context.userId
        item['created_at'] = new Date()
        item['updated_at'] = new Date()
        item['id'] = flakeId.generateId().toString()
        item['version'] = 1

        try{
            await queryRunner.manager.insert(this.schemaC(), item)

        } catch (e) {
            this.logger.error(e)
            throw e
        }

        return item
    }

    private async updateItem(queryRunner:QueryRunner, item: any, old: any) {
        let notValid = this.isNotValid(item)
        if (notValid)
            throw notValid

        item = this.convertToDBValue(item)

        item['updated_by'] = Number(this.context.userId)
        item['updated_at'] = dayjs().tz(this.timezone).format()
        item['version'] = Number(old['version']) + 1

        let params = []
        let upd = ""

        let cnt = 1
        for (const [key, value] of Object.entries(item)) {

            // If field not found, we don't insert into query that
            if (this.config.fields.find(f => f.alias === key)) {
                if (upd) upd += ', '

                upd += `"${key}" = $${cnt++}`
                params.push(value)
                old[key] = value
            }
        }


        try{
            let query = `UPDATE ${this.schema()} SET ${upd} WHERE id = ${old.id}`
            await queryRunner.query(query, params)
            return old
        } catch (e) {
            this.logger.error(e)
            throw e
        }
    }

    isNotValid(item: any) {
        let errors = []
        for(const i in this.config.fields) {
            const field = this.config.fields[i]

            if (!item[field.alias]) {
                continue
            }

            if (field.isMultiple && !Array.isArray(item[field.alias])) {
                errors.push({
                    field: field.alias,
                    error: `Value must be an array`
                })
            }
        }
        return errors.length ? errors : null
    }

    convertToDBValue(item) {
        for (const [key, value] of Object.entries(item)) {
            let field = this.config.fields.find(f => f.alias === key)

            if (!field) {
                delete item[key]
            } else if (field.isMultiple && value){
                item[key] = JSON.stringify(value)
            }
        }

        return item
    }
}