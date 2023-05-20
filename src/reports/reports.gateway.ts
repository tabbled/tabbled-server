import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { ReportsService } from './reports.service';
import { RenderByIdDto } from "./dto/report.dto";

@WebSocketGateway()
export class ReportsGateway {
    constructor(private readonly reportsService: ReportsService) {}

    @SubscribeMessage('renderById')
    create(@MessageBody() renderByIdDto: RenderByIdDto) {

        console.log('reports/renderById', renderByIdDto)

        try {
            let res = this.reportsService.renderById(renderByIdDto);

            return {
                success: true,
                report: res
            }
        } catch (e) {
            return {
                success: false,
                error_message: e.toString()
            }
        }
    }
}
