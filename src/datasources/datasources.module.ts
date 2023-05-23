import { forwardRef, Module } from "@nestjs/common";
import { DataSourcesService } from './datasources.service';
import { DataSourcesGateway } from './datasources.gateway';
import { DataSourcesController } from "./datasources.contreller";
import { FunctionsModule } from "../functions/functions.module";
import { FunctionsService } from "../functions/functions.service";

@Module({
    controllers: [DataSourcesController],
    providers: [DataSourcesGateway, DataSourcesService, FunctionsService],
    imports: [forwardRef(() => FunctionsModule)],
    exports: [DataSourcesService, FunctionsService]
})
export class DataSourcesModule {}
