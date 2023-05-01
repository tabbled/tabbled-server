import { Module } from '@nestjs/common';
import { DataSourcesService } from './datasources.service';
import { DataSourcesGateway } from './datasources.gateway';

@Module({
  providers: [DataSourcesGateway, DataSourcesService]
})
export class DataSourcesModule {}
