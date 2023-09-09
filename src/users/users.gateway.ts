import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    WebSocketServer,
    ConnectedSocket
} from '@nestjs/websockets';
import { UsersService } from './users.service';
import { InviteUserDto } from "./dto/invite-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Server, Socket } from 'socket.io';

@UseGuards(JwtAuthGuard)
@WebSocketGateway()
export class UsersGateway {
    constructor(private readonly usersService: UsersService) {}
    
    @WebSocketServer()
    server: Server;

    @SubscribeMessage('users/me')
    async me(@ConnectedSocket() client: Socket) {
        //console.log('users/me', client['userId'])

        try {
            let user = await this.usersService.getSettings(client['userId'])
            return {
                success: true,
                user: user
            };
        } catch (e) {
            console.error(e)
            return {
                success: false
            }
        }
    }
    
    @SubscribeMessage('users/inviteUser')
    create(@MessageBody() invite: InviteUserDto, @ConnectedSocket() client: Socket) {
        return this.usersService.invite(invite)
    }

    @SubscribeMessage('users/getUsers')
    getAll(@MessageBody() account_id: number, @ConnectedSocket() client: Socket) {
        return this.usersService.findMany(account_id);
    }

    @SubscribeMessage('users/findOneUser')
    findOne(@MessageBody() where: any) {
        return this.usersService.findOne(where);
    }

    @SubscribeMessage('users/updateUser')
    update(@MessageBody() updateUserDto: UpdateUserDto, id: number) {
        return this.usersService.update(id, updateUserDto);
    }

    @SubscribeMessage('users/removeUser')
    remove(@MessageBody() id: number) {
        return this.usersService.remove(id);
    }
}
