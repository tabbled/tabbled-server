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
    HttpCode
} from "@nestjs/common";
import { DataSourcesService } from './datasources.service';
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from 'express';
import { ImportDataDto } from "./dto/datasource.dto";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";

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
    ) {
        try {
            let ds = await this.dsService.getByAlias(alias, {
                accountId: req['accountId'],
                userId: req['userId']
            })


            let data = await ds.getMany()

            return {
                data: data
            }

        } catch (e) {
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: e.toString(),
            }, HttpStatus.INTERNAL_SERVER_ERROR, {
                cause: e.toString()
            });
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
            let total = await this.dsService.importData(alias, body.data, body.options, {
                accountId: req['accountId'],
                userId: req['userId']
            })

            return {
                success: true,
                total: total
            }
        } catch (e) {
            console.error(e)
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: e.toString(),
            }, HttpStatus.INTERNAL_SERVER_ERROR, {
                cause: e.toString()
            });
        }
    }
}