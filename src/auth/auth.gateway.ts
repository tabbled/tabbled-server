import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Socket } from "socket.io";

@WebSocketGateway()
export class AuthGateway {
    constructor(private readonly authService: AuthService) {}

    @SubscribeMessage('login')
    async login(@MessageBody() loginDto: LoginDto, @ConnectedSocket() client: Socket) {
        try {
            const jwt: string = await this.authService.login(loginDto)
            return {
                jwt: jwt
            }
        } catch (e) {
            console.error(e)
            client.emit('exception', {error: e.toString()})
        }
        
    }
}
