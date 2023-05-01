import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from "@nestjs/websockets";
import { DataSourcesService } from './datasources.service';
import {
    GetDataByIdDto,
    GetDataManyDto,
    InsertDataDto,
    RemoveDataByIdDto, SetValueDto,
    UpdateDataByIdDto
} from "./dto/datasource.dto";
import { Socket } from "socket.io";

@WebSocketGateway()
export class DataSourcesGateway {
    constructor(private readonly dataSourcesService: DataSourcesService) {}

    @SubscribeMessage('dataSources/data/getMany')
    async getDataMany(@MessageBody() body: GetDataManyDto, @ConnectedSocket() client: Socket) {
        console.log('dataSources/data/getMany, alias: ', body.alias)

        try {
            let data = await this.dataSourcesService.getDataMany(
                body.alias,
                body.options,
                {
                    accountId: client['accountId'],
                    userId: client['userId']
                }
            )

            return {
                success: true,
                data: data,
            }
        } catch (e) {
            console.error(e)
            return {
                success: false,
                error_message: e.toString()
            }
        }
    }

    @SubscribeMessage('dataSources/data/getById')
    async getDataById(@MessageBody() body: GetDataByIdDto, @ConnectedSocket() client: Socket) {
        console.log('dataSources/data/getById, alias: ', body.alias, "id: ", body.id)

        try {
            let data = await this.dataSourcesService.getDataById(
                body.alias,
                body.id,
                {
                    accountId: client['accountId'],
                    userId: client['userId']
                }
            )

            return {
                success: true,
                data: data,
            }
        } catch (e) {
            console.error(e)
            return {
                success: false,
                error_message: e.toString()
            }
        }
    }

    @SubscribeMessage('dataSources/data/insert')
    async insertData(@MessageBody() body: InsertDataDto, @ConnectedSocket() client: Socket) {
        console.log('dataSources/data/insert, alias: ', body.alias, "id: ", body.id)

        try {
            let data = await this.dataSourcesService.insertData(
                body.alias,
                body.value,
                {
                    accountId: client['accountId'],
                    userId: client['userId']
                },
                body.id
            )

            return {
                success: true,
                data: data,
            }
        } catch (e) {
            console.error(e)
            return {
                success: false,
                error_message: e.toString()
            }
        }
    }

    @SubscribeMessage('dataSources/data/updateById')
    async updateById(@MessageBody() body: UpdateDataByIdDto, @ConnectedSocket() client: Socket) {
        console.log('dataSources/data/updateById, alias: ', body.alias, "id: ", body.id)

        try {
            let data = await this.dataSourcesService.updateDataById(
                body.alias,
                body.id,
                body.value,
                {
                    accountId: client['accountId'],
                    userId: client['userId']
                }
            )

            return {
                success: true,
                data: data,
            }
        } catch (e) {
            console.error(e)
            return {
                success: false,
                error_message: e.toString()
            }
        }
    }

    @SubscribeMessage('dataSources/data/removeById')
    async removeById(@MessageBody() body: RemoveDataByIdDto, @ConnectedSocket() client: Socket) {
        console.log('dataSources/data/removeById, alias: ', body.alias, "id: ", body.id)

        try {
            let data = await this.dataSourcesService.removeDataById(
                body.alias,
                body.id,
                {
                    accountId: client['accountId'],
                    userId: client['userId']
                },
                body.soft
            )

            return {
                success: true,
                data: data,
            }
        } catch (e) {
            console.error(e)
            return {
                success: false,
                error_message: e.toString()
            }
        }
    }

    @SubscribeMessage('dataSources/data/setValue')
    async setValue(@MessageBody() body: SetValueDto, @ConnectedSocket() client: Socket) {
        console.log('dataSources/data/setValue, alias: ', body.alias, "field: ", body.field, "id: ", body.id)

        try {
            let data = await this.dataSourcesService.setValue(
                body.alias,
                body.id,
                body.field,
                body.value,
                {
                    accountId: client['accountId'],
                    userId: client['userId']
                }
            )

            return {
                success: true,
                data: data,
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
