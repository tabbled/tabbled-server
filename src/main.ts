import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { AppModule } from './app.module';
import * as process from "process";
import * as bodyParser from 'body-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from "@sentry/profiling-node";
import { SentryFilter } from './sentry.filter';

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

    const { httpAdapter } = app.get(HttpAdapterHost);
    app.useGlobalFilters(new SentryFilter(httpAdapter));

    Sentry.init({
        dsn: process.env.SENTRY_DNS,
        environment: process.env.MODE,
        integrations: [
            // enable HTTP calls tracing
            new Sentry.Integrations.Http({ tracing: true }),
            new ProfilingIntegration(),
            new Sentry.Integrations.Express({ app: httpAdapter.getInstance() }),
            new Sentry.Integrations.Postgres()
        ],
        // Performance Monitoring
        tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!
        // Set sampling rate for profiling - this is relative to tracesSampleRate
        profilesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!
    });

    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());

    await app.listen(process.env.PORT);

    process.on('uncaughtException', (e) => {
        console.error(e)
        Sentry.captureException(e);
    });
}
bootstrap();
