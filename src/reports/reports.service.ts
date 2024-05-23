import { Injectable } from '@nestjs/common'
import { RenderByIdDto, ReportDto } from './dto/report.dto'
import * as client from '@jsreport/nodejs-client'
import { InjectDataSource } from '@nestjs/typeorm'
import { ConfigItem } from '../config/entities/config.entity'
import { DataSource } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import { FunctionsService } from '../functions/functions.service'

@Injectable()
export class ReportsService {
    constructor(
        private functionsService: FunctionsService,
        @InjectDataSource('default')
        private datasource: DataSource,
        private configService: ConfigService
    ) {}
    async renderById(renderByIdDto: RenderByIdDto, vmConsole?) {
        let report = await this.getById(renderByIdDto.id)
        if (!report) throw `Report by id "${renderByIdDto.id}" not found`

        const jsreport = client(this.configService.get<string>('JSREPORT_URL'))

        let data = {}
        data = Object.assign(data, JSON.parse(report.testContext))
        data = Object.assign(data, renderByIdDto.context)

        try {
            let res = await this.functionsService.runScript(
                report.script,
                data,
                vmConsole
            )

            data = Object.assign(data, res)
        } catch (e) {
            console.error(e)
            throw `Error while running the preparing script - ${e.toString()}`
        }

        let rep = {
            template: {
                recipe:
                    report.templateFormat === 'html' ? 'chrome-pdf' : 'xlsx',
                content:
                    report.templateFormat === 'html'
                        ? report.template
                        : '{{{xlsxPrint}}}',
                engine: 'handlebars',
                xlsx: undefined,
            },
            data: data,
        }

        if (report.templateFormat === 'excel') {
            rep.template.xlsx = {
                templateAsset: {
                    content: report.templateExcel,
                    encoding: 'base64',
                },
            }
        }

        let contentType
        let filename = report.title
        switch (report.templateFormat) {
            case 'excel':
                contentType = 'application/xlsx'
                filename += '.xlsx'
                break
            case 'html':
                contentType = 'application/pdf'
                filename += '.pdf'
                break
            default:
                contentType = 'application/blob'
        }

        let rendered = await jsreport.render(rep)
        return {
            data: rendered,
            contentType: contentType,
            filename: filename,
        }
    }

    async getById(id: string): Promise<ReportDto | undefined> {
        const rep = this.datasource.getRepository(ConfigItem)
        let item = await rep
            .createQueryBuilder()
            .where(`alias = 'report' AND id = :id and deleted_at IS NULL`, {
                id: id,
            })
            .getOne()
        return item ? item.data : undefined
    }
}
