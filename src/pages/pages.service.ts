import { Injectable } from '@nestjs/common';
import { Context } from "../entities/context";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { PageEntity } from "./entities/pages.entity";
import { PageInterface } from "./dto/pages.dto";

@Injectable()
export class PagesService {
    constructor(@InjectDataSource('default')
                private datasource: DataSource,
                /*private eventEmitter: EventEmitter2*/) {
    }

    async getMany(context: Context) {
        let rep = this.datasource.getRepository(PageEntity)
        const query = rep
            .createQueryBuilder()
            .select('id, alias, title, type')
            .andWhere('account_id = :account AND deleted_at IS NULL', {
                account: context.accountId
            })

        return await query.getRawMany()
    }

    async getOneByAlias(alias: string, context: Context) {
        let rep = this.datasource.getRepository(PageEntity)
        const query = rep
            .createQueryBuilder()
            .andWhere('account_id = :account AND alias = :alias', {
                account: context.accountId,
                alias: alias
            })

        return await query.getOne()
    }

    async getOneById(id: number, context: Context) {
        let rep = this.datasource.getRepository(PageEntity)
        const query = rep
            .createQueryBuilder()
            .andWhere('account_id = :account AND id = :id', {
                account: context.accountId,
                id: id
            })

        return await query.getOne()
    }

    async updateById(id: number, params: PageInterface, context: Context) {
        let page = await this.getOneById(id, context)
        if (!page)
            throw "Not found"

        let n = Object.assign(page, params)
        n.updatedAt = new Date()
        n.updatedBy = context.userId
        delete n.createdAt
        delete n.createdBy
        delete n.accountId
        delete n.deletedAt
        delete n.deletedBy
        n.version++

        console.log(n)

        let rep = this.datasource.getRepository(PageEntity)
        await rep
            .createQueryBuilder()
            .update()
            .set(n)
            .where('account_id = :account AND id = :id', {
                account: context.accountId,
                id: id
            })
            .execute()
    }
}
