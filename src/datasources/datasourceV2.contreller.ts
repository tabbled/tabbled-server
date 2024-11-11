import {
    Body,
    Controller, Delete,
    Get, HttpCode,
    HttpException,
    HttpStatus,
    Param,
    Post, Put, Query,
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
    DeleteDataSourceDataRequestDto, ExportDataRequestDto,
    GetDataManyRequestDto,
    GetDataManyResponseDto,
    GetManyResponseDto,
    GetRevisionsResponseDto, GetTotalDataManyRequestDto,
    GetTotalsResponseDto,
    InsertDataSourceRequestDto,
    InsertDataSourceResponseDto,
    UpsertDataSourceDataRequestDto,
    UpsertDataSourceDataResponseDto
} from "./dto/datasourceV2.dto";
import { Context } from "../entities/context";
import { DataSourceInterceptor } from "./datasourceV2.interceptor";
import {ResponseDto} from "../common/dto/response"

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
        let res
        try {
             res = await this.dsService.getDataMany(alias, body, this.getContext(req))
        } catch (e) {
            console.error(e)
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
    @Post(':alias/data/totals')
    @HttpCode(200)
    @ApiOperation({ summary: 'Get aggregated totals of data of datasource by alias' })
    async getDataTotal(
        @Param('alias') alias: string,
        @Body() body: GetTotalDataManyRequestDto,
        @Req() req: Request,
    ): Promise<GetTotalsResponseDto> {
        let res
        try {
            res = await this.dsService.getTotals(alias, body, this.getContext(req))
            return {
                statusCode: 200,
                ...res
            }
        } catch (e) {
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
    @Version(['2'])
    @Post(':alias/data/export')
    @HttpCode(200)
    @ApiOperation({ summary: 'Export all data of datasource by alias' })
    async exportData(
        @Param('alias') alias: string,
        @Body() body: ExportDataRequestDto,
        @Req() req: Request,
    ): Promise<GetTotalsResponseDto> {
        let res
        try {
            res = await this.dsService.exportData(alias, body, this.getContext(req))
            return {
                statusCode: 200,
                ...res
            }
        } catch (e) {
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

        let config = await this.dsService.getConfigByAlias(alias, true)
        if (config.type !== 'internal' && config.type !== 'internal-db') {
            throw new HttpException(
                {
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
    @Version(['2'])
    @Get('')
    @HttpCode(200)
    @ApiOperation({ summary: 'Get many datasource' })
    async getManyV2(
        @Body() body: GetDataManyRequestDto,
        @Req() req: Request,
    ): Promise<GetManyResponseDto> {
        try {
            let items = await this.dsService.getManyV2(this.getContext(req))
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

            let items = await this.dsService.getFieldsMany({datasource: alias, nested: nested})
            return {
                statusCode: 200,
                items: items.items,
                count: items.count
            }
        } catch (e) {
            console.error(e)
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
    @Version(['2'])
    @Post('')
    @HttpCode(200)
    @ApiOperation({ summary: 'Insert a new datasource' })
    async insertDataSource(
        @Req() req: Request,
        @Body() body: InsertDataSourceRequestDto
    ): Promise<InsertDataSourceResponseDto> {
        if (body.type === 'internal')
            throw new HttpException(
                {
                    statusCode: HttpStatus.NOT_ACCEPTABLE,
                    error: "Datasource with internal type is not allowed in api v2",
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        try {
            let data = await this.dsService.insertDataSource(body, this.getContext(req))

            return {
                id: data.id,
                statusCode: HttpStatus.OK
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
    @Version(['2'])
    @Put('/:alias')
    @HttpCode(200)
    @UseInterceptors(DataSourceInterceptor)
    @ApiOperation({ summary: 'Update datasource by alias' })
    async updateDataSource(
        @Req() req: Request,
        @Param('alias') alias: string,
        @Body() body: InsertDataSourceRequestDto
    ): Promise<InsertDataSourceResponseDto> {
        let config = await this.dsService.getConfigByAlias(alias)
        if (config.type !== 'internal-db')
            throw new HttpException(
                {
                    statusCode: HttpStatus.NOT_ACCEPTABLE,
                    error: "Datasource with type internal-db only allowed to update in api v2",
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        try {
            let data = await this.dsService.updateDataSource(alias, body, this.getContext(req))
            return {
                id: data.id,
                statusCode: HttpStatus.OK
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
    @Version(['2'])
    @Put('/:alias/data')
    @HttpCode(200)
    @UseInterceptors(DataSourceInterceptor)
    @ApiOperation({ summary: 'Update items in datasource' })
    async upsertDataSourceItems(
        @Req() req: Request,
        @Param('alias') alias: string,
        @Body() body: UpsertDataSourceDataRequestDto
    ): Promise<UpsertDataSourceDataResponseDto> {
        let config = await this.dsService.getConfigByAlias(alias)
        if (config.type !== 'internal-db')
            throw new HttpException(
                {
                    statusCode: HttpStatus.NOT_ACCEPTABLE,
                    error: "Datasource with type internal-db only allowed to update items in api v2",
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        try {
            let data = await this.dsService.upsertDataSourceItems(alias, body, this.getContext(req))
            return {
                statusCode: HttpStatus.OK,
                items: data
            }
        } catch (e) {
            if (e instanceof Object) {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: e,
                    },
                    HttpStatus.BAD_REQUEST
                )
            } else
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
    @Version(['2'])
    @Delete('/:alias/data')
    @HttpCode(200)
    @UseInterceptors(DataSourceInterceptor)
    @ApiOperation({ summary: 'Delete items in datasource by id or condition' })
    async deleteDataSourceItems(
        @Req() req: Request,
        @Param('alias') alias: string,
        @Body() body: DeleteDataSourceDataRequestDto
    ): Promise<ResponseDto> {
        let config = await this.dsService.getConfigByAlias(alias)
        if (config.type !== 'internal-db')
            throw new HttpException(
                {
                    statusCode: HttpStatus.NOT_ACCEPTABLE,
                    error: "Datasource with type internal-db only allowed to delete items in api v2",
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        try {
            await this.dsService.deleteDataSourceItems(alias, body, this.getContext(req))
            return {
                statusCode: HttpStatus.OK
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
