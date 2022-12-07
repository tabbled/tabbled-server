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
        console.log(invite)
        return new User();
    }
    
    async invite(invite: InviteUserDto): Promise<User | undefined> {
        console.log(invite)
        return new User();
    }

    async findOne(where: any): Promise<User | undefined> {
        return this.usersRepository.findOneBy(where)
    }

    async accountSettings(userId): Promise<any | undefined> {
        return this.usersRepository
            .createQueryBuilder('users')
            .leftJoinAndSelect("account_users", "au", "au.user_id = users.id")
            .leftJoinAndSelect('accounts', 'acc', 'au.account_id = acc.id')
            .where('au.user_id = :id', {id: userId})
            .getRawMany()
    }
    
    async findMany(account_id: number): Promise<User[] | undefined> {
        console.log(account_id)
        return this.usersRepository.find()
    }

    update(id: number, user: UpdateUserDto) {
        console.log(id, user)
        return false
    }

    remove(id: number) {
        console.log(id)
        return false
    }
}


