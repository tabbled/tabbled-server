import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsGateway } from './reports.gateway';
import { ConfigModule, ConfigService } from "@nestjs/config";
import { FunctionsModule } from "../functions/functions.module";
import { FunctionsService } from "../functions/functions.service";
import { DataSourcesModule } from "../datasources/datasources.module";

@Module({
    providers: [ReportsGateway, ReportsService, ConfigService, FunctionsService],
    imports: [ConfigModule, FunctionsModule, DataSourcesModule]
})
export class ReportsModule {}
