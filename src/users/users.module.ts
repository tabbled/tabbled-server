import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { UsersGateway } from './users.gateway'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './entities/user.entity'
import { ConfigModule } from "@nestjs/config";

@Module({
    providers: [UsersGateway, UsersService],
    imports: [TypeOrmModule.forFeature([User]), ConfigModule],
    exports: [UsersService],
})
export class UsersModule {}
