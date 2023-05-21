import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { ReportsService } from './reports.service';
import { RenderByIdDto } from "./dto/report.dto";

@WebSocketGateway()
export class ReportsGateway {
    constructor(private readonly reportsService: ReportsService) {}

    @SubscribeMessage('reports/renderById')
    async create(@MessageBody() renderByIdDto: RenderByIdDto) {

        console.log('reports/renderById', renderByIdDto)

        try {
            let re = await this.reportsService.renderById(renderByIdDto);

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
}
