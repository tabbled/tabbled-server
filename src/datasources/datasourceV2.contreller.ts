import {
    Body,
    Controller,
    Get, HttpCode,
    HttpException,
    HttpStatus,
    Param,
    Post, Query,
    Req,
    UseGuards,
    UseInterceptors,
    Version
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { DataSourceV2Service } from "./datasourceV2.service";
import {
    DataIndexRequestDto,
    DataIndexResponseDto,
    GetDataManyRequestDto,
    GetDataManyResponseDto,
    GetManyResponseDto,
    GetRevisionsResponseDto
} from "./dto/datasourceV2.dto";
import { Context } from "../entities/context";
import { DataSourceInterceptor } from "./datasourceV2.interceptor";

@UseGuards(JwtAuthGuard, DataSourceInterceptor)
@ApiBearerAuth()
@Controller({
    version: ['1', '2'],
    path:"datasource"
})
export class DataSourceV2Controller {
    constructor(private readonly dsService: DataSourceV2Service) {}

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(DataSourceInterceptor)
    @Version(['2'])
    @Post(':alias/data')
    @HttpCode(200)
    @ApiOperation({ summary: 'Get many data of datasource by alias' })
    async getDataMany(
        @Param('alias') alias: string,
        @Body() body: GetDataManyRequestDto,
        @Req() req: Request,
    ): Promise<GetDataManyResponseDto> {
        let config = req['datasource.config']

        if (config.source !== 'internal') {
            throw new HttpException(
                {
                    success: false,
                    statusCode: HttpStatus.BAD_REQUEST,
                    error: `DataSource ${alias} is not an internal source`
                }, HttpStatus.BAD_REQUEST)
        }

        let res
        try {
             res = await this.dsService.getDataMany({
                ...body,
                dataSourceConfig: config
            }, this.getContext(req))
        } catch (e) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: e.toString(),
                }, HttpStatus.INTERNAL_SERVER_ERROR
            )
        }




        return {
            statusCode: 200,
            ...res
        }
    }

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(DataSourceInterceptor)
    @Version(['2'])
    @Post(':alias/data/index')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Index data source data into search engine,' +
            'if you need to reindex the all of the data. ' +
            'Platform automatically index when data changes.' })
    async dataReindex(
        @Param('alias') alias: string,
        @Body() body: DataIndexRequestDto,
        @Req() req: Request,
    ): Promise<DataIndexResponseDto> {

        let config = req['datasource.config']
        if (config.source !== 'internal') {
            throw new HttpException(
                {
                    success: false,
                    statusCode: HttpStatus.BAD_REQUEST,
                    error: `DataSource ${alias} is not an internal source`
                }, HttpStatus.BAD_REQUEST)
        }

        try {
            let result = await this.dsService.dataReindex({
                dataSourceConfig: config,
                ids: body.ids
            }, this.getContext(req))

            return {
                statusCode: HttpStatus.CREATED,
                jobId: result.jobId
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
    @UseInterceptors(DataSourceInterceptor)
    @Version(['1', '2'])
    @Get(':alias/data/:itemId/revision')
    @ApiOperation({ summary: 'Get revisions list from datasource item by alias' })
    async getRevisions(
        @Param('alias') alias: string,
        @Param('itemId') itemId: string,
        @Req() req: Request
    ): Promise<GetRevisionsResponseDto> {
        try {
            return await this.dsService.getRevisions({
                    dataSourceAlias: alias,
                    itemId: itemId
                }, this.getContext(req))
        } catch (e) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: e.toString(),
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(DataSourceInterceptor)
    @Version(['1', '2'])
    @Get(':alias/data/:itemId/revision/:revId')
    @ApiOperation({ summary: 'Get revision from datasource item by alias by revision id' })
    async getRevisionById(
        @Param('alias') alias: string,
        @Param('itemId') itemId: string,
        @Param('revId') revId: number,
        @Req() req: Request
    ): Promise<GetRevisionsResponseDto> {
        try {
            return await this.dsService.getRevisionById({
                dataSourceAlias: alias,
                itemId: itemId,
                revisionId: revId
            }, this.getContext(req))
        } catch (e) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: e.toString(),
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }

    @UseGuards(JwtAuthGuard)
    @Version(['1'])
    @Get('')
    @HttpCode(200)
    @ApiOperation({ summary: 'Get many datasource' })
    async getMany(
        @Body() body: GetDataManyRequestDto,
        @Req() req: Request,
    ): Promise<GetManyResponseDto> {
        try {
            let items = await this.dsService.getManyV1()
            return {
                statusCode: 200,
                items: items.items,
                count: items.count
            }
        } catch (e) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: e.toString(),
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(DataSourceInterceptor)
    @Version(['2'])
    @Get(':alias/fields')
    @HttpCode(200)
    @ApiOperation({ summary: 'Get all fields of datasource' })
    async getFieldsMany(
        @Param('alias') alias: string,
        @Query('nested') nested: boolean,
        @Req() req: Request,
    ): Promise<GetDataManyResponseDto> {
        try {
            let items = await this.dsService.getFieldsMany({datasource: alias, nested: nested}, this.getContext(req))
            return {
                statusCode: 200,
                items: items.items,
                count: items.count
            }
        } catch (e) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: e.toString(),
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }

    getContext(req: Request) : Context {
        return {
            accountId: req['accountId'],
            userId: req['userId'],
        }
    }
}
