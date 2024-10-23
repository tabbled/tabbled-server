import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
} from '@nestjs/websockets'
import { RoomsService } from './rooms.service'
import { Server, Socket } from 'socket.io'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AuthService } from '../auth/auth.service'
import * as process from 'process'
import axios from 'axios'

@UseGuards(JwtAuthGuard)
@WebSocketGateway()
export class RoomsGateway
    implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
    constructor(
        private readonly roomsService: RoomsService,
        private readonly auth: AuthService
    ) {}

    @SubscribeMessage('rooms/join')
    join(@MessageBody() rooms: string[], @ConnectedSocket() client: Socket) {
        console.log("rooms/join")
        client.join(rooms)
        console.log(client.rooms)
    }

    @SubscribeMessage('rooms/leave')
    leave(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
        client.leave(room)
    }

    async handleConnection(client: Socket) {
        //const payload = this.jwtService.verify(token);
        let userId = await this.auth.getUserForSocket(client)
        console.log('handleConnection, userId: ', userId)

        if (process.env.CLOUD_ACCOUNT && userId) {
            try {
                await axios.post(
                    `${process.env.ENTRYPOINT_URL}/accounts/last-seen`,
                    {
                        account: process.env.CLOUD_ACCOUNT,
                    }
                )
            } catch (e) {
                console.error(e)
            }
        }

        console.log(client.rooms)
        //await client.join('updates')
    }

    handleDisconnect(client: Socket) {}

    afterInit(server: Server): any {
        //console.log('afterInit')
        this.roomsService.setServer(server)
    }
}
