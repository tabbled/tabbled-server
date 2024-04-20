import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer
} from "@nestjs/websockets";
import { ConfigService } from "./config.service";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Server, Socket } from "socket.io";
import { ConfigExportDto, ConfigImportDto, GetByIdDto, GetByKeyDto, GetManyDto, UpsertDto } from "./dto/request.dto";
import { RemoveDataByIdDto } from "../datasources/dto/datasource.dto";

@UseGuards(JwtAuthGuard)
@WebSocketGateway()
export class ConfigGateway {
    constructor(private readonly configService: ConfigService) {}

    @WebSocketServer()
    server: Server;

    @SubscribeMessage('config/getMany')
    async getMany(@MessageBody() msg: GetManyDto, @ConnectedSocket() client: Socket) : Promise<any> {
        console.log('config/getMany', msg)

        try {
            let data = await this.configService.getMany(msg)

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

    @SubscribeMessage('config/getById')
    async getById(@MessageBody() msg: GetByIdDto, @ConnectedSocket() client: Socket) : Promise<any> {
        console.log('config/getById', msg)

        try {
            let data = await this.configService.getByIdRaw(msg)
            return {
                success: true,
                data: data.data
            }
        } catch (e) {
            console.error(e)
            return {
                success: false,
                error_message: e.toString()
            }
        }
}

    @SubscribeMessage('config/getByKey')
    async getByKey(@MessageBody() msg: GetByKeyDto, @ConnectedSocket() client: Socket) : Promise<any> {
        console.log('config/getByKey', msg)

        try {
            let data = await this.configService.getByKeyRaw(msg)

            return {
                success: true,
                data: data.data
            }
        } catch (e) {
            console.error(e)
            return {
                success: false,
                error_message: e.toString()
            }
        }
    }

    @SubscribeMessage('config/insert')
    async insert(@MessageBody() msg: UpsertDto, @ConnectedSocket() client: Socket) : Promise<any> {
        console.log('config/insert', msg)

        try {
            let item = await this.configService.insert(msg.alias, msg.id, msg.value, {
                accountId: client['accountId'],
                userId: client['userId']
            })
            return {
                success: true,
                data: item.data
            }
        } catch (e) {
            console.error(e)
            return {
                success: false,
                error_message: e.toString()
            }
        }
    }

    @SubscribeMessage('config/update')
    async syncMany(@MessageBody() msg: any, @ConnectedSocket() client: Socket) : Promise<any> {
        console.log('ConfigItems.sync, ', 'msg =', msg.data)
        try {
            for (let i in msg.data) {
                await this.configService.update(msg.data[i], client['userId'])
            }

            if (msg.data.length > 0)
                this.server.emit(`config/changed`, {})

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

    @SubscribeMessage('config/updateById')
    async updateById(@MessageBody() body: UpsertDto, @ConnectedSocket() client: Socket) {
        console.log('config/updateById, alias: ', body.alias, "id: ", body.id)

        try {
            let data = await this.configService.updateById(
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

    @SubscribeMessage('config/removeById')
    async removeById(@MessageBody() body: RemoveDataByIdDto, @ConnectedSocket() client: Socket) {
        console.log('config/removeById, alias: ', body.alias, "id: ", body.id)

        try {
            let data = await this.configService.removeById(
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

    @SubscribeMessage('config/import')
    async import(@MessageBody() config: ConfigImportDto, @ConnectedSocket() client: Socket) : Promise<any> {
        console.log('config/import, version: ', config.version, "rev: " + config.rev)
        try {
            await this.configService.import(config, client['userId'])
            this.server.emit(`config/changed`, {})

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

    @SubscribeMessage('config/export')
    async export(@MessageBody() params: ConfigExportDto, @ConnectedSocket() client: Socket) : Promise<any> {
        console.log('config/export', params)
        try {
            let config = await this.configService.export(params)

            return {
                success: true,
                data: config
            }
        } catch (e) {
            console.error(e)
            return {
                success: false,
                error_message: e.toString()
            }
        }
    }

    @SubscribeMessage('config/params/get')
    async getParam(@MessageBody() body, @ConnectedSocket() client: Socket) : Promise<any> {
        console.log('config/params/get', body.id)
        try {
            let value = await this.configService.getParameter(body.id)

            return {
                success: true,
                data: value
            }
        } catch (e) {
            console.error(e)
            return {
                success: false,
                error_message: e.toString()
            }
        }
    }

    @SubscribeMessage('config/params/set')
    async setParam(@MessageBody() body, @ConnectedSocket() client: Socket) : Promise<any> {
        console.log('config/params/set', body.id)
        try {
            await this.configService.setParameter(body.id, body.value)

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
