import { forwardRef, Module } from '@nestjs/common'
import { FunctionsService } from './functions.service'
import { FunctionsController } from './functions.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigItem } from '../config/entities/config.entity'
import { FunctionsGateway } from './functions.gateway'
import { DataSourcesModule } from '../datasources/datasources.module'
import { AggregationsModule } from '../aggregations/aggregations.module'
import { UsersModule } from '../users/users.module'
import { RoomsModule } from '../rooms/rooms.module'

@Module({
    controllers: [FunctionsController],
    providers: [FunctionsService, FunctionsGateway],
    imports: [
        TypeOrmModule.forFeature([ConfigItem]),
        forwardRef(() => DataSourcesModule),
        AggregationsModule,
        UsersModule,
        RoomsModule,
    ],
    exports: [FunctionsService],
})
export class FunctionsModule {}
