import { Module } from "@nestjs/common";
import { AggregationsService } from './aggregations.service';
import { AggregationsGateway } from './aggregations.gateway';
import { DataSourcesService } from "../datasources/datasources.service";
import { UsersModule } from "../users/users.module";
import { DataSourcesModule } from "../datasources/datasources.module";

@Module({
    providers: [AggregationsGateway, AggregationsService, DataSourcesService],
    imports: [UsersModule, DataSourcesModule],
    exports: [DataSourcesService]
})
export class AggregationsModule {}
