import { Injectable } from '@nestjs/common';
import { DataSource } from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";
import { Variable } from "./variables.entity";
import { Context } from "../entities/context";

@Injectable()
export class VariablesService {
    constructor(@InjectDataSource('default')
                private datasource: DataSource) {
    }
    async get(name: string, defaultValue: any, context: Context) {
        let val = await this.datasource.getRepository(Variable)
            .findOneBy({ name: name, accountId: context.accountId })
        return val
            ? val.value
            : defaultValue
                ? defaultValue
                : null

    }

    async set(name: string, value: any, context: Context) {
        await this.datasource.getRepository(Variable)
            .createQueryBuilder()
            .insert()
            .into(Variable)
            .values({ name: name, value: value, accountId: context.accountId })
            .orUpdate(['value'], ['account_id', 'name'])
            .execute()
        
    }
}
