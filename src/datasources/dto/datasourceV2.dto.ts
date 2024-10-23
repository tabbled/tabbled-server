
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray, IsBoolean, IsEnum,
    IsInt, IsNotEmpty, IsNumber, IsObject,
    IsOptional,
    IsString, Matches, MinLength, ValidateIf, ValidateNested
} from "class-validator";
import { FilterItemInterface } from "./datasource.dto";
import { DatasourceField } from "../entities/field.entity";
import { Type } from "class-transformer";

export enum DataSourceType {
    internal = 'internal',
    internalDB = 'internal-db',
    custom = 'custom',
    field = 'field',
}

export interface EnumValue {
    key: string
    title: string
}

export type AccessType = 'all' | 'roles' | 'nobody'
export enum Access {
    'canSelect' = 'canSelect',
    'canAdd' = 'canAdd',
    'canUpdate' = 'canUpdate',
    'canDelete' = 'canDelete'
}

export interface DataSourceV2Dto {
    id?: string
    alias: string
    title: string
    type: DataSourceType
    isTree: boolean
    isSystem: boolean
    permissions: {
        [key in Access]: {
            type: AccessType
            roles?: string[]
        }
    }
    script?: string // Only for type = custom
    context?: string
    fields?: DatasourceField[]
    version: number
    createdBy: number
    updatedBy: number
    deletedBy?: number
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date
}

export enum FieldType {
    'number' = 'number',
    'string' = 'string',
    'bool' = 'bool',
    'text' = 'text',
    'enum' = 'enum',
    'image' = 'image',
    'file' = 'file',
    'datetime' = 'datetime',
    'date' = 'date',
    'time' = 'time',
    'link' = 'link',
    'table' = 'table'
}


export class DatasourceFieldDto {
    @IsString()
    @Matches(`^[a-zA-Z_][a-zA-Z0-9_]*$`,"",
        {message: "Alias is not valid"})
    alias: string

    @IsEnum(FieldType)
    type: FieldType

    @IsString()
    title: string

    @IsBoolean()
    @IsOptional()
    searchable?: boolean

    @IsBoolean()
    @IsOptional()
    filterable?: boolean

    @IsBoolean()
    @IsOptional()
    sortable?: boolean

    @IsBoolean()
    @IsOptional()
    isMultiple?: boolean

    @IsString()
    @IsOptional()
    defaultValue?: string

    @IsString()
    @ValidateIf(o => o.type === 'link' || o.type === 'table')
    datasourceReference?: string

    @IsBoolean()
    @IsOptional()
    @ValidateIf(o => o.type === 'number')
    autoincrement?: boolean

    @IsBoolean()
    @IsOptional()
    isNullable?: boolean

    @IsNumber()
    @IsOptional()
    @ValidateIf(o => o.type === 'number')
    precision?: number

    @IsString()
    @IsOptional()
    format?: string

    @IsArray()
    @ValidateIf(o => o.type === 'enum')
    enumValues?: EnumValue[]
}

export class InsertDataSourceRequestDto {
    @IsString()
    @Matches(`^[a-zA-Z_][a-zA-Z0-9_]*$`,"",
        {message: "Alias is not valid"})
    alias: string

    @IsString()
    title: string

    @IsEnum(DataSourceType)
    type: DataSourceType

    @IsBoolean()
    @IsOptional()
    isTree: boolean

    @IsObject()
    @IsOptional()
    permissions: {
        [key in Access]: {
            type: AccessType
            roles?: string[]
        }
    }

    @IsString()
    @IsOptional()
    script?: string // Only for type = custom

    @IsString()
    @IsOptional()
    context?: string

    @IsArray()
    @IsNotEmpty()
    @ValidateNested({each: true})
    @Type(() => DatasourceFieldDto)
    fields?: DatasourceFieldDto[]
}



export class GetRevisionsDto {
    dataSourceAlias: string
    itemId: string
}

export class DataItem {
    id: string
    [index: string]: any
}

export class GetRevisionByIdDto {
    dataSourceAlias: string
    itemId: string
    revisionId: number
}

