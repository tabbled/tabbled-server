import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AccountUsers, User } from "./users/entities/user.entity";
import { AccountsModule } from './accounts/accounts.module';
import { Account } from "./accounts/entities/account.entity"
import { DataItemModule } from './dataitem/dataitem.module';
import { DataItem, Revision } from "./dataitem/entities/dataitem.entity";
import { ConfigModule as ConfigItemModule } from './config/config.module';
import { ConfigItem, ConfigRevision } from "./config/entities/config.entity";
import { FunctionsModule } from './functions/functions.module';
import { PicturesModule } from './pictures/pictures.module';

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
                ConfigRevision
            ]
        }),
        AccountsModule,
        DataItemModule,
        ConfigItemModule,
        FunctionsModule,
        PicturesModule
    ],
  controllers: [AppController],
  providers: [AppService, UsersModule],
})
export class AppModule {}
