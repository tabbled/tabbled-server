import { ApiProperty } from '@nestjs/swagger';
import { DataItem, DataItemType } from "../entities/dataitem.entity";

export class DataItemRequestDto {
    @ApiProperty()
    type: DataItemType

    @ApiProperty()
    filters?: object | undefined
}

export class DataItemRequestSyncDto {
    @ApiProperty()
    type: DataItemType

    @ApiProperty()
    lastRevision: string

    data: Array<DataItem>
}