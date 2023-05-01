import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Get,
    Param,
    HttpException, HttpStatus, Res
} from "@nestjs/common";
import { PicturesService } from './pictures.service';
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";

@Controller('pictures')
export class PicturesController {
    constructor(private readonly picturesService: PicturesService) {}

    @Post('')
    @UseInterceptors(FileInterceptor('file'))
    async upload(@UploadedFile() file: Express.Multer.File) {
        console.log('/pictures upload')

        let filename = ""
        try {
            filename = await this.picturesService.upload(file);
        }catch (e) {
            console.error(e)
            throw new BadRequestException
        }

        return {
            filename: filename
        }
    }

    @Get(':name')
    async getOne(
        @Param('name') name: string,
        @Res() response:Response
    ) {
        try {
            let f = await this.picturesService.getOne(name)
            response.setHeader('Content-Type', f.stat.metaData['content-type'])
            response.setHeader('Origin-Filename', f.stat.metaData['origin-filename'])
            return f.file.pipe(response);
        }
        catch (e) {
            console.error(e.toString())
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: e.toString(),
            }, HttpStatus.INTERNAL_SERVER_ERROR, {
                cause: e.toString()
            });
        }
    }
}
