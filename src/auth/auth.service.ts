import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity'
let bcrypt = require('bcryptjs');

@Injectable()
export class AuthService {
    //private readonly userService: UsersService = new UsersService();
    constructor(
        private jwtService: JwtService,
        private userService: UsersService
    ) {}
    
    async login(login: LoginDto) {
        const user: User = await this.userService.findOne({ username: login.username })
        
        
        if (!bcrypt.compareSync(login.password, user.password)) {
            throw Error(`User and password pair not found`)
        }
        
        const payload = { username: login.username, sub: login.username };
        return this.jwtService.sign(payload, {
            expiresIn: '7 days'
        })
    }
}
