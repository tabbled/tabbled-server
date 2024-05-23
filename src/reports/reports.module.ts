import { Module } from '@nestjs/common'
import { ReportsService } from './reports.service'
import { ReportsGateway } from './reports.gateway'
import { ConfigModule } from '@nestjs/config'
import { FunctionsModule } from '../functions/functions.module'
import { DataSourcesModule } from '../datasources/datasources.module'
import { UsersModule } from '../users/users.module'

@Module({
    providers: [ReportsGateway, ReportsService],
    imports: [ConfigModule, FunctionsModule, DataSourcesModule, UsersModule],
    exports: [ReportsService],
})
export class ReportsModule {}
