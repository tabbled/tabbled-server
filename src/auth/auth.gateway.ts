import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
} from '@nestjs/websockets'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { Socket } from 'socket.io'
import { UsersService } from '../users/users.service'
import { User } from '../users/entities/user.entity'

@WebSocketGateway()
export class AuthGateway {
    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService
    ) {}

    @SubscribeMessage('login')
    async login(
        @MessageBody() login: LoginDto,
        @ConnectedSocket() client: Socket
    ) {
        console.log('/login by user', login.username)

        try {
            const jwt: string = await this.authService.login(login)
            const user: User = await this.usersService.findOne({
                username: login.username,
            })
            const userSettings = await this.usersService.getSettings(user.id)

            return {
                success: true,
                jwt: jwt,
                user: userSettings,
            }
        } catch (e) {
            console.error(e)
            return {
                success: false,
                error_message: e.toString(),
            }
        }
    }
}
