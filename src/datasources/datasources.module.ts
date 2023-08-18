import { forwardRef, Module } from "@nestjs/common";
import { DataSourcesService } from './datasources.service';
import { DataSourcesGateway } from './datasources.gateway';
import { DataSourcesController } from "./datasources.contreller";
import { FunctionsModule } from "../functions/functions.module";
import { FunctionsService } from "../functions/functions.service";
import { UsersService } from "../users/users.service";
import { UsersModule } from "../users/users.module";

@Module({
    controllers: [DataSourcesController],
    providers: [DataSourcesGateway, DataSourcesService, FunctionsService, UsersService],
    imports: [forwardRef(() => FunctionsModule), UsersModule],
    exports: [DataSourcesService, FunctionsService]
})
export class DataSourcesModule {}
