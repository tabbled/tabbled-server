import { Injectable } from '@nestjs/common';
import { GetDataManyOptionsDto } from "./dto/datasource.dto";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { ConfigItem } from "../config/entities/config.entity";
import { DataSourceConfigInterface, InternalDataSource } from "./entities/datasource.entity";
import { Context } from "../entities/context";
import { Queue } from "bull";
import { InjectQueue } from "@nestjs/bull";

@Injectable()
export class DataSourcesService {
    constructor( @InjectQueue('functions') private functionsQueue: Queue,
                 @InjectDataSource('default')
                private datasource: DataSource,
               ) {
    }

    async getDataMany(alias: string, options: GetDataManyOptionsDto, context: Context) : Promise<any[]> {
        let ds = await this.getByAlias(alias, context)
        return await ds.getMany(options)
    }

    async getDataById(alias: string, id: string, context: Context) : Promise<any> {
        let ds = await this.getByAlias(alias, context)
        return await ds.getById(id)
    }

    async insertData(alias: string, value: any, context: Context, id?: string, parentId?: string) {
        let ds = await this.getByAlias(alias, context)
        return await ds.insert(value, id, parentId)
    }

    async updateDataById(alias: string, id: string, value: any, context: Context) {
        let ds = await this.getByAlias(alias, context)
        return await ds.updateById(id, value)
    }

    async removeDataById(alias: string, id: string,  context: Context, soft: boolean = true) {
        let ds = await this.getByAlias(alias, context)
        return ds.removeById(id, soft)
    }

    async setValue(alias: string, id: string, field: string, value: any,  context: Context) {
        let ds = await this.getByAlias(alias, context)
        return await ds.setValue(id, field, value)
    }

    private async getConfig(alias: string): Promise<DataSourceConfigInterface> {
        const rep = this.datasource.getRepository(ConfigItem);
        let item = await rep.createQueryBuilder()
            .where(`alias = 'datasource' AND (data ->> 'alias')::varchar = :alias and deleted_at IS NULL`, { alias: alias })
            .getOne()
        return item.data
    }

    async getByAlias(alias: string, context: Context) {
        let config = await this.getConfig(alias)

        if (!config || config.source !== 'internal') {
            throw new Error('DataSource is not an internal source')
        }

        return new InternalDataSource(config, this.datasource, this.functionsQueue, context)
    }
}
