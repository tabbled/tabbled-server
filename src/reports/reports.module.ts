import { Module } from "@nestjs/common";
import { ReportsService } from './reports.service';
import { ReportsGateway } from './reports.gateway';
import { ConfigModule, ConfigService } from "@nestjs/config";
import { FunctionsModule } from "../functions/functions.module";
import { FunctionsService } from "../functions/functions.service";
import { DataSourcesModule } from "../datasources/datasources.module";
import { UsersModule } from "../users/users.module";
import { UsersService } from "../users/users.service";

@Module({
    providers: [ReportsGateway, ReportsService, ConfigService, FunctionsService, UsersService],
    imports: [ConfigModule, FunctionsModule, DataSourcesModule, UsersModule]
})
export class ReportsModule {}
