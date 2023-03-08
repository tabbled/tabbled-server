import { Controller, Post, Body, Param, HttpException, HttpStatus } from "@nestjs/common";
import { FunctionsService } from './functions.service';
import { CallFunctionDto } from './dto/call-function.dto';

@Controller('functions')
export class FunctionsController {
    constructor(private readonly functionsService: FunctionsService) {}

    @Post(':alias')
    async call(
        @Param('alias') alias: string,
        @Body() callFunctionDto: CallFunctionDto
    ) {
        //throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        try {
            return await this.functionsService.call(alias, callFunctionDto);
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
