import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from "@nestjs/websockets";
import { DataItemService } from './dataitem.service';
import { DataItemResponseDto } from "./dto/response.dto";
import { DataItemRequestChangesDto, DataItemRequestDto, DataItemRequestSyncDto } from "./dto/request.dto";
import { Server, Socket } from "socket.io";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@WebSocketGateway()
export class DataItemGateway {
    constructor(private readonly dataItemService: DataItemService) {}

    @WebSocketServer()
    server: Server;

    @SubscribeMessage('data/getMany')
    async getMany(@MessageBody() msg: DataItemRequestDto, @ConnectedSocket() client: Socket) : Promise<DataItemResponseDto> {
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
                await this.dataItemService.update(msg.type, msg.data[i], client['accountId'], client['userId'])
            }

            if (msg.data.length > 0)
                this.server.emit(`${client['accountId']}/data/changed`, {
                    type: msg.type
                })

            return {
                success: true
            }
        } catch (e) {
            console.error(e)
            return {
                success: false,
                error_message: e.toString()

            }
        }
    }

    @SubscribeMessage('data/changes')
    async getChanges(@MessageBody() msg: DataItemRequestChangesDto, @ConnectedSocket() client: Socket) : Promise<DataItemResponseDto> {

        let data = await this.dataItemService.getManyAfterRevision(client['accountId'], msg.type, Number(msg.lastRevision))

        return {
            success: true,
            data: data
        }
    }

}
