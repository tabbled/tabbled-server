import { Module } from "@nestjs/common"
import { SettingsGateway } from "./settings.gateway";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
    controllers: [],
    providers: [SettingsGateway, ConfigService],
    imports: [ConfigModule],
    exports: []
})
export class SettingsModule {}