export class RevisionItem {
    id:  Uint8Array
    version: number
    createdAt: Date
    createdBy: {
        id: number,
        username: string,
        title: string
    }
    data?: any
}

export class GetRevisionsResponseDto {
    items: RevisionItem[]
    count: number
}

export class ResponseDto {
    statusCode: number
    error?: string
    message?: string[]
}

export class InsertDataSourceResponseDto extends ResponseDto {
    id: string
}

export class DataIndexResponseDto extends ResponseDto {
    jobId: string
}

export class DataIndexRequestDto {

    @IsArray()
    @IsOptional()
    @ArrayMinSize(1)
    @ArrayMaxSize(1000)
    @IsString({
        each: true
    })
    ids?: string[]
}

export class GetFieldsManyDto {
    datasource: string
    nested?: boolean
}

export class DataReindexDto extends DataIndexRequestDto{
    dataSourceConfig: DataSourceV2Dto
}

export class GetDataManyDto {
    items: any
    count: number
}

export class GetManyResponseDto extends ResponseDto {
    items: any
    count: number
}

export class GetDataManyResponseDto extends ResponseDto {
    items: DataItem[]
    count: number
}

export class GetDataManyRequestDto {
    @IsOptional()
    @IsArray()
    filter?: FilterItemInterface[]

    @IsOptional()
    @IsString()
    filterBy?:string

    @IsOptional()
    @IsArray()
    searchBy?:string[]

    @IsOptional()
    @IsArray()
    fields?: string[]

    @IsOptional()
    @IsString()
    query?: string

    @IsOptional()
    @IsInt()
    limit?: number = 100

    @IsOptional()
    @IsInt()
    offset?: number = 0

    @IsOptional()
    @IsArray()
    sort?: string[]

    @IsOptional()
    @IsString()
    parentId?: string
}

export class UpsertDataSourceDataRequestDto {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(2)
    items: any[]

    @IsOptional()
    @IsBoolean()
    returnItems?: boolean
}

export class DeleteDataSourceDataRequestDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateIf(o => o.where === undefined || !o.where )
    ids?: string[]


    @IsString()
    @ValidateIf(o => o.ids === undefined)
    @MinLength(3)
    where?: string

    @IsOptional()
    @IsBoolean()
    soft?: boolean
}

export class UpsertDataSourceDataResponseDto extends ResponseDto {
    items: any[]
}



export const SystemFields:DatasourceField[] = [{
    id: "1",
    alias: "id",
    type: FieldType.string,
    title: "Id",
    sortable: true,
    filterable: true,
    searchable: true,
    isSystem: true,
    isNullable: false
},{
    id: "2",
    alias: "version",
    type: FieldType.number,
    title: "Version",
    sortable: true,
    filterable: true,
    isSystem: true,
    isNullable: false
},{
    id: "3",
    alias: "parent_id",
    type: FieldType.link,
    title: "Parent Id",
    sortable: true,
    filterable: true,
    isSystem: true,
    isNullable: true
},{
    id: "4",
    alias: "created_at",
    type: FieldType.datetime,
    title: "Created At",
    sortable: true,
    filterable: true,
    isSystem: true,
    defaultValue: "now()"
},{
    id: "5",
    alias: "updated_at",
    type: FieldType.datetime,
    title: "Updated At",
    sortable: true,
    filterable: true,
    isSystem: true,
    defaultValue: "now()"

},{
    id: "6",
    alias: "created_by",
    type: FieldType.link,
    datasourceAlias: "users",
    title: "Created By",
    sortable: true,
    filterable: true,
    isSystem: true
},{
    id: "7",
    alias: "updated_by",
    type: FieldType.link,
    title: "Updated By",
    datasourceAlias: "users",
    sortable: true,
    filterable: true,
    isSystem: true
},{
    id: "8",
    alias: "deleted_at",
    type: FieldType.datetime,
    title: "Deleted At",
    sortable: true,
    filterable: true,
    isSystem: true,
    isNullable: true
},{
    id: "9",
    alias: "deleted_by",
    type: FieldType.link,
    datasourceAlias: "users",
    title: "Deleted By",
    sortable: true,
    filterable: true,
    isSystem: true,
    isNullable: true
}]