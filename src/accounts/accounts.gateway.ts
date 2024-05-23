import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
//import { AccountsService } from './accounts.service';
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Server } from 'socket.io'

@UseGuards(JwtAuthGuard)
@WebSocketGateway()
export class AccountsGateway {
    @WebSocketServer()
    server: Server

    // constructor(private readonly accountsService: AccountsService) {}
}
