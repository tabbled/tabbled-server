import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from "@nestjs/websockets";
import { DataItemService } from './dataitem.service';
import { DataItemResponseDto } from "./dto/response.dto";
import { DataItemRequestDto } from "./dto/request.dto";
import { Socket } from "socket.io";

@WebSocketGateway()
export class DataItemGateway {
    constructor(private readonly dataItemService: DataItemService) {}

    @SubscribeMessage('data/getMany')
    async getMany(@MessageBody() msg: DataItemRequestDto, @ConnectedSocket() client: Socket) : Promise<DataItemResponseDto> {
        console.log('DataItems.getMany, ', msg)
        let data = await this.dataItemService.getMany(client['userId'], msg.type)

        return {
            success: true,
            data: data
        }
    }

}
