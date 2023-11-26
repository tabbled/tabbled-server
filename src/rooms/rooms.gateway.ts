import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway
} from "@nestjs/websockets";
import { RoomsService } from "./rooms.service";
import { Server, Socket } from 'socket.io';
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthService } from "../auth/auth.service";

@UseGuards(JwtAuthGuard)
@WebSocketGateway()
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    constructor(private readonly roomsService: RoomsService, private readonly auth: AuthService) {}

    @SubscribeMessage('rooms/join')
    join(@MessageBody() rooms: string[], @ConnectedSocket() client: Socket) {
        client.join(rooms)
    }

    @SubscribeMessage('rooms/join')
    leave(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
        client.leave(room)
    }

    async handleConnection(client:Socket) {
        //const payload = this.jwtService.verify(token);
        console.log('handleConnection', await this.auth.getUserForSocket(client))
        //await client.join('updates')
    }

    handleDisconnect(client:Socket){
    }

    afterInit(server: Server): any {
        //console.log('afterInit')
        this.roomsService.setServer(server)
    }
}
