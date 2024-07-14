import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { Context } from '../entities/context'
import { FunctionsService } from '../functions/functions.service'
import { RoomsService } from '../rooms/rooms.service'
import {
    GetRevisionByIdDto,
    GetRevisionsDto,
    GetRevisionsResponseDto
} from "./dto/datasourceV2.dto";
import { Revision } from "./entities/dataitem.entity";
import { User } from "../users/entities/user.entity";

@Injectable()
export class DataSourceV2Service {
    constructor(
        @Inject(forwardRef(() => FunctionsService))
        private functionsService: FunctionsService,
        @InjectDataSource('default')
        private datasource: DataSource,
        @Inject(RoomsService)
        private rooms: RoomsService
    ) {}

    async getRevisions(params: GetRevisionsDto, context: Context) : Promise<GetRevisionsResponseDto> {
        let rep = this.datasource.getRepository(Revision)
        const query = await rep
            .createQueryBuilder('rev')
            .select('rev.id, version, rev.created_at, created_by, user.username, user.firstname, user.lastname')
            .where(
                `alias = :alias AND account_id = :accountId AND item_id = :itemId`,
                {
                    alias: params.dataSourceAlias,
                    itemId: params.itemId,
                    accountId: context.accountId
                }
            ).leftJoin(User, 'user', 'user.id = rev.created_by')
            .orderBy('created_at', "DESC")

        let items = await query.getRawMany()

        return {
            items: items.map(i => { return {
                id: i.id,
                version: i.version,
                createdAt: i.created_at,
                createdBy: {
                    id: i.created_by,
                    username: i.created_by ? i.username : 'system',
                    title: i.created_by ? `${i.firstname} ${i.lastname}` : undefined
                }
            }}),
            count: items.length
        }
    }

    async getRevisionById(params: GetRevisionByIdDto, context: Context) : Promise<any> {
        let rep = this.datasource.getRepository(Revision)
        const query = await rep
            .createQueryBuilder('rev')
            .select('rev.id, version, rev.created_at, created_by, user.username, user.firstname, user.lastname, rev.data')
            .where(
                'alias = :alias AND account_id = :accountId AND item_id = :itemId AND rev.id = :revId',
                {
                    alias: params.dataSourceAlias,
                    itemId: params.itemId,
                    accountId: context.accountId,
                    revId: params.revisionId
                }
            ).leftJoin(User, 'user', 'user.id = rev.created_by')

        let item = await query.getRawOne()
        return {
            id: item.id,
            version: item.version,
            createdAt: item.created_at,
            createdBy: {
                id: item.created_by,
                username: item.created_by ? item.username : undefined,
                title: item.created_by ? `${item.firstname} ${item.lastname}` : undefined
            },
            data: item.data
        }
    }
}
