import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Get,
    Param,
    HttpException,
    HttpStatus,
    Res,
    Header,
} from '@nestjs/common'
import { PicturesService } from './pictures.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { Response } from 'express'
import { ApiOperation } from '@nestjs/swagger'

@Controller('pictures')
export class PicturesController {
    constructor(private readonly picturesService: PicturesService) {}

    @Post('')
    @ApiOperation({ summary: 'Upload a picture to the S3 bucket' })
    @UseInterceptors(FileInterceptor('file'))
    async upload(@UploadedFile() file: Express.Multer.File) {
        console.log('/pictures upload')

        let filename = ''
        try {
            filename = await this.picturesService.upload(file)
        } catch (e) {
            console.error(e)
            throw new BadRequestException()
        }

        return {
            filename: filename,
        }
    }

    @Get(':name')
    @Header('Cache-Control', 'max-age=604800')
    @ApiOperation({ summary: 'Get a thumb picture by name' })
    async getOne(@Param('name') name: string, @Res() response: Response) {
        try {
            let f = await this.picturesService.getOne(name)
            let md = f.stat.metaData || {}
            response.setHeader(
                'Content-Type',
                md['content-type'] ? md['content-type'] : 'application/png'
            )
            response.setHeader(
                'Origin-Filename',
                md['origin-filename'] ? md['origin-filename'] : ''
            )
            return f.file.pipe(response)
        } catch (e) {
            console.error(e.toString())
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

    @Get(':name/big')
    @Header('Cache-Control', 'max-age=604800')
    @ApiOperation({ summary: 'Get a big picture by name' })
    async getOneFull(@Param('name') name: string, @Res() response: Response) {
        try {
            let f = await this.picturesService.getOne('big/' + name)
            let md = f.stat.metaData || {}
            response.setHeader(
                'Content-Type',
                md['content-type'] ? md['content-type'] : 'application/png'
            )
            response.setHeader(
                'Origin-Filename',
                md['origin-filename'] ? md['origin-filename'] : ''
            )
            return f.file.pipe(response)
        } catch (e) {
            console.error(e.toString())
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
}
