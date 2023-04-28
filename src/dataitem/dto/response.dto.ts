import { ApiProperty } from '@nestjs/swagger';
import {DataItemDto} from "./dataitem.dto";

export class DataItemResponseDto {
    @ApiProperty()
    error_message?: string

    @ApiProperty()
    success: boolean

    @ApiProperty()
    data?: Array<DataItemDto>
}

export class DataItemChangesResponseDto {
    @ApiProperty()
    error_message?: string

    @ApiProperty()
    success: boolean

    @ApiProperty()
    data?: {
        items: {
            [key: string]: Array<DataItemDto>
        },
        lastRev: string,
        length: number
    }

}

