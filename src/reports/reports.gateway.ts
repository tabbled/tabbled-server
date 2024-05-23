import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    WebSocketServer,
} from '@nestjs/websockets'
import { ReportsService } from './reports.service'
import { RenderByIdDto } from './dto/report.dto'
import { Server } from 'socket.io'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import * as Sentry from '@sentry/node'

@UseGuards(JwtAuthGuard)
@WebSocketGateway()
export class ReportsGateway {
    constructor(private readonly reportsService: ReportsService) {}

    @WebSocketServer() server: Server

    @SubscribeMessage('reports/renderById')
    async create(@MessageBody() renderByIdDto: RenderByIdDto) {
        console.log('reports/renderById', renderByIdDto)

        let transaction = Sentry.startTransaction({
            name: 'Message: reports/renderById',
            op: 'websocket.event',
        })
        let span = transaction.startChild({
            name: 'renderById',
            op: 'reports.renderById',
        })

        let vmConsole = this.vmConsole.bind(this)
        try {
            let re = await this.reportsService.renderById(
                renderByIdDto,
                vmConsole
            )

            span.setStatus('ok')
            transaction.setStatus('ok')
            return {
                success: true,
                data: {
                    contentType: re.contentType,
                    report: await re.data.body(),
                    filename: re.filename,
                },
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

    async vmConsole(...args) {
        console.log(`VM stdout: ${args}`)
        this.server.emit(`functions/console.log`, ...args)
    }
}
