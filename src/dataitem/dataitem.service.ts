import { Injectable } from '@nestjs/common';
import { DataItem, DataItemType } from "./entities/dataitem.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DataItemDto } from "./dto/dataitem.dto";

@Injectable()
export class DataItemService {
    constructor(@InjectRepository(DataItem)
                private dataItemsRepository: Repository<DataItem>) {
    }

    async getMany(accountId: number, type: any, filter?: any): Promise<any> {
        console.log(filter)
        return await this.dataItemsRepository.findBy({
            accountId: accountId,
            type: type
        })
    }

    async update(type: DataItemType, data: DataItemDto, accountId: number, userId: number) {
        const items = await this.dataItemsRepository.findBy({
            id: data.id,
        })

        let item = items.length > 0 ? items[0] : null;


        console.log('update', accountId, userId)

        // if (item)
        //
        if (!item) {
            let r = await this.dataItemsRepository.createQueryBuilder()
                .insert()
                .into(DataItem)
                .values({
                    id: data.id,
                    rev: data.rev,
                    ver: data.ver,
                    alias: data.alias,
                    type: type,
                    accountId: accountId,
                    data: data.data,
                })
                .execute()

            console.log('inset item', r)
        }


    }
}
