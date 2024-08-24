
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsInt,
    IsOptional,
    IsString
} from "class-validator";
import { DataSourceConfigInterface } from "../entities/datasource.entity";
import { FilterItemInterface } from "./datasource.dto";
import { FieldConfigInterface } from "../../entities/field";

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

export class DataReindexDto extends DataIndexRequestDto{
    dataSourceConfig: DataSourceConfigInterface
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

export class GetDataManyParamsDto extends GetDataManyRequestDto{
    dataSourceConfig: DataSourceConfigInterface
}


export const SystemFields:FieldConfigInterface[] = [{
    alias: "id",
    type: "string",
    title: "Id",
    sortable: true,
    filterable: true,
    searchable: true,
    isSystem: true
},{
    alias: "version",
    type: "number",
    title: "Version",
    sortable: true,
    filterable: true,
    isSystem: true
},{
    alias: "rev",
    type: "string",
    title: "Revision",
    sortable: true,
    filterable: true,
    isSystem: true
},{
    alias: "parent_id",
    type: "link",
    title: "Parent Id",
    sortable: true,
    filterable: true,
    isSystem: true
},{
    alias: "created_at",
    type: "datetime",
    title: "Created At",
    sortable: true,
    filterable: true,
    isSystem: true
},{
    alias: "updated_at",
    type: "datetime",
    title: "Updated At",
    sortable: true,
    filterable: true,
    isSystem: true
},{
    alias: "created_by",
    type: "link",
    datasource: "users",
    title: "Created By",
    sortable: true,
    filterable: true,
    isSystem: true
},{
    alias: "updated_by",
    type: "link",
    title: "Updated By",
    datasource: "users",
    sortable: true,
    filterable: true,
    isSystem: true
},{
    alias: "deleted_at",
    type: "datetime",
    title: "Deleted At",
    sortable: true,
    filterable: true,
    isSystem: true
},{
    alias: "deleted_by",
    type: "link",
    datasource: "users",
    title: "Deleted By",
    sortable: true,
    filterable: true,
    isSystem: true
}]