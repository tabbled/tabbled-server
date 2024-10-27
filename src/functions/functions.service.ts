import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { ConfigItem } from '../config/entities/config.entity'
import { NodeVM } from 'vm2'
import { Axios } from 'axios'
import { FlakeId } from '../flake-id'
import { Context } from '../entities/context'
import * as process from 'process'
import { DataSourcesService } from '../datasources/datasources.service'
import { AggregationsService } from '../aggregations/aggregations.service'
import { UsersService } from '../users/users.service'
import { VariablesService } from "../variables/variables.service";
import {DataSourceV2Service } from "../datasources/datasourceV2.service";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class FunctionsService {
    constructor(
        @Inject(forwardRef(() => DataSourcesService))
        private dataSourcesService: DataSourcesService,
        private dataSourceV2Service: DataSourceV2Service,
        @InjectRepository(ConfigItem)
        private configRepository: Repository<ConfigItem>,
        @InjectDataSource('default')
        private datasource: DataSource,
        private userService: UsersService,
        private aggService: AggregationsService,
        private variables: VariablesService,
        private eventEmitter: EventEmitter2
    ) {}

    async getByAlias(alias: string) {
        let item = await this.configRepository
            .createQueryBuilder()
            .where(`alias = 'function' AND data ->> 'alias' = :alias`, {
                alias: alias,
            })
            .getOne()

        return item ? item.data : undefined
    }

    async getById(id: string) {
        let item = await this.configRepository
            .createQueryBuilder()
            .where(`alias = 'function' AND id = :id`, { id: id })
            .getOne()
        return item ? item.data : undefined
    }

    async callByAlias(
        alias: string,
        context: Context,
        vmConsole?: (...args) => void
    ) {
        let func = await this.getByAlias(alias)
        if (!func) throw new Error('Function not found')

        return await this.call(func, context, vmConsole)
    }

    async callById(
        id: string,
        context: Context,
        vmConsole?: (...args) => void
    ) {
        let func = await this.getById(id)
        if (!func) throw new Error('Function not found')

        return await this.call(func, context, vmConsole)
    }

    async call(
        func: FunctionConfig,
        context: Context,
        vmConsole?: (...args) => void
    ) {
        console.log('functions/call - ', func.alias)
        let ctx = Object.assign(JSON.parse(func.context), context)

        return await this.runScript({
            script: func.script,
            context: ctx,
            vmConsole: vmConsole
        })
    }

    async runScript(params: {
                        script: string,
                        context: any,
                        vmConsole?: (...args) => void,
                        room?: string
                    }

    ) {
        const dsHelper = new DataSourcesScriptHelper(
            this.dataSourcesService,
            params.context
        )
        const requestHelper = new RequestScriptHelper()
        const utils = new Utils()
        const agg = new AggregationScriptHelper(
            this.aggService,
            params.context,
            params.vmConsole
        )
        const usr = new UserScriptHelper(this.userService, params.context)
        const vars = new VariablesHelper(this.variables, params.context)
        const ds2 = new DataSourceV2ScriptHelper(this.dataSourceV2Service, params.context)

        const vm = new NodeVM({
            timeout: 5000,
            allowAsync: true,
            wrapper: 'none',
            console: !!params.vmConsole || params.room ? 'redirect' : 'inherit',
            sandbox: {
                ctx: params.context,
                dataSources: dsHelper,
                datasource: ds2,
                request: requestHelper,
                utilities: utils,
                aggregations: agg,
                users: usr,
                variables: vars
            },
        })

        if(params.room) {
            vm.on('console.log',  (...args) => {
                console.log("<<<< console.log", this.eventEmitter)

                this.eventEmitter.emit(`functions.logs`, {
                    room: params.room,
                    level: "log",
                    message: args
                })
            })

            vm.on('console.error',  (...args) => {
                console.log("<<<< console.error", this.eventEmitter)

                this.eventEmitter.emit(`functions.logs`, {
                    room: params.room,
                    level: "error",
                    message: args
                })
            })


        }

        if (!!params.vmConsole) vm.on('console.log', params.vmConsole)

        process.on('uncaughtException', uncaughtException)

        let res = null
        try {
            res = await vm.run(params.script)
            return res instanceof Promise ? await res : res
        } catch (e) {
            console.error(`Run script error: `, e)
            if (!!params.vmConsole) params.vmConsole(e.toString())

            if(params.room) {
                this.eventEmitter.emit(`functions.logs`, {
                    room: params.room,
                    level: "error",
                    message: e.toString()
                })
            }

            throw `${e.toString()}`
        } finally {
            if (!!params.vmConsole) params.vmConsole('Function finished')
            process.off('uncaughtException', uncaughtException)
        }

        let ee = this.eventEmitter

        function uncaughtException(err) {
            console.error('Asynchronous error caught.', err.toString())
            if (!!params.vmConsole) {
                params.vmConsole(err.toString())
            }

            if(params.room) {
                ee.emit(`functions.logs`, {
                    room: params.room,
                    level: "error",
                    message: err.toString()
                })
            }
        }
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
    }
    readonly dataSourcesService: DataSourcesService
    readonly context: Context

    async getByAlias(alias: string) {
        console.log('getByAliasV2', alias)
        try {
            return await this.dataSourcesService.getByAlias(alias, this.context)
        } catch (e) {
            console.error(e)
        }


    }
}

