import {
    Controller,
    Post,
    Body,
    Param,
    HttpException,
    HttpStatus,
} from '@nestjs/common'
import { FunctionsService } from './functions.service'
import { ApiOperation } from '@nestjs/swagger'
import { RunScriptDto } from "./dto/call-function.dto";

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

    @Post('script/run')
    @ApiOperation({ summary: 'Call a script with context' })
    async runScript(@Body() body: RunScriptDto) {
        try {
            let res = await this.functionsService.runScript({
                context: body.context,
                script: body.script,
                room: body.room
            })

            console.log(res)
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
}
