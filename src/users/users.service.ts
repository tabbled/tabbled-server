import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity'
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InviteUserDto } from "./dto/invite-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";


@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>) {
    }
    async create(invite: User): Promise<User | undefined> {
        return new User();
    }
    
    async invite(invite: InviteUserDto): Promise<User | undefined> {
        return new User();
    }

    async findOne(where: any): Promise<User | undefined> {
        return this.usersRepository.findOneBy(where)
    }
    
    async findMany(account_id: number): Promise<User[] | undefined> {
        return this.usersRepository.find()
    }

    update(id: number, user: UpdateUserDto) {
        return false
    }

    remove(id: number) {
        return false
    }
}


