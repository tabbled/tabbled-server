import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, Get, Param } from "@nestjs/common";
import { PicturesService } from './pictures.service';
import { FileInterceptor } from "@nestjs/platform-express";

@Controller('pictures')
export class PicturesController {
    constructor(private readonly picturesService: PicturesService) {}

    @Post('/upload')
    @UseInterceptors(FileInterceptor('ImageField'))
    async upload(@UploadedFile() file: Express.Multer.File) {

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
    async getOne(@Param('name') filename: string) {
        // let file = ""
        // try {
        //     file = await this.picturesService.getOne(filename);
        //     return file
        // }catch (e) {
        //     console.error(e)
        //     throw new BadRequestException
        // }
    }
}
