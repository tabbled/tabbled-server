import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigGateway } from './config.gateway';
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigItem } from "./entities/config.entity";
import { UsersModule } from "../users/users.module";
import { UsersService } from "../users/users.service";

@Module({
    providers: [ConfigGateway, ConfigService, UsersService],
    imports: [TypeOrmModule.forFeature([ConfigItem, ConfigGateway]), UsersModule],
    exports: [TypeOrmModule]
})
export class ConfigModule {}
