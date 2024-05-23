import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { UsersGateway } from './users.gateway'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './entities/user.entity'

@Module({
    providers: [UsersGateway, UsersService],
    imports: [TypeOrmModule.forFeature([User])],
    exports: [UsersService],
})
export class UsersModule {}
