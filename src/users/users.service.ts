import { Injectable } from '@nestjs/common';
import { AccountUsers, User } from "./entities/user.entity";
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from "typeorm";
import { InviteUserDto } from "./dto/invite-user.dto";
import { GetDataManyOptionsDto, GetManyResponse } from "../datasources/dto/datasource.dto";
import { Context } from "../entities/context";
let bcrypt = require('bcryptjs');


@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private datasource: DataSource) {
    }
    async insert(user: any, accountId: number): Promise<number | undefined> {
        if (!user.username || !user.password)
            throw 'Field username or password not provided'

        let exists = await this.findOne({username: user.username})
        if (exists) {
            throw `User with username "${user.username}" already exists`
        }

        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()

        try {
            let res = await queryRunner.manager.createQueryBuilder()
                .insert()
                .into(User)
                .values({
                    username: user.username,
                    password: bcrypt.hashSync(user.password, 10),
                    firstname: user.firstname,
                    lastname: user.lastname,
                    settings: user.settings ? user.settings : { lang: "en" }
                })
                .execute()

            let userId = res.identifiers[0].id

            await queryRunner.manager.createQueryBuilder()
                .insert()
                .into(AccountUsers)
                .values({
                    user_id: userId,
                    account_id: accountId,
                    permissions: user.permissions ? user.permissions : { admin: false },
                    active: user.active === undefined ? true : user.active
                })
                .execute()
            await queryRunner.commitTransaction()

            return userId
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e
        } finally {
            await queryRunner.release()
        }
    }
    
    async invite(invite: InviteUserDto): Promise<User | undefined> {
        console.log(invite)
        return new User();
    }

    async findOne(where: any): Promise<User | undefined> {
        return this.usersRepository.findOneBy(where)
    }

    async getById(id: number): Promise<User | undefined> {
        return this.usersRepository.findOneOrFail({ where: { id: id } } )
    }

    async getSettingsForAccount(userId: number, accountId: number) {
        let user = await this.getById(userId);
        let settings = await this.accountSettings(userId);

        let acc = settings.find(item => item.acc_id === accountId)

        if (!acc)
            throw `Account not found for user ${userId}`

        return {
            id: user.id,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            settings: user.settings,
            permissions: acc.permissions,
            active: acc.active
        }
    }

    async getSettings(userId: number) {
        let user = await this.getById(userId);
        let settings = await this.accountSettings(userId);

        console.log(settings)

        let accounts = [];
        settings.forEach(item => {
            accounts.push({
                id: item.acc_id,
                name: item.acc_name,
                permissions: item.permissions,
                active: item.active,
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
            .select('*')
            .leftJoinAndSelect("account_users", "au", "au.user_id = users.id")
            .leftJoinAndSelect('accounts', 'acc', 'au.account_id = acc.id')
            .where('au.user_id = :id', {id: userId})
            .getRawMany()
    }
    
    async getMany(options: GetDataManyOptionsDto, ctx: Context): Promise<GetManyResponse> {
        console.log('getMany')
        let query = await this.usersRepository
            .createQueryBuilder('users')
            .select('id, username, lastname, firstname, settings, au.active active, au.permissions permissions')
            .leftJoin("account_users", "au", "au.user_id = users.id")
            .where('au.account_id = :id', {id: ctx.accountId})


        if (options.take) query.limit(options.take)
        if (options.skip) query.offset(options.skip)
        if (options.sort) query.addOrderBy(options.sort.field, options.sort.ask ? "ASC" : "DESC")

        if(options.search) {
            console.log(options.search)
            query.andWhere(new Brackets(qb => {
                qb.orWhere(`username ILIKE '%${options.search}%'`)
                qb.orWhere(`firstname ILIKE '%${options.search}%'`)
                qb.orWhere(`lastname ILIKE '%${options.search}%'`)
            }))
        }

        console.log(query.getQuery())

        let data = await query.getRawMany()
        let count = await query.getCount()

        return {
            items: data,
            count: count
        }

    }

    async update(id: number, user: any, accountId: number) {
        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()

        try {
             await queryRunner.manager.createQueryBuilder()
                .update(User)
                .set({
                    password: user.password ? bcrypt.hashSync(user.password, 10) : undefined,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    settings: user.settings ? user.settings : { lang: "en" }
                })
                .where({id: user.id})
                .execute()

            await queryRunner.manager.createQueryBuilder()
                .update(AccountUsers)
                .set({
                    permissions: user.permissions ? user.permissions : undefined,
                    active: user.active === undefined ? undefined : user.active
                })
                .where({
                    user_id: id,
                    account_id: accountId
                })
                .execute()
            await queryRunner.commitTransaction()

            return id
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e
        } finally {
            await queryRunner.release()
        }
    }

    async remove(id: number, accountId: number) {
        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()

        try {
            await queryRunner.manager.createQueryBuilder()
                .delete()
                .from(AccountUsers)
                .where({
                    user_id: id,
                    account_id: accountId
                })
                .execute()
            await queryRunner.commitTransaction()

            return id
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e
        } finally {
            await queryRunner.release()
        }
    }
}


