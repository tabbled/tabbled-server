import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { ConfigItem } from "../config/entities/config.entity";
import { NodeVM } from "vm2";
import { Axios } from 'axios'
import { FlakeId } from '../flake-id'
import { Context } from "../entities/context";
import * as process from "process";
import { DataSourcesService } from "../datasources/datasources.service";

@Injectable()
export class FunctionsService {
    constructor(
                @Inject(forwardRef(() => DataSourcesService) )
                private dataSourcesService: DataSourcesService,
                @InjectRepository(ConfigItem)
                private configRepository: Repository<ConfigItem>,
                @InjectDataSource('default')
                private datasource: DataSource) {
    }

    async getByAlias(alias: string) {
        let item = await this.configRepository.createQueryBuilder()
            .where(`alias = 'function' AND data ->> 'alias' = :alias`, { alias: alias })
            .getOne()

        return item ? item.data : undefined
    }

    async getById(id: string) {
        let item = await this.configRepository.createQueryBuilder()
            .where(`alias = 'function' AND id = :id`, { id: id })
            .getOne()
        return item ? item.data : undefined
    }

    async callByAlias(alias: string, context: Context, vmConsole?: (...args) => void) {
        let func = await this.getByAlias(alias)
        if (!func)
            throw new Error('Function not found')

        return await this.call(func, context, vmConsole)
    }

    async callById(id:string, context: Context, vmConsole?: (...args) => void) {
        let func = await this.getById(id)
        if (!func)
            throw new Error('Function not found')

        return await this.call(func, context, vmConsole)
    }

    async call(func: FunctionConfig, context: Context, vmConsole?: (...args) => void) {

        console.log('functions/call - ', func.alias)
        let ctx = Object.assign(JSON.parse(func.context), context)

        return await this.runScript(func.script, ctx, vmConsole)
    }

    async runScript(script: string, context: any, vmConsole?: (...args) => void) {
        const dsHelper = new DataSourcesScriptHelper(this.dataSourcesService, context)
        const requestHelper = new RequestScriptHelper()
        const utils = new Utils()


        const vm = new NodeVM({
            timeout: 5000,
            allowAsync: true,
            wrapper: 'none',
            console: !!vmConsole ? 'redirect' : 'inherit',
            sandbox: {
                ctx: context,
                dataSources: dsHelper,
                request: requestHelper,
                utilities: utils
            }
        });

        if (!!vmConsole)
            vm.on('console.log', vmConsole)

        process.on('uncaughtException', uncaughtException);

        let res = null
        try {
            res = await vm.run(script)
        } catch (e) {
            console.error(`Run script error: `, e)
            throw `${e.toString()}`
        } finally {
            process.off('uncaughtException', uncaughtException)
        }


        function uncaughtException(err) {
            console.error('Asynchronous error caught.', err.toString());
            if (!!vmConsole) {
                vmConsole(err.toString())
            }
        }

        return (res instanceof Promise) ? await res : res
    }
}

export class FunctionConfig {
    id: string
    alias: string
    context: string
    script: string
}

class DataSourcesScriptHelper {
    constructor(dataSourcesService: DataSourcesService, context: Context) {
        this.dataSourcesService = dataSourcesService
        this.context = context
        console.log('DataSourcesScriptHelper context', this.context)
    }
    readonly dataSourcesService: DataSourcesService
    readonly context: Context

    async getByAlias(alias: string) {
        return await this.dataSourcesService.getByAlias(alias, this.context)
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
