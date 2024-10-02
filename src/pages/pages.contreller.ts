import {
    Body,
    Controller,
    Get, HttpCode,
    HttpException,
    HttpStatus,
    Param, Patch,
    Req,
    UseGuards,
    Version
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";

import { Context } from "../entities/context";
import { PagesService } from "./pages.service";
import { GetByAliasResponseDto, GetManyResponseDto, PageInterface } from "./dto/pages.dto";

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller({
    version: ['2'],
    path:"pages"
})
export class PagesController {
    constructor(private readonly pagesService: PagesService) {
    }

    @UseGuards(JwtAuthGuard)
    @Version(['2'])
    @Get('/')
    @HttpCode(200)
    @ApiOperation({ summary: 'Get many pages' })
    async getMany(
        @Req() req: Request,
    ): Promise<GetManyResponseDto> {

        try {
            return {
                statusCode: 200,
                pages: await this.pagesService.getMany(this.getContext(req))
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
    @Get('/:alias')
    @HttpCode(200)
    @ApiOperation({ summary: 'Get page by alias' })
    async getByAlias(
        @Req() req: Request,
        @Param('alias') alias: string,
    ): Promise<GetByAliasResponseDto> {

        let res
        try {
            res = await this.pagesService.getOneByAlias(alias, this.getContext(req))

            if (!res) {
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    error: `Page by alias ${alias} not found`
                }
            }

            return {
                statusCode: 200,
                page: res
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
    @Patch('/:id')
    @HttpCode(200)
    @ApiOperation({ summary: 'Patch page parameters by page id' })
    async patchByAlias(
        @Req() req: Request,
        @Param('id') id: number,
        @Body() body: PageInterface
    ): Promise<GetByAliasResponseDto> {

        try {
            await this.pagesService.updateById(id, body, this.getContext(req))

            return {
                statusCode: 200,
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

    getContext(req: Request) : Context {
        return {
            accountId: req['accountId'],
            userId: req['userId'],
        }
    }
}