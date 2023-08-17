import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from "process";
import * as bodyParser from 'body-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    app.use(bodyParser.json({limit: '50mb'}));
    app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

    const config = new DocumentBuilder()
        .setTitle('Tabbled')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    await app.listen(process.env.PORT);

    process.on('uncaughtException', (e) => {
        console.error(e)
    });
}
bootstrap();
