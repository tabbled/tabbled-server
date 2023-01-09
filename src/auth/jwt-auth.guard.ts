/* eslint-disable prettier/prettier */
import {
    ExecutionContext,
    Injectable
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from "./constants";

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    private jwtService: JwtService = new JwtService({
        secret: jwtConstants.secret,
    })
    
    canActivate(context: ExecutionContext): boolean | Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const client = context.getArgByIndex(0);
        const auth = client['handshake']['auth'];

        //console.log('canActivate', client)
        try {
            const payload = this.jwtService.verify(auth.jwt);
            // append user and poll to socket
            request.username = payload.username;
            request.userId = payload.userId;
            request.accountId = auth.accountId
            return true;
        } catch(e) {
            console.error(e)
            client.emit('login_needed', {})
            throw e
        }
    }
}
