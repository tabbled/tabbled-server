import { DataItemService } from "../dataitem/dataitem.service";
import { Context } from "./context";
import { DataItemDto } from "../dataitem/dto/dataitem.dto";

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

export interface EntityInterface {
    [name: string]: any | never
}

export declare type StandardQueryOperator = '<' | '<=' | '==' | '!=' | '>' | '>=' | 'exists' | '!exists' | 'between' | '!between' | 'like' | '!like' | 'matches' | '!matches' | 'in' | '!in' | 'has' | '!has' | 'contains' | '!contains';
export interface FilterItemInterface {
    key: string,
    op: StandardQueryOperator,
    compare?: any
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

export class DataSource {
    constructor(config: DataSourceConfigInterface, dataItemService: DataItemService, context: Context) {
        this.config = config
        this.dataItemService = dataItemService
        this.context = context
        console.log('DataSource context', this.context)
    }
    readonly config: DataSourceConfigInterface
    readonly dataItemService: DataItemService
    readonly context: Context

    async getAll(): Promise<any[]> {
        console.log('DataSource.getAll', this.context)

        return await this.dataItemService.getMany(this.context, this.config.alias)
    }

    // async getMany(filter: FilterItemInterface[], take?: number, skip?: number): Promise<any[]> {
    //     return []
    // }
    //
    // async getManyRaw(filter: FilterItemInterface[], take?: number, skip?: number): Promise<any[]> {
    //     return []
    // }
    //
    async getByIdRaw(id: string) : Promise<DataItemDto | undefined> {
        return await this.dataItemService.getById(id, this.context)
    }

    async getById(id: string) : Promise<any | undefined> {
        console.log('getById', id)
        let item = await this.getByIdRaw(id)
        return item ? item.data : undefined
    }

    async insert(id: string, value: any, parentId?: string, silentMode = false): Promise<any> {
        console.log('DataSource.updateById', id, value)

        let item = {
            id: id,
            accountId: this.context.accountId,
            createdAt: new Date(),
            createdBy: this.context.userId,
            updatedAt: new Date(),
            updatedBy: this.context.userId,
            version: 1,
            alias: this.config.alias,
            data:  value,
            rev: 0
        }

        try {
            await this.dataItemService.update(item, this.context, silentMode)
        } catch (e) {
            throw e
        }
    }

    async updateById(id: string, value: object, silentMode = false): Promise<void> {
        console.log('DataSource.updateById', id, value)
        let item = await this.getByIdRaw(id)
        if (!item)
            return;

        item.data = value

        try {
            await this.dataItemService.update(item, this.context, silentMode)
        } catch (e) {
            throw e
        }
    }

    async removeById(id: string): Promise<boolean> {
        console.log(id)
        return false
    }

    async setValue(id: string, field: string, value: any, silentMode: boolean = false): Promise<void> {
        console.log('DataSource.setValue', id, field, value, silentMode)
        let item = await this.getByIdRaw(id)
        if (!item)
            return;

        item.data[field] = value

        try {
            await this.dataItemService.update(item, this.context, silentMode)
        } catch (e) {
            throw e
        }
    }

}