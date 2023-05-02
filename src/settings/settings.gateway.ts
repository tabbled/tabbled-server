import {SubscribeMessage, WebSocketGateway} from "@nestjs/websockets";
import { ConfigService } from "@nestjs/config";
let p = require('./../../package.json');

@WebSocketGateway()
export class SettingsGateway {

    constructor(private configService: ConfigService) {}

    @SubscribeMessage('getSettings')
    async appVersion() : Promise<any> {
        return {
            success: true,
            data: {
                version: p.version,
                title: this.configService.get<string>('APP_TITLE') || 'Tabbled',
                favicon: this.configService.get<string>('APP_FAVICON') || ''
            }
        }
    }
}
