import {
    Controller,
    Param,
    HttpException,
    HttpStatus,
    Get,
    UseGuards,
    Req,
    Post,
    Body,
    HttpCode,
    Put,
    Delete,
} from '@nestjs/common'
import { DataSourcesService } from './datasources.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Request } from 'express'
import {
    ExportParams,
    GetManyResponse,
    ImportDataDto,
    InsertDataDto,
    UpdateDataByIdDto,
} from './dto/datasource.dto'
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger'

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('datasources')
export class DataSourcesController {
    constructor(private readonly dsService: DataSourcesService) {}

    @Get(':alias/data')
    @ApiOperation({ summary: 'Get data from datasource by alias' })
    async getDataMany(
        @Param('alias') alias: string,
        @Req() req: Request
    ): Promise<GetManyResponse> {
        try {
            let ds = await this.dsService.getByAlias(alias, {
                accountId: req['accountId'],
                userId: req['userId'],
            })

            return await ds.getMany()
        } catch (e) {
            throw new HttpException(
                {
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: e.toString(),
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
                {
                    cause: e.toString(),
                }
            )
        }
    }

    @Post(':alias/data/import')
    @ApiOperation({ summary: 'Import data to datasource by alias' })
    @HttpCode(200)
    async call(
        @Param('alias') alias: string,
        @Body() body: ImportDataDto,
        @Req() req: Request
    ) {
        try {
            let total = await this.dsService.importData(
                alias,
                body.data,
                body.options,
                {
                    accountId: req['accountId'],
                    userId: req['userId'],
                }
            )

            return {
                success: true,
                total: total,
            }
        } catch (e) {
            console.error(e)
            throw new HttpException(
                {
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: e.toString(),
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
                {
                    cause: e.toString(),
                }
            )
        }
    }

    @Post(':alias/data')
    @ApiOperation({ summary: 'Insert item to datasource by alias' })
    @HttpCode(200)
    async add(
        @Param('alias') alias: string,
        @Body() body: InsertDataDto,
        @Req() req: Request
    ) {
        try {
            await this.dsService.insertData(
                alias,
                body.value,
                {
                    accountId: req['accountId'],
                    userId: req['userId'],
                },
                body.id,
                body.parentId
            )

            return {
                success: true,
            }
        } catch (e) {
            console.error(e)
            throw new HttpException(
                {
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: e.toString(),
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
                {
                    cause: e.toString(),
                }
            )
        }
    }

    @Put(':alias/data')
    @ApiOperation({ summary: 'Update item in datasource by alias' })
    @HttpCode(200)
    async update(
        @Param('alias') alias: string,
        @Body() body: UpdateDataByIdDto,
        @Req() req: Request
    ) {
        try {
            await this.dsService.updateDataById(
                alias,
                body.id,
                body.value,
                {
                    accountId: req['accountId'],
                    userId: req['userId'],
                },
                body.route
            )

            return {
                success: true,
            }
        } catch (e) {
            console.error(e)
            throw new HttpException(
                {
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: e.toString(),
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
                {
                    cause: e.toString(),
                }
            )
        }
    }

    @Post(':alias/data/export')
    @ApiOperation({ summary: 'Export data from datasource by alias' })
    @HttpCode(200)
    async exportData(
        @Param('alias') alias: string,
        @Body() body: ExportParams,
        @Req() req: Request
    ) {
        try {
            let file = await this.dsService.exportData(alias, body, {
                accountId: req['accountId'],
                userId: req['userId'],
            })

            return {
                success: true,
                data: file,
            }
        } catch (e) {
            console.error(e)
            throw new HttpException(
                {
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: e.toString(),
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
                {
                    cause: e.toString(),
                }
            )
        }
    }

    @Delete(':alias/data/:id')
    @ApiOperation({ summary: 'Delete item by id from datasource by alias' })
    @HttpCode(200)
    async remove(
        @Param('alias') alias: string,
        @Param('id') id: string,
        @Req() req: Request
    ) {
        try {
            await this.dsService.removeDataById(alias, id, {
                accountId: req['accountId'],
                userId: req['userId'],
            })

            return {
                success: true,
            }
        } catch (e) {
            console.error(e)
            throw new HttpException(
                {
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: e.toString(),
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
                {
                    cause: e.toString(),
                }
            )
        }
    }
}
