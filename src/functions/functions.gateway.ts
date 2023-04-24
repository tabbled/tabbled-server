import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Server, Socket } from "socket.io";
import { FunctionsService } from "./functions.service";
import { CallWsFunctionDto } from "./dto/call-function.dto";

@UseGuards(JwtAuthGuard)
@WebSocketGateway()
export class FunctionsGateway {

    @WebSocketServer()
    server: Server;

    constructor(private readonly functionsService: FunctionsService) {}

    @SubscribeMessage('functions/call')
    async call(@MessageBody() body: CallWsFunctionDto, @ConnectedSocket() client: Socket) : Promise<any> {

        console.log('functions/call', body)
        let vmConsole = this.vmConsole.bind(this)

        try {
            let res = await this.functionsService.call(body.alias, body.context, vmConsole);
            return {
                success: true,
                result: res
            }
        } catch (e) {
            return {
                success: false,
                error_message: e.toString()
            }
        }
    }

    async vmConsole(...args) {
        console.log(`VM stdout: ${args}`)
        this.server.emit(`functions/console.log`, ...args)
    }
}
