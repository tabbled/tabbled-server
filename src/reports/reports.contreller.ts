import {
    Body,
    Controller,
    Get, HttpCode,
    HttpException,
    HttpStatus, Param, Post, Query,
    Req, Res,
    UseGuards,
    Version
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request, Response } from "express";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ReportsService } from "./reports.service";
import {
    AddReportResponse, GetOneByAliasDto, GetParamsByAliasDto,
    GetReportsManyResponse, PreviewRequestDto,
    RenderByIdRequestDto, RenderByIdResponseDto,
    RenderReportResponseDto, ReportV2Dto
} from "./dto/report.dto";
import { ResponseDto } from "../common/dto/response";

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
            let resV1 = await this.service.getManyV2({ forPage: page }, req['context'])

            let items = resV1.map(f => {
                return {
                    id: f.id,
                    title: f.title,
                    description: f.description
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
    @Get('/:id')
    @HttpCode(200)
    @ApiOperation({ summary: 'Get report by alias' })
    async getOneByAlias(
        @Req() req: Request,
        @Res() res: Response,
        @Param('id') id: number
    ): Promise<GetOneByAliasDto> {
        try {
            let item = await this.service.getOneById(id, req['context'])
            if (!item) {
                res.statusCode = HttpStatus.NOT_FOUND
                return res.send( {
                    statusCode: HttpStatus.NOT_FOUND,
                    report: undefined,
                    error: "Report by alias not found"
                })
            }

            return res.send({
                statusCode: HttpStatus.OK,
                report: item
            })
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
    @Get('/:id/params')
    @HttpCode(200)
    @ApiOperation({ summary: 'Get report by alias' })
    async getParamsByAlias(
        @Req() req: Request,
        @Param('id') id: number,
        @Res() res: Response
    ): Promise<GetParamsByAliasDto> {
        try {
            let item = await this.service.getOneById(id, req['context'])

            if (!item) {
                res.statusCode = HttpStatus.NOT_FOUND
                return res.send({
                    statusCode: HttpStatus.NOT_FOUND,
                    report: undefined,
                    error: "Report by alias not found"
                })
            }


            return res.send({
                statusCode: HttpStatus.OK,
                report: {
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    parameters: item.parameters,
                }
            })
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
    @Version(['1'])
    @Get('/')
    @HttpCode(200)
    @ApiOperation({ summary: 'Get many reports' })
    async getManyV1(
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
    @Post('/:id/render')
    @HttpCode(200)
    @ApiOperation({ summary: 'Render report by id' })
    async renderByAlias(
        @Req() req: Request,
        @Body() body: RenderByIdRequestDto,
        @Param('id') id: number
    ): Promise<RenderByIdResponseDto> {
        try {
            let rep = await this.service.renderByIdV2(id, body, req['context'])
            return {
                statusCode: 200,
                contentType: rep.contentType,
                report: Buffer.from(await rep.data.body()).toString('base64'),
                filename: rep.filename,
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
    @Post('/preview')
    @HttpCode(200)
    @ApiOperation({ summary: 'Preview report' })
    async preview(
        @Req() req: Request,
        @Body() body: PreviewRequestDto
    ): Promise<RenderReportResponseDto> {
        try {
            let rep = await this.service.renderV2(body.report, body.params, body.output, req['context'])
            return {
                statusCode: 200,
                contentType: rep.contentType,
                report: Buffer.from(await rep.data.body()).toString('base64'),
                filename: rep.filename,
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
    @Post('')
    @HttpCode(200)
    @ApiOperation({ summary: 'Add new report' })
    async add(
        @Req() req: Request,
        @Body() body: ReportV2Dto
    ): Promise<AddReportResponse> {
        try {
            let id = await this.service.add(body, req['context'])
            return {
                statusCode: 200,
                id: id
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
    @Post('/:id')
    @HttpCode(200)
    @ApiOperation({ summary: 'Update report by id' })
    async updateByAlias(
        @Req() req: Request,
        @Body() body: ReportV2Dto,
        @Param('id') id: number
    ): Promise<ResponseDto> {
        try {
            await this.service.updateById(id, body, req['context'])
            return {
                statusCode: 200
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
}