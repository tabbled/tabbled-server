import { Injectable } from "@nestjs/common";
import { RenderByIdDto, ReportDto } from "./dto/report.dto";
import * as client from '@jsreport/nodejs-client'
import { InjectDataSource } from "@nestjs/typeorm";
import { ConfigItem } from "../config/entities/config.entity";
import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { FunctionsService } from "../functions/functions.service";



@Injectable()
export class ReportsService {
    constructor(private functionsService: FunctionsService,
                @InjectDataSource('default')
                private datasource: DataSource,
                private configService: ConfigService) {
    }
    async renderById(renderByIdDto: RenderByIdDto, vmConsole?) {

        let report = await this.getById(renderByIdDto.id)
        if (!report)
            throw `Report by id "${renderByIdDto.id}" not found`

        const jsreport =  client(this.configService.get<string>('JSREPORT_URL'))

        let data = {}
        data = Object.assign(data, JSON.parse(report.testContext))
        data = Object.assign(data, renderByIdDto.context)

        try {
            let res = await this.functionsService.runScript(report.script, data, vmConsole)

            data = Object.assign(data, res)
        } catch (e) {
            console.error(e)
            throw `Error while running the preparing script - ${e.toString()}`
        }

        //console.log(data)


        return await jsreport.render({
            template: {
                content: report.template,
                engine: 'handlebars',
                recipe: 'chrome-pdf'
            },
            data: data
        })
    }

    async getById(id: string) :Promise<ReportDto | undefined> {
        const rep = this.datasource.getRepository(ConfigItem);
        let item = await rep.createQueryBuilder()
            .where(`alias = 'report' AND id = :id and deleted_at IS NULL`, { id: id })
            .getOne()
        return item ? item.data : undefined
    }
}
