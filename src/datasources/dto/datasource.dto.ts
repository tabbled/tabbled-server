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
    search?: string
    take?: number = 100
    skip?: number = 0
    sort?: {
        field: string
        ask: boolean
    }
}

export class GetDataByIdDto {
    alias: string
    id: string
}

export class InsertDataDto {
    alias: string
    id?: string
    value: any
    parentId?: string
}

export class UpdateDataByIdDto {
    alias: string
    id: string
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
    items: any[]
    count: number
}