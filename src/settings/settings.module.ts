import { Module } from '@nestjs/common'
import { SettingsGateway } from './settings.gateway'
import { ConfigModule } from '@nestjs/config'

@Module({
    controllers: [],
    providers: [SettingsGateway],
    imports: [ConfigModule],
    exports: [],
})
export class SettingsModule {}
