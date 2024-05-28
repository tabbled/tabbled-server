import { Injectable } from '@nestjs/common'
import { extname } from 'path'
const TokenGenerator = require('uuid-token-generator')
const tokgen = new TokenGenerator(256, TokenGenerator.BASE62)
import { Client, ItemBucketMetadata } from 'minio'
const sharp = require('sharp')

export type ImageSize = 'tiny' | 'small' | 'big' | 'original'

@Injectable()
export class PicturesService {
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

    async getOne(name: string, size: ImageSize = 'small') {
        let path = process.env.S3_PICTURES_PATH ? process.env.S3_PICTURES_PATH + '/' + size : size
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
            throw e
        }
    }

    async upload(uploadFile: any) {
        console.log('picturesService.upload', uploadFile)

        let filename = tokgen.generate() + extname(uploadFile.originalname)

        try {
            await this.resizeAndUpload(filename, uploadFile, 'original')
            await this.resizeAndUpload(filename, uploadFile, 'tiny')
            await this.resizeAndUpload(filename, uploadFile, 'small')
            await this.resizeAndUpload(filename, uploadFile, 'big')
        } catch (e) {
            throw e
        }
        return filename
    }


    async resizeAndUpload(name: string, file, size: ImageSize) {

        let width
        switch (size) {
            case "tiny": width = 32; break;
            case "small": width = 100; break;
            case "big": width = 500; break;
            case "original": width = -1; break
        }

        let image = width !== -1
            ? await sharp(file.buffer).resize(width).toBuffer()
            : file.buffer

        let metaData: ItemBucketMetadata = {
            'Content-Type': file.mimetype,
        }


        let path = process.env.S3_PICTURES_PATH ? process.env.S3_PICTURES_PATH + '/' + size : size
        let filename = path ? path + '/' + name : name

        await this.minioClient.putObject(
            process.env.S3_BUCKET,
            filename,
            image,
            metaData
        )
    }

    async removeByName(name: string) {
        try {
            await this.removeBySize(name, 'tiny')
            await this.removeBySize(name, 'small')
            await this.removeBySize(name, 'big')
            await this.removeBySize(name, 'original')
        } catch (e) {
            console.error('error', e)
            throw e
        }
    }

    async removeBySize(name: string, size: ImageSize) {
        let path = process.env.S3_PICTURES_PATH ? process.env.S3_PICTURES_PATH + '/' + size : size
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
