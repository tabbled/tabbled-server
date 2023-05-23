import { forwardRef, Module } from "@nestjs/common";
import { FunctionsService } from './functions.service';
import { FunctionsController } from './functions.controller';
import { ConfigService } from "../config/config.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigItem } from "../config/entities/config.entity";
import { FunctionsGateway } from "./functions.gateway";
import { DataSourcesService } from "../datasources/datasources.service";
import { DataSourcesModule } from "../datasources/datasources.module";

@Module({
    controllers: [FunctionsController],
    providers: [ FunctionsService, ConfigService, FunctionsGateway, DataSourcesService],
    imports: [
        TypeOrmModule.forFeature([ConfigItem]),
        forwardRef(() => DataSourcesModule) ],
    exports: [TypeOrmModule, FunctionsService, DataSourcesService]
})
export class FunctionsModule {}