class DataSourceV2ScriptHelper {
    constructor(dataSourcesService: DataSourceV2Service, context: Context) {
        this.service = dataSourcesService
        this.context = context
    }

    private readonly service: DataSourceV2Service
    private readonly context: Context

    async getByAlias(alias: string, withNestedFields = false) {
        return await this.service.getDataSource(alias, withNestedFields, this.context)
    }
}

class AggregationScriptHelper {
    constructor(
        aggService: AggregationsService,
        context: Context,
        vmConsole?: (...args) => void
    ) {
        this.aggService = aggService
        this.context = context
        this.vmConsole = vmConsole
    }
    readonly aggService: AggregationsService
    readonly context: Context
    readonly vmConsole: (...args) => void

    async conduct(params: any) {
        try {
            return await this.aggService.conduct(params, this.context)
        } catch (e) {
            console.error(e)
            if (this.vmConsole) this.vmConsole(e.toString())
        }
    }

    async reverse(params: any) {
        try {
            return await this.aggService.reverse(params, this.context)
        } catch (e) {
            console.error(e)
            if (this.vmConsole) this.vmConsole(e.toString())
        }
    }
}

class UserScriptHelper {
    constructor(userService: UsersService, context: Context) {
        this.context = context
        this.userService = userService
    }

    readonly context: Context
    readonly userService: UsersService

    async getBy(where: any) {
        return this.userService.findOne(where)
    }
}

class VariablesHelper {
    constructor(variablesService: VariablesService, context: Context) {
        this.context = context
        this.service = variablesService
    }
    readonly context: Context
    readonly service: VariablesService

    async get(name: string, defaultValue: any) : Promise<any> {
        return await this.service.get(name, defaultValue, this.context)
    }

    async set(name: string, value: any) : Promise<void> {
        await this.service.set(name, value, this.context)
    }
}

class RequestScriptHelper {
    constructor() {
        this.axios = new Axios({})
    }
    private axios: Axios = null

    async get(url: string, headers: any) {
        console.log('script request get, url - ', url, headers)
        return await this.axios.get(url, {
            headers: headers,
            timeout: 20 * 1000
        })
    }

    async post(url: string, data: any, headers: any) {
        console.log('script request post, url - ', url, data, headers)

        let config = {
            headers: {},
            timeout: 20 * 1000
        }
        if (headers && headers instanceof Object) config.headers = headers

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
        return this.flakeId.generateId().toString()
    }
}
