import { Module } from '@nestjs/common';
import { RoomsGateway } from './rooms.gateway';
import { RoomsService } from './rooms.service';
import { AuthModule } from "../auth/auth.module";

@Module({
    providers: [RoomsGateway, RoomsService],
    imports: [AuthModule],
    exports: [RoomsService]
})
export class RoomsModule {}
