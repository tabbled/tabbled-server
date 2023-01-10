import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from "@nestjs/websockets";
import { DataItemService } from './dataitem.service';
import { DataItemResponseDto } from "./dto/response.dto";
import { DataItemRequestDto, DataItemRequestSyncDto } from "./dto/request.dto";
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

    @SubscribeMessage('data/sync')
    async syncMany(@MessageBody() msg: DataItemRequestSyncDto, @ConnectedSocket() client: Socket) : Promise<DataItemResponseDto> {
        console.log('DataItems.sync')

        for (let i in msg.data) {
            await this.dataItemService.update(msg.type, msg.data[i], client['accountId'], client['userId'])
        }

        let data = await this.dataItemService.getManyAfterRevision(client['userId'], msg.type, Number(msg.lastRevision))

        return {
            success: true,
            data: data
        }
    }

}
