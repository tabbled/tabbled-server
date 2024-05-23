import { Injectable } from '@nestjs/common'
import { LoginDto } from './dto/login.dto'
import { UsersService } from '../users/users.service'
import { JwtService } from '@nestjs/jwt'
import { User } from '../users/entities/user.entity'
let bcrypt = require('bcryptjs')

@Injectable()
export class AuthService {
    //private readonly userService: UsersService = new UsersService();
    constructor(
        private jwtService: JwtService,
        private userService: UsersService
    ) {}

    async login(login: LoginDto) {
        const user: User = await this.userService.findOne({
            username: login.username,
        })

        if (!user) {
            throw Error(`User and password pair not found`)
        }

        if (!bcrypt.compareSync(login.password, user.password)) {
            throw Error(`User and password pair not found`)
        }

        const settings = await this.userService.getSettings(user.id)
        let active = settings.accounts.find((item) => item.active === true)
        if (!active) throw Error(`User doesn't have account`)

        const payload = { username: login.username, userId: user.id }
        return this.jwtService.sign(payload, {
            expiresIn: '7 days',
        })
    }

    async getUserForSocket(client) {
        if (!client) return null

        let token = client.handshake?.auth.jwt
        if (!token) return null

        const payload = this.jwtService.verify(token)
        return Number(payload.userId)
    }
}
