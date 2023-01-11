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
        if (!client['accountId'] || !client['userId']) {
            console.error("No accountId or userId, accountId =", client['accountId'], ", userId = ", client['userId'])
            return {
                success: false,
                error_message: "Server error"
            }
        }

        try {
            for (let i in msg.data) {
                console.log(i)
                console.log(msg.data[i])
                await this.dataItemService.update(msg.type, msg.data[i], client['accountId'], client['userId'])
                console.log(i)
            }

            let data = await this.dataItemService.getManyAfterRevision(client['accountId'], msg.type, Number(msg.lastRevision))

            return {
                success: true,
                data: data
            }
        } catch (e) {
            console.error(e)
            return {
                success: false,
                error_message: e.toString()

            }
        }




    }

}
