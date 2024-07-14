import {
    Controller,
    Param,
    HttpException,
    HttpStatus,
    Get,
    UseGuards,
    Req, Version
} from "@nestjs/common";
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Request } from 'express'
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { DataSourceV2Service } from "./datasourceV2.service";
import { GetRevisionsResponseDto } from "./dto/datasourceV2.dto";
import { Context } from "../entities/context";

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller({
    version: ['1', '2'],
    path:"datasource"
})
export class DataSourceV2Controller {
    constructor(private readonly dsService: DataSourceV2Service) {}

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

    @Version(['1', '2'])
    @Get(':alias/data/:itemId/revision/:revId')
    @ApiOperation({ summary: 'Get revision from datasource item by alias by revision id' })
    async getDataMany(
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

    getContext(req: Request) : Context {
        return {
            accountId: req['accountId'],
            userId: req['userId'],
        }
    }
}
