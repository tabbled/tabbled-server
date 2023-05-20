import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsGateway } from './reports.gateway';
import { ConfigService } from "../config/config.service";

@Module({
    providers: [ReportsGateway, ReportsService, ConfigService]
})
export class ReportsModule {}
