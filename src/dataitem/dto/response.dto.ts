import { ApiProperty } from '@nestjs/swagger';

export class DataItemResponseDto {
    @ApiProperty()
    error_message?: string

    @ApiProperty()
    success: boolean

    @ApiProperty()
    data: Array<DataItemDto>
}

export class DataItemDto {
    @ApiProperty()
    id: number

    @ApiProperty()
    rev: number

    @ApiProperty()
    ver: number

    @ApiProperty()
    alias: string

    @ApiProperty()
    data: {
        [key: string]: any
    }

    @ApiProperty()
    createdAt: Date

    @ApiProperty()
    updatedAt: Date

    @ApiProperty()
    deletedAt?: Date | null | undefined

    @ApiProperty()
    createdBy: number

    @ApiProperty()
    updatedBy: number

    @ApiProperty()
    deletedBy?: number | null | undefined
}