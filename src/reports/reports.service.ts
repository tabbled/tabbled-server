import { Injectable } from '@nestjs/common'
import { RenderByAliasRequestDto, RenderByIdRequestDto, ReportDto } from "./dto/report.dto";
import * as client from '@jsreport/nodejs-client'
import { InjectDataSource } from '@nestjs/typeorm'
import { ConfigItem } from '../config/entities/config.entity'
import { DataSource } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import { FunctionsService } from '../functions/functions.service'
import { Context } from "../entities/context";
import { hasPermissionV1 } from "../common/permissions";

@Injectable()
export class ReportsService {
    constructor(
        private functionsService: FunctionsService,
        @InjectDataSource('default')
        private datasource: DataSource,
        private configService: ConfigService
    ) {}

    async getManyV1(params: {forPage?: string}, context: Context) {
        const rep = this.datasource.getRepository(ConfigItem)
        let items = await rep
            .createQueryBuilder()
            .where(`alias = 'report' AND deleted_at IS NULL`)
            .getMany()

        let out = []

        for(let i in items) {
            let item = items[i].data
            if (params.forPage) {
                if (item.pages.includes(params.forPage)) {
                    out.push(item)
                }
            } else
                out.push(item)
        }

        out = out.filter(f=> hasPermissionV1(f, 'View', context.user.permissions))

        return out
    }

    async render(report: ReportDto, context: Context, vmConsole?) {
        const jsreport = client(this.configService.get<string>('JSREPORT_URL'))

        let data = {}
        data = Object.assign(data, JSON.parse(report.testContext))
        data = Object.assign(data, context)

        try {
            let res = await this.functionsService.runScript({
                    context: data,
                    script: report.script,
                    vmConsole: vmConsole
                }

            )

            data = Object.assign(data, res)
        } catch (e) {
            console.error(e)
            throw `Error while running the preparing script - ${e.toString()}`
        }

        function getRecipe(format) {
            switch (format) {
                case "html": return 'chrome-pdf';
                case "excel": return 'xlsx';
                case "html-to-xlsx": return 'html-to-xlsx'
            }
        }

        let rep = {
            template: {
                recipe: getRecipe(report.templateFormat),
                content:
                    report.templateFormat === 'html' || report.templateFormat === 'html-to-xlsx'
                        ? report.template
                        : '{{{xlsxPrint}}}',
                engine: 'handlebars',
                xlsx: undefined,
                chrome: undefined
            },
            data: data,
        }

        if (report.templateFormat === 'html' && report.pageSettings) {
            rep.template.chrome = report.pageSettings
        }

        if (report.templateFormat === 'excel') {
            rep.template.xlsx = {
                templateAsset: {
                    content: report.templateExcel,
                    encoding: 'base64',
                },
            }
        }

        if (report.templateFormat === 'html-to-xlsx') {
            //
            rep.template.xlsx = {
                templateAsset: {
                    content: '<table></table>{{{xlsxPrint}}}',
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
            case 'html-to-xlsx':
                contentType = 'application/xlsx'
                filename += '.xlsx'
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

    async renderById(renderByIdDto: RenderByIdRequestDto, vmConsole?) {
        let report = await this.getById(renderByIdDto.id)
        if (!report) throw `Report by id "${renderByIdDto.id}" not found`

        return this.render(report, renderByIdDto.context, vmConsole)
    }

    async renderByAlias(alias, params: RenderByAliasRequestDto, vmConsole?) {
        let report = await this.getByAlias(alias)
        if (!report) throw `Report by alias "${alias}" not found`

        return this.render(report, params.context, vmConsole)
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

    async getByAlias(alias: string): Promise<ReportDto | undefined> {
        const rep = this.datasource.getRepository(ConfigItem)
        let item = await rep
            .createQueryBuilder()
            .where(`alias = 'report' AND data ->> 'alias' = :alias`, {
                alias: alias
            })
            .getOne()
        return item ? item.data : undefined
    }
}
