import { Module } from '@nestjs/common';
import { DataIndexerService } from './data-indexer.service';
import { IndexerConsumer } from "./data-indexer.processor";
import { BullModule } from "@nestjs/bullmq";
import { ConfigModule } from "@nestjs/config";

@Module({
    imports: [
        ConfigModule,
        BullModule.registerQueue({
            name: 'datasource-data-indexing',
        }),
    ],
    controllers: [],
    providers: [DataIndexerService, IndexerConsumer],
})
export class DataIndexerModule {}
