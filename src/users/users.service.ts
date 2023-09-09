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

    async getSettings(userId: number) {
        let user = await this.findOne({id: userId});
        let settings = await this.accountSettings(userId);

        let accounts = [];
        settings.forEach(item => {
            accounts.push({
                id: item.acc_id,
                name: item.acc_name,
                permissions: item.au_permissions,
                active: item.au_active,
            })
        })

        return {
            id: user.id,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            settings: user.settings,
            accounts: accounts
        }
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


