import { Injectable } from '@nestjs/common'
import { RenderByAliasRequestDto, RenderByIdRequestDto, ReportDto, ReportV2Dto } from "./dto/report.dto";
import * as client from '@jsreport/nodejs-client'
import { InjectDataSource } from '@nestjs/typeorm'
import { ConfigItem } from '../config/entities/config.entity'
import { DataSource } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import { FunctionsService } from '../functions/functions.service'
import { Context } from "../entities/context";
import { hasPermissionV1, hasPermissionV2 } from "../common/permissions";
import {style} from "./report.style";
import { DataSourceV2Service } from "../datasources/datasourceV2.service";
import * as Mustache from "mustache"
import { ReportEntity } from "./entities/report.entity";



@Injectable()
export class ReportsService {
    constructor(
        private functionsService: FunctionsService,
        @InjectDataSource('default')
        private datasource: DataSource,
        private datasourceService: DataSourceV2Service,
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

    async getManyV2(params: {forPage?: string}, context: Context) {
        const rep = this.datasource.getRepository(ReportEntity)
        let items = await rep
            .createQueryBuilder()
            .where(`deleted_at IS NULL AND account_id = ${context.accountId}`)
            .getMany()

        if (params.forPage) {
            items = items.filter(r => r.pages.includes(params.forPage))
        }

        return items.filter(f=> hasPermissionV2(f.permissions, 'view', context.user.permissions))
    }

    async getOneById(id: number, context: Context) {
        const rep = this.datasource.getRepository(ReportEntity)
        let item = await rep
            .createQueryBuilder()
            .where(`id = ${id} AND account_id = ${context.accountId}`)
            .getOne()

        let has = hasPermissionV1(item, 'View', context.user.permissions)
        return has ? item : null
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

    async renderByIdV2(id: number, params: RenderByIdRequestDto, context: Context) {
        let report = await this.getByIdV2(id, context)
        if (!report)
            throw "Report not found"

        return this.renderV2(report, params.params, params.output, context)
    }

    async renderV2(report: ReportV2Dto, params: any, output:  'xlsx' | 'pdf' = 'pdf', context: Context) {
        const jsreport = client(this.configService.get<string>('JSREPORT_URL'))
        //console.log(report)

        let ctx = Object.assign({}, context)
        ctx.params = params

        let settings = {
            marginTop: 40,
            marginBottom: 40,
            marginLeft: 80,
            marginRight: 40,
            format: "A4",
            landscape: false
        }
        if (report.pageSettings) {
            if (report.pageSettings.margin === 'custom') {
                settings.marginRight = report.pageSettings.marginRight
                settings.marginLeft = report.pageSettings.marginLeft
                settings.marginTop = report.pageSettings.marginTop
                settings.marginBottom = report.pageSettings.marginBottom
            }
            if (report.pageSettings.size) {
                settings.format = report.pageSettings.size
            }


            settings.landscape = report.pageSettings.layout === 'landscape'
        }

        let rep = {
            template: {
                recipe: output === 'xlsx' ? 'html-to-xlsx' : 'chrome-pdf',
                content: this.prepareHtml(report.html),
                engine: 'handlebars',
                xlsx: output === 'xlsx' ? {
                    templateAsset: {
                        content: '<table></table>{{{xlsxPrint}}}',
                    }
                } : undefined,
                chrome: settings,
                helpers: `function toUpperCase(str) { return str ? str.toUpperCase() : ""; }
                function toLowerCase(str) { return str ? str.toLowerCase() : ""; }
                function join(arr, substr) { return Array.isArray(arr) ? arr.join(substr) : ""; }`
            },
            data: await this.prepareData(report, ctx)
        }


        let rendered = await jsreport.render(rep)

        let contentType
        let filename = report.title
        switch (output) {
            case 'xlsx':
                contentType = 'application/xlsx'
                filename += '.xlsx'
                break
            case 'pdf':
                contentType = 'application/pdf'
                filename += '.pdf'
                break
            default:
                contentType = 'application/blob'
        }

        return {
            data: rendered,
            contentType: contentType,
            filename: filename,
        }
    }

    async prepareData(report: ReportV2Dto, context: any) {
        if(!report.datasets || !report.datasets.length) {
            return
        }

        let data = context
        for(let i in report.datasets) {
            let ds = report.datasets[i]

            try {
                data[ds.alias] = await this.datasourceService.getDataMany(ds.datasource, {
                    filterBy: ds.filterBy ? Mustache.render(ds.filterBy, context) : undefined,
                    sort: ds.sort ? ds.sort.map(s => `${s.alias}:${s.order}`) : undefined,
                    fields: ds.fields && ds.fields.length ? ds.fields.map(f=>f.alias) : undefined,
                    groupBy: ds.groupBy ? ds.groupBy : undefined,
                    agg: ds.groupBy ? ds.fields.filter(f=>f.aggFunc !== 'none').map(f=>{ return { field: f.alias, func: f.aggFunc}}) : undefined,
                    formatValues: true,
                    limit: 10000
                }, context)
            } catch (e) {
                console.error(e)
                throw e
            }
        }

        return data
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

    async getByIdV2(id: number, context: Context): Promise<ReportEntity | null> {
        const rep = this.datasource.getRepository(ReportEntity)
        let item = await rep
            .createQueryBuilder()
            .where(`id = :id AND account_id = :account`, {
                id: id,
                account: context.accountId
            })
            .getOne()
        return item ? item : null
    }

    async add(report: ReportV2Dto, context: Context) {
        // let reportOld = await this.getByIdV2(report.alias, context)
        // if (reportOld)
        //     throw "Alias is already exists"


        let newReport = Object.assign(new ReportEntity(), report)
        newReport.createdAt = new Date()
        newReport.createdBy = context.userId
        newReport.updatedAt = new Date()
        newReport.updatedBy = context.userId
        newReport.accountId = context.accountId
        newReport.version = 1


        let rep = this.datasource.getRepository(ReportEntity)
        let res = await rep
            .createQueryBuilder()
            .insert()
            .values(newReport)
            .execute()

        return res.raw[0].id
    }

    async updateById(id: number, report: ReportV2Dto, context: Context) {
        let reportOld = await this.getByIdV2(id, context)
        if (!reportOld)
            throw "Not found"

        let n:ReportEntity = Object.assign(reportOld, report)
        n.updatedAt = new Date()
        n.updatedBy = context.userId
        n.version++

        //console.log(n)

        let rep = this.datasource.getRepository(ReportEntity)
        await rep
            .createQueryBuilder()
            .update()
            .set(n)
            .where('account_id = :account AND id = :id', {
                account: context.accountId,
                id: n.id
            })
            .execute()
    }

    prepareHtml(html) : string {
        let matches = html.matchAll(/<table[^>]*dataset="([^"]*)"/gm)

        let datasets = []
        for (const match of matches) {
            datasets.push(match[1])
        }

        let start = html.matchAll(/(<\/th><\/tr>)(<tr><td)/gm)

        let idx = 0
        let compensation = 0
        for (const st of start) {
            let add = `{{#each ${datasets[idx]}.items}}`
            html = html.slice(0, st.index+st[1].length + compensation)
                + add + html.slice(st.index+st[1].length + compensation);
            compensation += add.length
            idx++
        }

        compensation = 0
        let end = html.matchAll(/(<\/td><\/tr>)(<\/tbody>)/gm)
        for (const st of end) {
            let add = `{{/each}}`

            html = html.slice(0, st.index + st[1].length + compensation)
                + add + html.slice(st.index + st[1].length + compensation);
            compensation += add.length
        }

        return "<style>" + style + "</style><body>" + html + "</body>"
    }
}
