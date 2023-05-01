import { Module } from '@nestjs/common';
import { DataSourcesService } from './datasources.service';
import { DataSourcesGateway } from './datasources.gateway';
import { BullModule } from "@nestjs/bull";

@Module({
    providers: [DataSourcesGateway, DataSourcesService],
    imports: [
        BullModule.registerQueue({
            name: "functions"
        })
    ]
})
export class DataSourcesModule {}
