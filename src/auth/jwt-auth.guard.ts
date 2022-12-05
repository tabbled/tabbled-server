/* eslint-disable prettier/prettier */
import {
    ExecutionContext,
    Injectable,
    UnauthorizedException,
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
        // Add your custom authentication logic here
        // for example, call super.logIn(request) to establish a session.
        const request = context.switchToHttp().getRequest();
        const auth = context.getArgByIndex(0)['handshake']['auth']
        console.log(auth.jwt)
    
        try {
            const payload = this.jwtService.verify(auth.jwt);
            // append user and poll to socket
            request.userID = payload.sub;
            request.pollID = payload.pollID;
            request.name = payload.name;
            return true;
        } catch(e) {
            throw new UnauthorizedException(e.toString());
        }
    }
}
