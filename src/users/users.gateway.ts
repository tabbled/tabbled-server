import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    WebSocketServer,
    ConnectedSocket,
} from '@nestjs/websockets'
import { UsersService } from './users.service'
import { InsertUserDto, InviteUserDto } from './dto/invite-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Server, Socket } from 'socket.io'
import { GetDataManyOptionsDto } from '../datasources/dto/datasource.dto'

@UseGuards(JwtAuthGuard)
@WebSocketGateway()
export class UsersGateway {
    constructor(private readonly usersService: UsersService) {}

    @WebSocketServer()
    server: Server

    @SubscribeMessage('users/me')
    async me(@ConnectedSocket() client: Socket) {
        //console.log('users/me', client['userId'])

        try {
            let user = await this.usersService.getSettings(client['userId'])

            return {
                success: true,
                data: user,
            }
        } catch (e) {
            console.error(e)
            return {
                success: false,
                error_message: e.toString(),
            }
        }
    }

    @SubscribeMessage('users/setMe')
    async setMe(@MessageBody() body: any, @ConnectedSocket() client: Socket) {
        console.log('users/setMe', client['userId'])

        try {
            await this.usersService.setSettings(client['userId'], body)
            return {
                success: true,
            }
        } catch (e) {
            console.error(e)
            return {
                success: false,
                error_message: e.toString(),
            }
        }
    }

    @SubscribeMessage('users/invite')
    invite(
        @MessageBody() invite: InviteUserDto,
        @ConnectedSocket() client: Socket
    ) {
        return this.usersService.invite(invite)
    }

    @SubscribeMessage('users/getMany')
    async getMany(
        @MessageBody() options: GetDataManyOptionsDto,
        @ConnectedSocket() client: Socket
    ) {
        console.log('users/getMany')
        try {
            let data = await this.usersService.getMany(options, {
                accountId: client['accountId'],
                userId: client['userId'],
            })

            return {
                success: true,
                data: data,
            }
        } catch (e) {
            console.error(e)
            return {
                success: false,
                error_message: e.toString(),
            }
        }
    }

    @SubscribeMessage('users/getById')
    async getById(@MessageBody() body: any, @ConnectedSocket() client: Socket) {
        console.log('users/getById', body)

        try {
            let data = await this.usersService.getSettingsForAccount(
                Number(body.id),
                client['accountId']
            )
            return {
                success: true,
                data: data,
            }
        } catch (e) {
            console.error(e)
            return {
                success: false,
                error_message: e.toString(),
            }
        }
    }

    @SubscribeMessage('users/insert')
    async insert(
        @MessageBody() body: InsertUserDto,
        @ConnectedSocket() client: Socket
    ) {
        console.log('users/insert')

        try {
            let id = await this.usersService.insert(
                body.value,
                client['accountId']
            )

            return {
                success: true,
                data: {
                    id: id,
                },
            }
        } catch (e) {
            return {
                success: false,
                error_message: e.toString(),
            }
        }
    }

    @SubscribeMessage('users/updateById')
    async update(
        @MessageBody() body: UpdateUserDto,
        @ConnectedSocket() client: Socket
    ) {
        console.log('users/updateById')

        try {
            let id = await this.usersService.update(
                body.id,
                body.value,
                client['accountId']
            )

            return {
                success: true,
                data: {
                    id: id,
                },
            }
        } catch (e) {
            return {
                success: false,
                error_message: e.toString(),
            }
        }
    }

    @SubscribeMessage('users/removeById')
    async remove(@MessageBody() body: any, @ConnectedSocket() client: Socket) {
        console.log('users/removeById')

        try {
            let id = await this.usersService.remove(
                body.id,
                client['accountId']
            )

            return {
                success: true,
                data: {
                    id: id,
                },
            }
        } catch (e) {
            return {
                success: false,
                error_message: e.toString(),
            }
        }
    }
}
