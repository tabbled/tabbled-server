import { ApiProperty } from '@nestjs/swagger';
import { DataItemType } from "../entities/dataitem.entity";

export class DataItemRequestDto {
    @ApiProperty()
    type: DataItemType

    @ApiProperty()
    filters?: object | undefined
}