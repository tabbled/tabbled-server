import { Injectable } from '@nestjs/common';
import { RenderByIdDto, ReportDto } from "./dto/report.dto";
import * as client from '@jsreport/nodejs-client'
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigItem } from "../config/entities/config.entity";
import { Repository } from "typeorm";



@Injectable()
export class ReportsService {
    constructor(@InjectRepository(ConfigItem)
                private configRepository: Repository<ConfigItem>) {
    }
    async renderById(renderByIdDto: RenderByIdDto) {

        let report = await this.getById(renderByIdDto.id)
        if (!report)
            throw `Report by id "${renderByIdDto.id}" not found`


        const jsreport =  client('http://localhost:5488')

        return await jsreport.render({
            template: {
                content: report.template,
                engine: 'handlebars',
                recipe: 'chrome-pdf'
            },
            data: {}
        })
    }

    async getById(id: string) :Promise<ReportDto | undefined> {
        let item = await this.configRepository.createQueryBuilder()
            .where(`alias = 'report' AND id = :id`, { id: id })
            .getOne()
        return item ? item.data : undefined
    }
}
