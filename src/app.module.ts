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
            port: Number(process.env.DB_POST),
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            autoLoadEntities: true,
            entities: [
                User,
                Account,
                AccountUsers
            ]
        }),
        AccountsModule
    ],
  controllers: [AppController],
  providers: [AppService, UsersModule],
})
export class AppModule {}
