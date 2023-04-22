import { Module } from "@nestjs/common";
import { DataItemService } from './dataitem.service';
import { DataItemGateway } from './dataitem.gateway';
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataItem } from "./entities/dataitem.entity";
import { FunctionsService } from "../functions/functions.service";
import { FunctionsModule } from "../functions/functions.module";

@Module({
    providers: [DataItemGateway, DataItemService, FunctionsService],
    imports: [TypeOrmModule.forFeature([DataItem]), FunctionsModule],
    exports: [TypeOrmModule]
})

export class DataItemModule {
}
