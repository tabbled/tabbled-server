import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UsersModule } from './users/users.module'
import { AuthModule } from './auth/auth.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
import { AccountUsers, User } from './users/entities/user.entity'
import { Account } from './accounts/entities/account.entity'
import { DataItem, Revision } from './datasources/entities/dataitem.entity'
import { ConfigModule as ConfigItemModule } from './config/config.module'
import {
    ConfigItem,
    ConfigParam,
    ConfigRevision,
} from './config/entities/config.entity'
import { FunctionsModule } from './functions/functions.module'
import { PicturesModule } from './pictures/pictures.module'
import { DataSourcesModule } from './datasources/datasources.module'
import { BullModule } from '@nestjs/bull'
import { SettingsModule } from './settings/settings.module'
import { ReportsModule } from './reports/reports.module'
import { AggregationsModule } from './aggregations/aggregations.module'
import {
    AggregationHistory,
    AggregationMovement,
} from './aggregations/entities/aggregation.entity'

@Module({
    imports: [
        UsersModule,
        AuthModule,
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            autoLoadEntities: true,
            entities: [
                User,
                Account,
                AccountUsers,
                Revision,
                DataItem,
                ConfigItem,
                ConfigRevision,
                ConfigParam,
                AggregationHistory,
                AggregationMovement,
            ],
        }),
        BullModule.forRoot({
            redis: {
                host: process.env.REDIS_HOST,
                port: Number(process.env.REDIS_PORT),
            },
        }),
        ConfigItemModule,
        FunctionsModule,
        PicturesModule,
        DataSourcesModule,
        SettingsModule,
        ReportsModule,
        AggregationsModule,
    ],
    controllers: [AppController],
    providers: [AppService],
    exports: [],
})
export class AppModule {}
