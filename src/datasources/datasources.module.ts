import { forwardRef, Module } from '@nestjs/common'
import { DataSourcesService } from './datasources.service'
import { DataSourcesGateway } from './datasources.gateway'
import { DataSourcesController } from './datasources.contreller'
import { FunctionsModule } from '../functions/functions.module'
import { UsersModule } from '../users/users.module'
import { RoomsModule } from '../rooms/rooms.module'
import { DataSourceV2Controller } from "./datasourceV2.contreller";
import { DataSourceV2Service } from "./datasourceV2.service";

@Module({
    controllers: [DataSourcesController, DataSourceV2Controller],
    providers: [DataSourcesGateway, DataSourcesService, DataSourceV2Service],
    imports: [forwardRef(() => FunctionsModule), UsersModule, RoomsModule],
    exports: [DataSourcesService],
})
export class DataSourcesModule {}
