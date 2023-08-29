import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from "@nestjs/websockets";
import { AggregationsService } from './aggregations.service';
import { ApplyDto } from "./dto/aggregation.dto";
import { Socket } from "socket.io";

@WebSocketGateway()
export class AggregationsGateway {
    constructor(private readonly aggregationsService: AggregationsService) {}

    @SubscribeMessage('aggregations/conduct')
    create(@MessageBody() createAggregationDto: ApplyDto, @ConnectedSocket() client: Socket) {
        return this.aggregationsService.conduct(createAggregationDto,
            {
                accountId: client['accountId'],
                userId: client['userId']
            });
    }

}
