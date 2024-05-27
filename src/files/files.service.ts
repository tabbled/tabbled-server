import { Injectable } from '@nestjs/common'
import { extname } from 'path'
const TokenGenerator = require('uuid-token-generator')
const tokgen = new TokenGenerator(256, TokenGenerator.BASE62)
import { Client, ItemBucketMetadata } from 'minio'

export class UploadRequestDto {
    file: Express.Multer.File
    url: string
    host: string
}

@Injectable()
export class FilesService {
    constructor() {
        this.minioClient = new Client({
            endPoint: process.env.S3_ENDPOINT,
            port: Number(process.env.S3_PORT),
            useSSL: !!Number(process.env.S3_USE_SSL),
            accessKey: process.env.S3_ACCESS_KEY,
            secretKey: process.env.S3_SECRET_ACCESS_KEY,
        })
    }
    minioClient = null

    async getOne(name: string) {
        let path = process.env.S3_FILES_PATH
        let filename = path ? path + '/' + name : name

        try {
            return {
                stat: await this.minioClient.statObject(
                    process.env.S3_BUCKET,
                    filename
                ),
                file: await this.minioClient.getObject(
                    process.env.S3_BUCKET,
                    filename
                ),
            }
        } catch (e) {
            console.error(e)
            throw e
        }
    }

    async upload(params: UploadRequestDto) {
        try {
            let filename = tokgen.generate() + extname(params.file.originalname)

            let path = process.env.S3_FILES_PATH

            console.log(params.file)


            let metaData: ItemBucketMetadata = {
                'Content-Type': params.file.mimetype,
                'Origin-Filename': encodeURIComponent(params.file.originalname),
                'Host': params.host
            }

            await this.minioClient.putObject(
                process.env.S3_BUCKET,
                path ? path + '/' + filename : filename,
                params.file.buffer,
                metaData
            )

            return {
                filename: filename,
                url: params.url + '/' + filename,
                contentType: params.file.mimetype,
                name: params.file.originalname,
                extname: extname(params.file.originalname).replace('.', ''),
                size: params.file.size
            }
        } catch (e) {
            console.error(e)
            throw e
        }
    }

    async removeByName(name: string) {
        let path = process.env.S3_FILES_PATH
        let filename = path ? path + '/' + name : name

        try {
            return  await this.minioClient.removeObject(
                process.env.S3_BUCKET,
                filename
            )
        } catch (e) {
            console.error('error', e)
            throw e
        }
    }
}
