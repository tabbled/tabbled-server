import { Injectable } from '@nestjs/common';
import { DataItem } from "./entities/dataitem.entity";
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

    async update(data: DataItemDto) {
        const item = await this.dataItemsRepository.findBy({
            id: data.id,
        })
        console.log('update', item)
    }
}
