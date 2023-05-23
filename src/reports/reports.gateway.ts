import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer } from "@nestjs/websockets";
import { ReportsService } from './reports.service';
import { RenderByIdDto } from "./dto/report.dto";
import { Server } from "socket.io";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@WebSocketGateway()
export class ReportsGateway {
    constructor(private readonly reportsService: ReportsService) {}

    @WebSocketServer() server: Server;

    @SubscribeMessage('reports/renderById')
    async create(@MessageBody() renderByIdDto: RenderByIdDto) {

        console.log('reports/renderById', renderByIdDto)
        let vmConsole = this.vmConsole.bind(this)
        try {
            let re = await this.reportsService.renderById(renderByIdDto, vmConsole);

            return {
                success: true,
                data: await re.body()
            }
        } catch (e) {
            return {
                success: false,
                error_message: e.toString()
            }
        }

    }

    async vmConsole(...args) {
        console.log(`VM stdout: ${args}`)
        this.server.emit(`functions/console.log`, ...args)
    }
}