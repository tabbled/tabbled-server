import { forwardRef, Module } from "@nestjs/common";
import { FunctionsService } from './functions.service';
import { FunctionsController } from './functions.controller';
import { ConfigService } from "../config/config.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigItem } from "../config/entities/config.entity";
import { DataItemService } from "../dataitem/dataitem.service";
import { DataItemModule } from "../dataitem/dataitem.module";
import { FunctionsGateway } from "./functions.gateway";

@Module({
    controllers: [FunctionsController],
    providers: [FunctionsGateway, FunctionsService, ConfigService, DataItemService],
    imports: [TypeOrmModule.forFeature([ConfigItem]), forwardRef(() => DataItemModule)],
    exports: [TypeOrmModule]
})
export class FunctionsModule {}
