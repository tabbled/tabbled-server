import { Controller, Param, HttpException, HttpStatus, Get, UseGuards, Req } from "@nestjs/common";
import { DataSourcesService } from './datasources.service';
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('datasources')
export class DataSourcesController {
    constructor(private readonly dsService: DataSourcesService) {}

    @Get(':alias/data')
    async getDataMany(
        @Param('alias') alias: string,
        @Req() req: Request
    ) {
        try {
            let ds = await this.dsService.getByAlias(alias, {
                accountId: req['accountId'],
                userId: req['userId']
            })


            let data = ds.getMany()

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
}