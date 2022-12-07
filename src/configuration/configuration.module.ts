import { Module } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { ConfigurationGateway } from './configuration.gateway';

@Module({
  providers: [ConfigurationGateway, ConfigurationService]
})
export class ConfigurationModule {}
