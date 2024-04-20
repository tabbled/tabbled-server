import {
    Controller,
    Param,
    HttpException,
    HttpStatus,
    UseGuards,
    Req,
    Post,
    Body,
    HttpCode
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ConfigService } from "./config.service";
import { ConfigImportDto } from "./dto/request.dto";

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('config')
export class ConfigController {
    constructor(private readonly configService: ConfigService) {}

    @Post('import')
    @ApiOperation({ summary: 'Import config and data' })
    @HttpCode(200)
    async call(
        @Param('alias') alias: string,
        @Body() body: ConfigImportDto,
        @Req() req: Request
    ) {
        try {
            await this.configService.import(body, req['userId'])

            return {
                success: true
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