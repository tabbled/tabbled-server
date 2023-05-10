import {
    ExecutionContext,
    Injectable, UnauthorizedException
} from "@nestjs/common";
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

        // Firstly we check the http auth from headers
        let token = this.extractTokenFromHeader(request)

        // if token not provided then check in ws handshake auth
        if (!token) {
            token = client.handshake?.auth.jwt
        }

        if (!token) {
            throw new UnauthorizedException()
        }

        try {
            const payload = this.jwtService.verify(token);
            // append user and poll to socket
            request.username = payload.username;
            request.userId = Number(payload.userId);
            request.accountId = Number(client.handshake?.auth.accountId);

            return true;
        } catch(e) {
            console.error(e)

            if (client.handshake)
                client.emit('login_needed', {})

            throw e
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        if (!request || !request.headers)
            return undefined;

        const [type, token] = request.headers['authorization']?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
