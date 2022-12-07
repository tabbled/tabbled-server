import { WebSocketGateway, SubscribeMessage, ConnectedSocket } from "@nestjs/websockets";
import { ConfigurationService } from './configuration.service';
import { Socket } from "socket.io";

@WebSocketGateway()
export class ConfigurationGateway {
    constructor(private readonly configurationService: ConfigurationService) {}

    @SubscribeMessage('getConfiguration')
    async getAll(@ConnectedSocket() client: Socket) {
        try {
            let config = await this.configurationService.getAll()
            return {
                success: true,
                config: config
            }
        } catch (e) {
            console.error(e)
            return {
                success: false,
                error_message: e.toString()
            }
        }
    }

}
