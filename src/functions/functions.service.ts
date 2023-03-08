import { Injectable } from '@nestjs/common';
import { CallFunctionDto } from './dto/call-function.dto';
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { ConfigItem } from "../config/entities/config.entity";
const {VM} = require('vm2');

@Injectable()
export class FunctionsService {
    constructor(@InjectRepository(ConfigItem)
                private configRepository: Repository<ConfigItem>,
                @InjectDataSource('default')
                private datasource: DataSource) {
    }

    async getByAlias(alias: string) {
        return await this.configRepository.createQueryBuilder()
            .where(`data ->> 'alias' = :alias`, { alias: alias })
            .getOne()
    }

    async call(alias: string, callFunctionDto: CallFunctionDto) {
        console.log(alias, callFunctionDto)
        let func = await this.getByAlias(alias)

        console.log(func)
        let context = (func.data.context instanceof String) ? JSON.parse(func.data.context) : func.data.context


        const vm = new VM({
            timeout: 1000,
            allowAsync: false,
            sandbox: {
                ctx: context
            }
        });

        let res = null
        try {
            res = vm.run(func.data.script)
        } catch (e) {
            console.error(`Call function "${func.data.alias}" error: `, e)
            throw `Call function "${func.data.alias}" error: ${e.toString()}`
        }

        return res
    }
}
