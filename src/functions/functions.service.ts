import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { ConfigItem } from "../config/entities/config.entity";
import { NodeVM } from "vm2";
import { Axios } from 'axios'
import { FlakeId } from '../flake-id'
import { DataItemService } from "../dataitem/dataitem.service";
import { DataSource as DataSourceHelper } from "../entities/datasource";
import { Context } from "../entities/context";

@Injectable()
export class FunctionsService {
    constructor(@Inject(forwardRef(() => DataItemService))
                private dataItemService: DataItemService,
                @InjectRepository(ConfigItem)
                private configRepository: Repository<ConfigItem>,
                @InjectDataSource('default')
                private datasource: DataSource) {
    }

    async getByAlias(alias: string) {
        return await this.configRepository.createQueryBuilder()
            .where(`alias = 'function' AND data ->> 'alias' = :alias`, { alias: alias })
            .getOne()
    }

    async getById(id: string) {
        let item = await this.configRepository.createQueryBuilder()
            .where(`alias = 'function' AND id = :id`, { id: id })
            .getOne()
        return item ? item.data : undefined
    }

    async call(alias: string, context: Context) {
        console.log('functions/call - ', alias, 'context - ', context)
        let func = await this.getByAlias(alias)


        console.log('func', func)

        let ctx = context
        if (!ctx)
            ctx = (func.data.context instanceof String) ? JSON.parse(func.data.context) : func.data.context
        const dsHelper = new DataSourcesScriptHelper(this.dataItemService, context)
        const requestHelper = new RequestScriptHelper()
        const utils = new Utils()

        const vm = new NodeVM({
            timeout: 5000,
            allowAsync: true,
            wrapper: 'none',
            sandbox: {
                ctx: ctx,
                dataSources: dsHelper,
                request: requestHelper,
                utilities: utils
            }
        });

        let res = null
        try {
            res = vm.run(func.data.script)
        } catch (e) {
            console.error(`Call function "${func.data.alias}" error: `, e)
            throw `Call function "${func.data.alias}" error: ${e.toString()}`
        }
        return (res instanceof Promise) ? await res : res
    }
}

class DataSourcesScriptHelper {
    constructor(dataItemService: DataItemService, context: Context) {
        this.dataItemService = dataItemService
        this.context = context
        console.log('DataSourcesScriptHelper context', this.context)
    }
    readonly dataItemService: DataItemService
    readonly context: Context

    async getByAlias(alias: string) {
        let config = await this.dataItemService.getDataSourceConfig(alias)

        if (!config)
            return undefined

        return new DataSourceHelper(config, this.dataItemService, this.context)
    }
}

class RequestScriptHelper {
    constructor() {
        this.axios = new Axios({

        })
    }
    private axios:Axios = null

    async get(url: string, headers: any) {
        console.log('script request get, url - ', url, headers)
        return await this.axios.get(url, {
            headers: headers
        })
    }

    async post(url: string, data: any, headers: any) {
        console.log('script request post, url - ', url, data, headers)

        let config = {
            headers: {}
        }
        if (headers && headers instanceof Object)
            config.headers = headers

        config.headers['Content-Type'] = 'application/json'
        config.headers['User-Agent'] = 'tabbled'

        try {
            let res = await this.axios.post(url, data, config)
            return res.data
        } catch (e) {
            console.error(e)
            throw new Error('Error while execution script: ' + e.toString())
        }

    }
}

class Utils {
    constructor() {
        this.flakeId = new FlakeId()
    }
    private flakeId = null

    generateId() {
        return (this.flakeId.generateId()).toString()
    }
}
