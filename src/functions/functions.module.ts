import { forwardRef, Module } from "@nestjs/common";
import { FunctionsService } from './functions.service';
import { FunctionsController } from './functions.controller';
import { ConfigService } from "../config/config.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigItem } from "../config/entities/config.entity";
import { FunctionsGateway } from "./functions.gateway";
import { DataSourcesService } from "../datasources/datasources.service";
import { DataSourcesModule } from "../datasources/datasources.module";
import { AggregationsService } from "../aggregations/aggregations.service";
import { AggregationsModule } from "../aggregations/aggregations.module";
import { UsersModule } from "../users/users.module";
import { UsersService } from "../users/users.service";

@Module({
    controllers: [FunctionsController],
    providers: [ FunctionsService, ConfigService, FunctionsGateway, DataSourcesService, AggregationsService, UsersService],
    imports: [
        TypeOrmModule.forFeature([ConfigItem]),
        forwardRef(() => DataSourcesModule) ,
        AggregationsModule,
        UsersModule],
    exports: [TypeOrmModule, FunctionsService, DataSourcesService, AggregationsService]
})
export class FunctionsModule {}
