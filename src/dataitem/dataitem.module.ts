import { Module } from "@nestjs/common";
import { DataItemService } from './dataitem.service';
import { DataItemGateway } from './dataitem.gateway';
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataItem } from "./entities/dataitem.entity";

@Module({
    providers: [DataItemGateway, DataItemService],
    imports: [TypeOrmModule.forFeature([DataItem])],
    exports: [TypeOrmModule]
})

export class DataItemModule {
}
