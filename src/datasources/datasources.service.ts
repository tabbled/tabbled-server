import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ExportParams, GetDataManyOptionsDto, GetManyResponse, ImportDataOptionsDto } from "./dto/datasource.dto";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { ConfigItem } from "../config/entities/config.entity";
import { DataSourceConfigInterface, InternalDataSource } from "./entities/datasource.entity";
import { Context } from "../entities/context";
import { FunctionsService } from "../functions/functions.service";
import { RoomsService } from "../rooms/rooms.service";
import { DataItem } from "./entities/dataitem.entity";
import * as XLSX from "xlsx"

@Injectable()
export class DataSourcesService {
    constructor(@Inject(forwardRef(() => FunctionsService))
                private functionsService: FunctionsService,
                 @InjectDataSource('default')
                private datasource: DataSource,
                @Inject(RoomsService)
                private rooms: RoomsService
               ) {
    }

    async getDataMany(alias: string, options: GetDataManyOptionsDto, context: Context) : Promise<GetManyResponse> {
        let ds = await this.getByAlias(alias, context)
        return await ds.getMany(options)
    }

    async getDataById(alias: string, id: string, context: Context) : Promise<any> {
        let ds = await this.getByAlias(alias, context)
        return await ds.getById(id)
    }

    async getDataByKeys(alias: string, keys: any, context: Context) : Promise<any> {
        let ds = await this.getByAlias(alias, context)
        return await ds.getByKeys(keys)
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

    async importData(alias: string, data: any[], options: ImportDataOptionsDto, context: Context) {
        let ds = await this.getByAlias(alias, context)
        return ds.import(data, options)
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

        if (!item)
            throw `DataSource '${alias}' not found`

        return item.data
    }

    async getByAlias(alias: string, context: Context) {
        let config = await this.getConfig(alias)

        if (config.source !== 'internal') {
            throw 'DataSource is not an internal source'
        }

        return new InternalDataSource(config, this.datasource, this.functionsService, context, this.rooms)
    }

    async exportData(alias: string, params: ExportParams, context: Context) {
        console.log('Export data from datasource: ' + alias, params )
        let ds = await this.getByAlias(alias, context)
        let data = await ds.getMany({
            filter: params.filter,
            fields: params.fields,
            take: 10000
        })

        let sheet = []
        let titles = []
        for (let i in params.fields) {
            let t = params.fields[i]
            let field = ds.getFieldByAlias(t)

            if (field)
                titles.push(field.title)
        }
        sheet.push(titles)

        for(let i in data.items) {
            let item = data.items[i]
            let row = []
            for(let j in params.fields) {
                let field = ds.getFieldByAlias(params.fields[j])
                if (field) {
                    if (field.type === 'link') {
                        row.push(item[`__${field.alias}_title`])
                    } else if (field.type === 'enum') {
                        row.push(field.values.find((it) => it.key === item[field.alias]).title)
                    } else {
                        row.push(item[field.alias])
                    }
                }


            }
            sheet.push(row)
        }

        switch (params.format) {
            case "xlsx": return arrayToExcel(sheet);
            case "csv": return arrayToCsv(sheet);
            case "json": return Buffer.from(JSON.stringify(data.items, null, 4)).toString('base64');
            default: throw 'Unknown export format'
        }

        function arrayToExcel(data) {
            let worksheet = XLSX.utils.aoa_to_sheet(data)
            let workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'alias')

            return XLSX.write(workbook, {
                type: 'base64',
                bookType: 'xlsx'
            });
        }

        function arrayToCsv(data) {
            let d = ''
            data.forEach((row) => {
                let strRow = ''
                row.forEach(f => {
                    strRow += f + '\t'
                })
                strRow += '\n'
                d += strRow
            })
            return Buffer.from(d).toString('base64')
        }
    }

    async getCurrentRevisionId(alias, id) {
        let rep = this.datasource.getRepository(DataItem)
        let query = rep.createQueryBuilder()
        let item = await query.select()
            .andWhere('id = :id', {id: id})
            .getOne()

        return item.rev;
    }
}
