import { Injectable } from '@nestjs/common';
import {extname} from "path";
const TokenGenerator = require('uuid-token-generator');
const tokgen = new TokenGenerator(256, TokenGenerator.BASE62);
import { Client, ItemBucketMetadata } from "minio";
const sharp = require('sharp');

@Injectable()
export class PicturesService {

    constructor() {
        this.minioClient  = new Client({
            endPoint: process.env.S3_ENDPOINT,
            port: 9000,
            useSSL: false,
            accessKey: process.env.S3_ACCESS_KEY,
            secretKey: process.env.S3_SECRET_ACCESS_KEY,
        });
    }
    minioClient = null

    async getOne(name: string) {
        try {
            return {
                stat: await this.minioClient.statObject(process.env.S3_BUCKET, name),
                file: await this.minioClient.getObject(process.env.S3_BUCKET, name)
            }
        } catch (e) {
            throw e
        }

    }

    async upload(uploadFile: any) {

        let filename = ""
        try {
            filename = await this.createThumbsAndUploadAllToS3(uploadFile)
            return filename
        } catch (e) {
            throw e
        }

    }

    async createThumbsAndUploadAllToS3(file) {
        console.log('createThumbsAndUploadAllToS3', file)

        let filename = tokgen.generate() + extname(file.originalname);

        let thumb = await sharp(file.buffer)
            .resize(100)
            .toBuffer()

        let big = await sharp(file.buffer)
            .resize(500)
            .toBuffer()

        let metaData:ItemBucketMetadata = {
            'Content-Type': file.mimetype
        }

        try {
            await this.minioClient.putObject(process.env.S3_BUCKET, filename, thumb, metaData)
            await this.minioClient.putObject(process.env.S3_BUCKET, 'big/' + filename, big, metaData)
        } catch (e) {
            throw e
        }

        return filename
    }



}
