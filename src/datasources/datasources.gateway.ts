import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets'
import { DataSourcesService } from './datasources.service'
import {
    GetDataByIdDto,
    GetDataByKeysDto,
    GetDataManyDto,
    InsertDataDto,
    RemoveDataByIdDto,
    SetValueDto,
    UpdateDataByIdDto
} from "./dto/datasource.dto";
import { Socket } from 'socket.io'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import * as Sentry from '@sentry/node'

@UseGuards(JwtAuthGuard)
@WebSocketGateway()
export class DataSourcesGateway {
    constructor(private readonly dataSourcesService: DataSourcesService) {}

    @SubscribeMessage('dataSources/data/getMany')
    async getDataMany(
        @MessageBody() body: GetDataManyDto,
        @ConnectedSocket() client: Socket
    ) {
        console.log('dataSources/data/getMany, alias: ', body.alias)

        let transaction = Sentry.startTransaction({
            name: 'Message: dataSources/data/getMany',
            op: 'websocket.event',
        })

        let span = transaction.startChild({
            name: 'getDataMany',
            op: 'datasource.getMany',
        })
        try {
            let data = await this.dataSourcesService.getDataMany(
                body.alias,
                body.options,
                {
                    accountId: client['accountId'],
                    userId: client['userId'],
                }
            )

            span.setStatus('ok')
            transaction.setStatus('ok')
            return {
                success: true,
                data: data,
            }
        } catch (e) {
            console.error(e)
            span.setStatus('error')
            transaction.setStatus('error')
            Sentry.captureException(e)
            return {
                success: false,
                error_message: e.toString(),
            }
        } finally {
            span.finish()
            transaction.finish()
        }
    }

    //getCurrentRevisionId
    @SubscribeMessage('dataSources/data/getCurrentRevisionId')
    async getCurrentRevisionId(
        @MessageBody() body: any,
        @ConnectedSocket() client: Socket
    ) {
        console.log(
            'dataSources/data/getCurrentRevisionId, alias: ',
            body.alias,
            'id: ',
            body.id
        )
        try {
            let data = await this.dataSourcesService.getCurrentRevisionId(
                body.alias,
                body.id
            )
            return {
                success: true,
                data: data,
            }
        } catch (e) {
            console.error(e)
            return {
                success: false,
                error_message: e.toString(),
            }
        }
    }

    @SubscribeMessage('dataSources/data/getById')
    async getDataById(
        @MessageBody() body: GetDataByIdDto,
        @ConnectedSocket() client: Socket
    ) {
        console.log(
            'dataSources/data/getById, alias: ',
            body.alias,
            'id: ',
            body.id
        )
        let transaction = Sentry.startTransaction({
            name: 'Message: dataSources/data/getById',
            op: 'websocket.event',
        })
        let span = transaction.startChild({
            name: 'getById',
            op: 'datasource.getById',
        })
        try {
            let data = await this.dataSourcesService.getDataById(
                body.alias,
                body.id,
                {
                    accountId: client['accountId'],
                    userId: client['userId'],
                }
            )
            span.setStatus('ok')
            transaction.setStatus('ok')
            return {
                success: true,
                data: data,
            }
        } catch (e) {
            console.error(e)
            span.setStatus('error')
            transaction.setStatus('error')
            Sentry.captureException(e)
            return {
                success: false,
                error_message: e.toString(),
            }
        } finally {
            span.finish()
            transaction.finish()
        }
    }

    @SubscribeMessage('dataSources/data/getByKeys')
    async getDataByKeys(
        @MessageBody() body: GetDataByKeysDto,
        @ConnectedSocket() client: Socket
    ) {
        console.log(
            'dataSources/data/getByKeys, alias: ',
            body.alias,
            'keys: ',
            body.keys
        )
        let transaction = Sentry.startTransaction({
            name: 'Message: dataSources/data/getByKeys',
            op: 'websocket.event',
        })
        let span = transaction.startChild({
            name: 'getByKeys',
            op: 'datasource.getByKeys',
        })
        try {
            let data = await this.dataSourcesService.getDataByKeys(
                body.alias,
                body.keys,
                {
                    accountId: client['accountId'],
                    userId: client['userId'],
                }
            )
            span.setStatus('ok')
            transaction.setStatus('ok')
            return {
                success: true,
                data: data,
            }
        } catch (e) {
            console.error(e)
            span.setStatus('error')
            transaction.setStatus('error')
            Sentry.captureException(e)
            return {
                success: false,
                error_message: e.toString(),
            }
        } finally {
            span.finish()
            transaction.finish()
        }
    }

