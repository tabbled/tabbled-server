import { Module } from '@nestjs/common'
import { RoomsGateway } from './rooms.gateway'
import { RoomsService } from './rooms.service'
import { AuthModule } from '../auth/auth.module'
import { UsersModule } from "../users/users.module";

@Module({
    providers: [RoomsGateway, RoomsService],
    imports: [AuthModule, UsersModule],
    exports: [RoomsService],
})
export class RoomsModule {}
