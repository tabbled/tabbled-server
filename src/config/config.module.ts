import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigGateway } from './config.gateway';
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigItem } from "./entities/config.entity";
import { UsersModule } from "../users/users.module";
import { ConfigController } from "./config.contreller";

@Module({
    controllers: [ConfigController],
    providers: [ConfigGateway, ConfigService],
    imports: [TypeOrmModule.forFeature([ConfigItem]), UsersModule],
    exports: [ConfigService]
})
export class ConfigModule {}
