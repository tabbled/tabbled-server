import { Controller, Post, Body, Param, HttpException, HttpStatus } from "@nestjs/common";
import { FunctionsService } from './functions.service';

@Controller('functions')
export class FunctionsController {
    constructor(private readonly functionsService: FunctionsService) {}

    @Post(':alias')
    async call(
        @Param('alias') alias: string,
        @Body() body: any
    ) {
        try {
            return await this.functionsService.call(alias, body);
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
