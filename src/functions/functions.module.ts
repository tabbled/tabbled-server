import { Module } from "@nestjs/common";
import { FunctionsService } from './functions.service';
import { FunctionsController } from './functions.controller';
import { ConfigService } from "../config/config.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigItem } from "../config/entities/config.entity";
import { FunctionsGateway } from "./functions.gateway";
import { DataSourcesService } from "../datasources/datasources.service";

@Module({
    controllers: [FunctionsController],
    providers: [FunctionsGateway, FunctionsService, ConfigService, DataSourcesService],
    imports: [TypeOrmModule.forFeature([ConfigItem])],
    exports: [TypeOrmModule]
})
export class FunctionsModule {}
