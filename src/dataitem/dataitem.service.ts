import { Injectable } from '@nestjs/common';
import { DataItem } from "./entities/dataitem.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

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
}
