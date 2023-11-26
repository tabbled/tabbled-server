import { forwardRef, Module } from "@nestjs/common";
import { DataSourcesService } from './datasources.service';
import { DataSourcesGateway } from './datasources.gateway';
import { DataSourcesController } from "./datasources.contreller";
import { FunctionsModule } from "../functions/functions.module";
import { UsersModule } from "../users/users.module";
import { RoomsModule } from "../rooms/rooms.module";

@Module({
    controllers: [DataSourcesController],
    providers: [DataSourcesGateway, DataSourcesService],
    imports: [forwardRef(() => FunctionsModule), UsersModule, RoomsModule],
    exports: [DataSourcesService]
})
export class DataSourcesModule {}
