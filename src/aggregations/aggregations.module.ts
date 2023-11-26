import { Module } from "@nestjs/common";
import { AggregationsService } from './aggregations.service';
import { AggregationsGateway } from './aggregations.gateway';
import { UsersModule } from "../users/users.module";
import { DataSourcesModule } from "../datasources/datasources.module";
import { RoomsModule } from "../rooms/rooms.module";

@Module({
    providers: [AggregationsGateway, AggregationsService],
    imports: [UsersModule, DataSourcesModule, RoomsModule],
    exports: [AggregationsService]
})
export class AggregationsModule {}
