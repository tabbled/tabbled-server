import {
    Body,
    Controller,
    Get, HttpCode,
    HttpException,
    HttpStatus, Param, Post, Query,
    Req,
    UseGuards,
    Version
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ReportsService } from "./reports.service";
import {
    GetReportsManyResponse,
    RenderByAliasRequestDto,
    RenderByIdResponseDto
} from "./dto/report.dto";
import * as Sentry from "@sentry/node";

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller({
    version: ['2'],
    path:"reports"
})
export class ReportsController {
    constructor(private readonly service: ReportsService) {
    }

    @UseGuards(JwtAuthGuard)
    @Version(['2'])
    @Get('/')
    @HttpCode(200)
    @ApiOperation({ summary: 'Get many reports' })
    async getMany(
        @Req() req: Request,
        @Query('page') page: string
    ): Promise<GetReportsManyResponse> {
        try {
            let resV1 = await this.service.getManyV1({ forPage: page }, req['context'])

            let items = resV1.map(f => {
                return {
                    id: f.id,
                    alias: f.alias,
                    title: f.title
                }

            })
            return {
                statusCode: 200,
                items: items
            }
        } catch (e) {
            console.error(e)
            throw new HttpException(
                {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: e.toString(),
                }, HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }

    @UseGuards(JwtAuthGuard)
    @Version(['2'])
    @Post('/:alias/render')
    @HttpCode(200)
    @ApiOperation({ summary: 'Render report by alias' })
    async renderByAlias(
        @Req() req: Request,
        @Body() body: RenderByAliasRequestDto,
        @Param('alias') alias: string
    ): Promise<RenderByIdResponseDto> {
        try {
            let rep = await this.service.renderByAlias(alias, body)
            return {
                statusCode: 200,
                contentType: rep.contentType,
                report: Buffer.from(await rep.data.body()).toString('base64'),
                filename: rep.filename,
            }
        } catch (e) {
            console.error(e)
            Sentry.captureException(e)
            throw new HttpException(
                {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: e.toString(),
                }, HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }
}