    @SubscribeMessage('dataSources/data/insert')
    async insertData(
        @MessageBody() body: InsertDataDto,
        @ConnectedSocket() client: Socket
    ) {
        console.log(
            'dataSources/data/insert, alias: ',
            body.alias,
            'id: ',
            body
        )

        let transaction = Sentry.startTransaction({
            name: 'Message: dataSources/data/insert',
            op: 'websocket.event',
        })
        let span = transaction.startChild({
            name: 'insertData',
            op: 'datasource.insert',
        })
        try {
            let data = await this.dataSourcesService.insertData(
                body.alias,
                body.value,
                {
                    accountId: client['accountId'],
                    userId: client['userId'],
                },
                body.id,
                body.parentId,
                body.route
            )

            span.setStatus('ok')
            transaction.setStatus('ok')
            return {
                success: true,
                data: data,
            }
        } catch (e) {
            console.error(e)
            span.setStatus('error')
            transaction.setStatus('error')
            Sentry.captureException(e)
            return {
                success: false,
                error_message: e.toString(),
            }
        } finally {
            span.finish()
            transaction.finish()
        }
    }

    @SubscribeMessage('dataSources/data/updateById')
    async updateById(
        @MessageBody() body: UpdateDataByIdDto,
        @ConnectedSocket() client: Socket
    ) {
        console.log(
            'dataSources/data/updateById, alias: ',
            body.alias,
            'id: ',
            body.id
        )

        let transaction = Sentry.startTransaction({
            name: 'Message: dataSources/data/updateById',
            op: 'websocket.event',
        })
        let span = transaction.startChild({
            name: 'insertData',
            op: 'datasource.updateById',
        })
        try {
            let data = await this.dataSourcesService.updateDataById(
                body.alias,
                body.id,
                body.value,
                {
                    accountId: client['accountId'],
                    userId: client['userId'],
                },
                body.route
            )
            span.setStatus('ok')
            transaction.setStatus('ok')
            return {
                success: true,
                data: data,
            }
        } catch (e) {
            console.error(e)
            span.setStatus('error')
            transaction.setStatus('error')
            Sentry.captureException(e)
            return {
                success: false,
                error_message: e.toString(),
            }
        } finally {
            span.finish()
            transaction.finish()
        }
    }

    @SubscribeMessage('dataSources/data/removeById')
    async removeById(
        @MessageBody() body: RemoveDataByIdDto,
        @ConnectedSocket() client: Socket
    ) {
        console.log(
            'dataSources/data/removeById, alias: ',
            body.alias,
            'id: ',
            body.id
        )

        let transaction = Sentry.startTransaction({
            name: 'Message: dataSources/data/removeById',
            op: 'websocket.event',
        })
        let span = transaction.startChild({
            name: 'removeById',
            op: 'datasource.removeById',
        })
        try {
            let data = await this.dataSourcesService.removeDataById(
                body.alias,
                body.id,
                {
                    accountId: client['accountId'],
                    userId: client['userId'],
                },
                body.soft,
                body.route
            )

            span.setStatus('ok')
            transaction.setStatus('ok')
            return {
                success: true,
                data: data,
            }
        } catch (e) {
            span.setStatus('error')
            transaction.setStatus('error')
            Sentry.captureException(e)
            console.error(e)
            return {
                success: false,
                error_message: e.toString(),
            }
        } finally {
            span.finish()
            transaction.finish()
        }
    }

    @SubscribeMessage('dataSources/data/setValue')
    async setValue(
        @MessageBody() body: SetValueDto,
        @ConnectedSocket() client: Socket
    ) {
        console.log(
            'dataSources/data/setValue, alias: ',
            body.alias,
            'field: ',
            body.field,
            'id: ',
            body.id
        )

        let transaction = Sentry.startTransaction({
            name: 'Message: dataSources/data/removeById',
            op: 'websocket.event',
        })
        let span = transaction.startChild({ name: 'removeById' })
        try {
            let data = await this.dataSourcesService.setValue(
                body.alias,
                body.id,
                body.field,
                body.value,
                {
                    accountId: client['accountId'],
                    userId: client['userId'],
                },
                body.route
            )

            span.setStatus('ok')
            transaction.setStatus('ok')
            return {
                success: true,
                data: data,
            }
        } catch (e) {
            span.setStatus('error')
            transaction.setStatus('error')
            Sentry.captureException(e)
            console.error(e)
            return {
                success: false,
                error_message: e.toString(),
            }
        } finally {
            span.finish()
            transaction.finish()
        }
    }
}
