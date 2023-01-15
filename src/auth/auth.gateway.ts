import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Socket } from "socket.io";

@WebSocketGateway()
export class AuthGateway {
    constructor(private readonly authService: AuthService) {}

    @SubscribeMessage('login')
    async login(@MessageBody() login: LoginDto, @ConnectedSocket() client: Socket) {
        console.log("/login by user", login.username)
        try {
            const jwt: string = await this.authService.login(login)
            return {
                success: true,
                jwt: jwt
            }
        } catch (e) {
            console.error(e)
            client.emit('exception', {error: e.toString()})
            return {
                success: false,
                error_message: e.toString()
            }
        }
        
    }
}
