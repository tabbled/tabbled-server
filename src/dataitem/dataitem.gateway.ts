import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from "@nestjs/websockets";
import { DataItemService } from './dataitem.service';
import { DataItemResponseDto } from "./dto/response.dto";
import { DataItemRequestChangesDto, DataItemRequestDto, DataItemRequestSyncDto } from "./dto/request.dto";
import { Server, Socket } from "socket.io";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthGuard } from "../auth/auth.guard";


@UseGuards(JwtAuthGuard, AuthGuard)
@WebSocketGateway()
export class DataItemGateway {
    constructor(private readonly dataItemService: DataItemService) {}

    @WebSocketServer()
    server: Server;

    @SubscribeMessage('data/getMany')
    async getMany(@MessageBody() msg: DataItemRequestDto, @ConnectedSocket() client: Socket) : Promise<DataItemResponseDto> {
        let data = await this.dataItemService.getMany(client['accountId'])

        return {
            success: true,
            data: data
        }
    }

    @SubscribeMessage('data/update')
    async syncMany(@MessageBody() msg: DataItemRequestSyncDto, @ConnectedSocket() client: Socket) : Promise<DataItemResponseDto> {
        console.log('DataItems.sync, ', 'msg =', msg.data)
        try {
            for (let i in msg.data) {
                await this.dataItemService.update(msg.data[i], client['accountId'], client['userId'])
            }

            if (msg.data.length > 0)
                this.server.emit(`${client['accountId']}/data/changed`, {})

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

    @SubscribeMessage('data/getChanges')
    async getChanges(@MessageBody() msg: DataItemRequestChangesDto, @ConnectedSocket() client: Socket) : Promise<DataItemResponseDto> {

        let data = await this.dataItemService.getManyAfterRevision(client['accountId'], Number(msg.lastRevision))

        console.log('data/getChanges', msg, 'length data: ', data.length)

        return {
            success: true,
            data: data
        }
    }

    @SubscribeMessage('data/import')
    async import(@MessageBody() data: any, @ConnectedSocket() client: Socket) : Promise<any> {
        console.log('data/import')
        try {
            await this.dataItemService.import(data, client['accountId'], client['userId'])
            this.server.emit(`data/changed`, {})

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
}
