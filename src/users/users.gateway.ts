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

        try {

            let user = await this.usersService.findOne({id: client['userId']});
            let settings = await this.usersService.accountSettings(client['userId']);

            let accounts = [];
            settings.forEach(item => {
                accounts.push({
                    id: item.acc_id,
                    name: item.acc_name,
                    permissions: item.au_permissions,
                    active: item.au_active,
                })
            })

            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    settings: user.settings,
                    accounts: accounts
                }
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
