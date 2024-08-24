import { Injectable } from '@nestjs/common'
import { AccountUsers, User } from './entities/user.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Brackets, DataSource, Repository } from 'typeorm'
import { InviteUserDto } from './dto/invite-user.dto'
import {
    GetDataManyOptionsDto,
    GetManyResponse,
} from '../datasources/dto/datasource.dto'
import { Context } from '../entities/context'
let bcrypt = require('bcryptjs')

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private datasource: DataSource,
        //private configService: ConfigService
    ) {

    }

    //private getIndexUid = (context) => `${context.accountId}_users`
    // private fields:CollectionFieldSchema[] = [{
    //     name: "id",
    //     type: "string",
    //     optional: false,
    //     index: true,
    //     sort: true
    // },{
    //     name: "username",
    //     type: "string",
    //     optional: false,
    //     index: true,
    //     sort: true
    // },{
    //     name: "firstname",
    //     type: "string",
    //     optional: false,
    //     index: true,
    //     sort: true
    // },{
    //     name: "lastname",
    //     type: "string",
    //     optional: false,
    //     index: true,
    //     sort: true
    // },{
    //     name: "options",
    //     type: "object",
    //     optional: false,
    //     index: false,
    //     sort: false
    // },{
    //     name: "created_at",
    //     type: "int64",
    //     optional: false,
    //     index: true,
    //     sort: true
    // },{
    //     name: "updated_at",
    //     type: "int64",
    //     optional: false,
    //     index: true,
    //     sort: true
    // },{
    //     name: "active",
    //     type: "bool",
    //     optional: false,
    //     index: true,
    //     sort: true
    // },{
    //     name: "permissions",
    //     type: "object",
    //     optional: false,
    //     index: false,
    //     sort: false
    // }]

    async insert(user: any, accountId: number): Promise<number | undefined> {
        if (!user.username || !user.password)
            throw 'Field username or password not provided'

        let exists = await this.findOne({ username: user.username })
        if (exists) {
            throw `User with username "${user.username}" already exists`
        }

        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()

        try {
            let res = await queryRunner.manager
                .createQueryBuilder()
                .insert()
                .into(User)
                .values({
                    username: user.username,
                    password: bcrypt.hashSync(user.password, 10),
                    firstname: user.firstname,
                    lastname: user.lastname,
                    settings: user.settings ? user.settings : { lang: 'en' },
                })
                .execute()

            let userId = res.identifiers[0].id

            await queryRunner.manager
                .createQueryBuilder()
                .insert()
                .into(AccountUsers)
                .values({
                    user_id: userId,
                    account_id: accountId,
                    permissions: user.permissions
                        ? user.permissions
                        : { admin: false },
                    active: user.active === undefined ? true : user.active,
                })
                .execute()
            await queryRunner.commitTransaction()

            return userId
        } catch (e) {
            await queryRunner.rollbackTransaction()
            throw e
        } finally {
            await queryRunner.release()
            //await this.reindex({ userId: null, accountId: accountId })
        }
    }

    async invite(invite: InviteUserDto): Promise<User | undefined> {
        console.log(invite)
        return new User()
    }

    async findOne(where: any): Promise<User | undefined> {
        return this.usersRepository.findOneBy(where)
    }

    async getById(id: number): Promise<User | undefined> {
        return this.usersRepository.findOneOrFail({ where: { id: id } })
    }

    async getSettingsForAccount(userId: number, accountId: number) {
        let user = await this.getById(userId)
        let settings = await this.accountSettings(userId)

        let acc = settings.find((item) => item.acc_id === accountId)

        if (!acc) throw `Account not found for user ${userId}`

        return {
            id: user.id,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            settings: user.settings,
            permissions: acc.permissions,
            active: acc.active,
        }
    }

    async setSettings(userId, settings: any) {
        //console.log('setSettings', userId, settings)

        let password = undefined
        if (settings.newPassword) {
            if (settings.newPassword !== settings.newPasswordRepeat) {
                throw 'New passwords is not equal'
            }

            const user: User = await this.findOne({ id: userId })

            if (!bcrypt.compareSync(settings.currentPassword, user.password)) {
                throw Error(`New and current passwords are not equal`)
            }

            password = bcrypt.hashSync(settings.newPassword, 10)
        }

        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()

        try {
            await queryRunner.manager
                .createQueryBuilder()
                .update(User)
                .set({
                    password: password ? password : undefined,
                    firstname: settings.firstname
                        ? settings.firstname
                        : undefined,
                    lastname: settings.lastname ? settings.lastname : undefined,
                    settings: settings.settings ? settings.settings : undefined,
                })
                .where({ id: settings.id })
                .execute()

            await queryRunner.commitTransaction()
        } catch (e) {
            await queryRunner.rollbackTransaction()
            throw e
        } finally {
            await queryRunner.release()
        }
    }

    async getSettings(userId: number) {
        let user = await this.getById(userId)
        let settings = await this.accountSettings(userId)

        let accounts = []
        settings.forEach((item) => {
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
            accounts: accounts,
        }
    }

    async accountSettings(userId): Promise<any | undefined> {
        return this.usersRepository
            .createQueryBuilder('users')
            .select('*')
            .leftJoinAndSelect('account_users', 'au', 'au.user_id = users.id')
            .leftJoinAndSelect('accounts', 'acc', 'au.account_id = acc.id')
            .where('au.user_id = :id', { id: userId })
            .getRawMany()
    }

    async getMany(
        options: GetDataManyOptionsDto,
        ctx: Context
    ): Promise<GetManyResponse> {
        let query = await this.usersRepository
            .createQueryBuilder('users')
            .select(
                'id, username, lastname, firstname, settings, au.active active, au.permissions permissions'
            )
            .leftJoin('account_users', 'au', 'au.user_id = users.id')
            .where('au.account_id = :id', { id: ctx.accountId })

        if (options.take) query.limit(options.take)
        if (options.skip) query.offset(options.skip)
        if (options.sort)
            query.addOrderBy(
                options.sort.field,
                options.sort.ask ? 'ASC' : 'DESC'
            )

        if (options.search) {
            query.andWhere(
                new Brackets((qb) => {
                    qb.orWhere(`username ILIKE '%${options.search}%'`)
                    qb.orWhere(`firstname ILIKE '%${options.search}%'`)
                    qb.orWhere(`lastname ILIKE '%${options.search}%'`)
                })
            )
        }

        let data = await query.getRawMany()
        let count = await query.getCount()

        return {
            items: data,
            count: count,
        }
    }

    async update(id: number, user: any, accountId: number) {
        console.log('update', id)
        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()

        try {
            await queryRunner.manager
                .createQueryBuilder()
                .update(User)
                .set({
                    password: user.password
                        ? bcrypt.hashSync(user.password, 10)
                        : undefined,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    settings: user.settings ? user.settings : { lang: 'en' },
                })
                .where({ id: user.id })
                .execute()

            await queryRunner.manager
                .createQueryBuilder()
                .update(AccountUsers)
                .set({
                    permissions: user.permissions
                        ? user.permissions
                        : undefined,
                    active: user.active === undefined ? undefined : user.active,
                })
                .where({
                    user_id: id,
                    account_id: accountId,
                })
                .execute()
            await queryRunner.commitTransaction()

            return id
        } catch (e) {
            console.error(e)
            await queryRunner.rollbackTransaction()
            throw e
        } finally {
            await queryRunner.release()
            //await this.reindex({ userId: null, accountId: accountId })
        }
    }

    async remove(id: number, accountId: number) {
        let queryRunner = this.datasource.createQueryRunner()
        await queryRunner.startTransaction()

        try {
            await queryRunner.manager
                .createQueryBuilder()
                .delete()
                .from(AccountUsers)
                .where({
                    user_id: id,
                    account_id: accountId,
                })
                .execute()
            await queryRunner.commitTransaction()

            return id
        } catch (e) {
            await queryRunner.rollbackTransaction()
            throw e
        } finally {
            await queryRunner.release()
            //await this.reindex({ userId: null, accountId: accountId })
        }
    }

    //async reindex(context: Context, removeIndex = false) {

        // let indexUid = this.getIndexUid(context)
        //
        // try {
        //     let collection = await this.searchClient.collections(indexUid)
        //
        //     let exists = await collection.exists()
        //
        //     if (removeIndex && exists) {
        //         await collection.delete()
        //         exists = false
        //     }
        //
        //     if (!exists) {
        //         await this.searchClient.collections().create({
        //             name: indexUid,
        //             fields: this.fields,
        //             enable_nested_fields: true
        //         })
        //     }
        //     let query = await this.usersRepository
        //         .createQueryBuilder('users')
        //         .select(
        //             'id::varchar id, username, lastname, firstname, ' +
        //             'settings, au.active active, au.permissions permissions,' +
        //             '(extract(epoch from created_at) * 1000)::bigint created_at, (extract(epoch from updated_at) * 1000)::bigint updated_at'
        //         )
        //         .leftJoin('account_users', 'au', 'au.user_id = users.id')
        //         .where('au.account_id = :id', { id: context.accountId })
        //
        //     let users = await query.getRawMany()
        //     users.forEach(u => {
        //         u.created_at = Number(u.created_at)
        //         u.updated_at = Number(u.updated_at)
        //     })
        //     await collection.documents().import(users, {action: 'emplace'})
        //
        // } catch (e) {
        //     console.error(e)
        // }
    //}
}
