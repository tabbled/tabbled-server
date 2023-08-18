import { ApiProperty } from "@nestjs/swagger";

export declare type StandardQueryOperator = '<' | '<=' | '==' | '!=' | '>' | '>=' | 'exists' | '!exists' | 'between' | '!between' | 'like' | '!like' | 'matches' | '!matches' | 'in' | '!in' | 'has' | '!has' | 'contains' | '!contains';
export interface FilterItemInterface {
    key: string,
    op: StandardQueryOperator,
    compare?: any
}

export class GetDataManyDto {
    alias: string
    options: GetDataManyOptionsDto
}

export class GetDataManyOptionsDto {
    filter?: FilterItemInterface[]
    fields?: string[]
    search?: string
    take?: number = 100
    skip?: number = 0
    sort?: {
        field: string
        ask: boolean
    }
    include?: string[]
    id?: string[]
    parentId?: string
}

export class GetDataByIdDto {
    alias: string
    id: string
}

export class InsertDataDto {
    alias: string

    @ApiProperty()
    id?: string

    @ApiProperty()
    value: any

    @ApiProperty()
    parentId?: string
}

export class UpdateDataByIdDto {
    alias: string

    @ApiProperty()
    id: string

    @ApiProperty()
    value: any
}

export class RemoveDataByIdDto {
    alias: string
    id: string
    soft: boolean = true
}

export class SetValueDto {
    alias: string
    id: string
    value: any
    field: string
    soft: boolean = true
}

export class ImportDataDto {
    options: ImportDataOptionsDto
    data: any[]
}

export class ImportDataOptionsDto {
    replaceExisting: boolean
    removeNotExisting: boolean
}

export class GetManyResponse {
    @ApiProperty()
    items: GetManyItemResponse[]

    @ApiProperty()
    count: number
}

export class GetManyItemResponse {
    @ApiProperty()
    id: string

    @ApiProperty()
    parentId?: string

    @ApiProperty()
    hasChildren?: number

    [name: string]: any | never
}