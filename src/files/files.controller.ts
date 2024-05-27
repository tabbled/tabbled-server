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
    Header, Req, Delete
} from "@nestjs/common";
import { FilesService } from './files.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { Request, Response } from "express";
import { ApiOperation } from '@nestjs/swagger'

@Controller('/files')
export class FilesController {
    constructor(private readonly filesService: FilesService) {}

    @Post('/')
    @ApiOperation({ summary: 'Upload a file to the S3 bucket' })
    @UseInterceptors(FileInterceptor('file'))
    async upload(@Req() req: Request, @UploadedFile() file: Express.Multer.File) {
        console.log('files.upload')

        try {
            let res = await this.filesService.upload({
                file: file,
                url: `${req.protocol}://${req.header('host')}/files`,
                host: req.header('host')
            })

            return {
                success: true,
                data: res
            }
        } catch (e) {
            console.error(e)
            throw new BadRequestException(e)
        }


    }

    @Get(':name')
    @Header('Cache-Control', 'max-age=604800')
    @ApiOperation({ summary: 'Get a file by name' })
    async getOne(@Param('name') name: string, @Res() response: Response) {
        try {
            let f = await this.filesService.getOne(name)
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

    @Delete(':name')
    @ApiOperation({ summary: 'Remove a file by name' })
    async removeOne(@Param('name') name: string) {
        console.log('files.removeOne', name)
        try {
            await this.filesService.removeByName(name)
            return {
                success: true
            }
        } catch (e) {
            console.error(e)
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
