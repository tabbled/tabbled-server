import {
    Controller,
    Post,
    Body,
    Param,
    HttpException,
    HttpStatus, Req, UseGuards
} from "@nestjs/common";
import { FunctionsService } from './functions.service'
import { ApiOperation } from '@nestjs/swagger'
import { RunScriptDto } from "./dto/call-function.dto";
import { Request } from "express";
import { Context } from "../entities/context";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller('functions')
export class FunctionsController {
    constructor(private readonly functionsService: FunctionsService) {}

    @Post(':alias')
    @ApiOperation({ summary: 'Call a function by alias' })
    async call(@Param('alias') alias: string, @Body() body: any) {
        try {
            let res = await this.functionsService.callByAlias(alias, body)

            return {
                success: true,
                data: res,
            }
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

    @UseGuards(JwtAuthGuard)
    @Post('script/run')
    @ApiOperation({ summary: 'Call a script with context' })
    async runScript(@Req() req: Request,
                    @Body() body: RunScriptDto) {
        try {
            console.log(this.getContext(req))
            let res = await this.functionsService.runScript({
                context: Object.assign(this.getContext(req), body.context),
                script: body.script,
                room: body.room
            })

            return {
                success: true,
                data: res,
            }
        } catch (e) {
            return {
                success: false,
                error: e.toString()
            }
        }
    }

    getContext(req: Request) : Context {
        return {
            accountId: req['accountId'],
            userId: req['userId'],
        }
    }
}
