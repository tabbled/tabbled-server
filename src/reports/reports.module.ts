import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsGateway } from './reports.gateway';
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
    providers: [ReportsGateway, ReportsService, ConfigService],
    imports: [ConfigModule]
})
export class ReportsModule {}
