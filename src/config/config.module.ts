import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigGateway } from './config.gateway';
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigItem } from "./entities/config.entity";

@Module({
    providers: [ConfigGateway, ConfigService],
    imports: [TypeOrmModule.forFeature([ConfigItem, ConfigGateway])],
    exports: [TypeOrmModule]
})
export class ConfigModule {}
