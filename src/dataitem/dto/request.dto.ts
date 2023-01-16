import { ApiProperty } from '@nestjs/swagger';
import { DataItem } from "../entities/dataitem.entity";

export class DataItemRequestDto {
    @ApiProperty()
    filters?: object | undefined
}

export class DataItemRequestSyncDto {
    @ApiProperty()
    data: Array<DataItem>
}

export class DataItemRequestChangesDto {
    @ApiProperty()
    lastRevision: string
}