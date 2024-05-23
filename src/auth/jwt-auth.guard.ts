import {
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from '../users/users.service'
import { jwtConstants } from './constants'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private userService: UsersService) {
        super()
    }
    private jwtService: JwtService = new JwtService({
        secret: jwtConstants.secret,
    })

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const client = context.getArgByIndex(0)

        // Firstly we check the http auth from headers
        let token = this.extractTokenFromHeader(request)
        let accountId

        // if token not provided then check in ws handshake auth
        if (!token) {
            token = client.handshake?.auth.jwt
            accountId = client.handshake?.auth.accountId
        } else {
            accountId = request.headers['x-account-id']
        }

        if (!token) {
            throw new UnauthorizedException()
        }

        try {
            const payload = this.jwtService.verify(token)
            // append user and poll to socket
            request.username = payload.username
            request.userId = Number(payload.userId)

            let user = await this.userService.getSettings(payload.userId)

            if (!user) return false

            // If accountId doesn't provide that find first account for the user
            if (!accountId) {
                if (!user.accounts.length) return false

                accountId = user.accounts[0].id
            }

            request.accountId = accountId

            return true
        } catch (e) {
            console.error(e)

            if (client.handshake) client.emit('login_needed', {})

            throw e
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        if (!request || !request.headers) return undefined

        const [type, token] = request.headers['authorization']?.split(' ') ?? []
        return type === 'Bearer' ? token : undefined
    }
}
