import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Server, Socket } from 'socket.io'
import { FunctionsService } from './functions.service'
import { CallWsFunctionDto, RunScriptDto } from "./dto/call-function.dto";
import * as Sentry from '@sentry/node'

@UseGuards(JwtAuthGuard)
@WebSocketGateway()
export class FunctionsGateway {
    @WebSocketServer()
    server: Server

    constructor(private readonly functionsService: FunctionsService) {}

    @SubscribeMessage('functions/call')
    async call(
        @MessageBody() body: CallWsFunctionDto,
        @ConnectedSocket() client: Socket
    ): Promise<any> {
        console.log('functions/call', body)

        let transaction = Sentry.startTransaction({
            name: 'Message: functions/call',
            op: 'websocket.event',
        })
        let span = transaction.startChild({
            name: 'call',
            op: 'functions.call',
        })

        let vmConsole = this.vmConsole.bind(this)

        try {
            let res = await this.functionsService.callByAlias(
                body.alias,
                Object.assign(body.context, {
                    accountId: client['accountId'],
                    userId: client['userId'],
                }),
                vmConsole
            )
            span.setStatus('ok')
            transaction.setStatus('ok')
            return {
                success: true,
                data: res,
            }
        } catch (e) {
            Sentry.captureException(e)
            span.setStatus('error')
            transaction.setStatus('error')
            return {
                success: false,
                error_message: e.toString(),
            }
        } finally {
            span.finish()
            transaction.finish()
        }
    }

    @SubscribeMessage('functions/script/run')
    async run(
        @MessageBody() body: RunScriptDto,
        @ConnectedSocket() client: Socket
    ): Promise<any> {
        try {
            let res = await this.functionsService.runScript({
                script: body.script,
                context: body.context,
                room: body.room
            })
            return {
                success: true,
                data: res,
            }
        } catch (e) {
            return {
                success: false,
                error_message: e.toString(),
            }
        }

    }

    async vmConsole(...args) {
        console.log(`VM stdout: ${args}`)
        this.server.emit(`functions/console.log`, ...args)
    }
}
