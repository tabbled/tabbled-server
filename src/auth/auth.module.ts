import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGateway } from './auth.gateway';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from "../users/users.service";

@Module({
    providers: [AuthGateway, AuthService, JwtStrategy, UsersService],
    imports: [
        UsersModule,
        PassportModule,
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '60s' },
        }),
    ],
})
export class AuthModule {}
