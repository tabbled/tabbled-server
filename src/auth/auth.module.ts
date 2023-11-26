import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGateway } from './auth.gateway';
import { JwtModule } from "@nestjs/jwt";
import { jwtConstants } from './constants';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';


@Module({
    providers: [AuthGateway, AuthService],
    imports: [
        UsersModule,
        PassportModule,
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '60s' },
        }),
    ],
    exports: [AuthService]
})
export class AuthModule {}
