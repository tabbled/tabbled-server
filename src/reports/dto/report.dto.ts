import {ResponseDto} from "../../common/dto/response"
import { FieldDataType } from "../../entities/field";

export class RenderByIdRequestDto {
    id: string
    context: any
    params: any
    output: 'xlsx' | 'pdf'
}

export class RenderByIdResponseDto extends ResponseDto {
    contentType: string
    report: string
    filename: string
    renderingTime: number
    preparingTime: number
}

export class RenderByAliasRequestDto {
    context: any
}




export class ReportDto {
    id: string
    alias: string
    title: string
    template: string
    script: string
    testContext: string
    templateExcel?: string
    templateFormat: 'html' | 'excel' | 'html-to-xlsx'
    pageSettings: any
}

export interface ReportParameterDto {
    alias: string
    type: FieldDataType,
    title: string,
    isMultiple?: boolean
}

export interface DatasetDto {
    alias: string
    datasource?: string
    fields?: DatasetFieldDto[]
    filterBy?: string
    filters?: any[],
    groupBy?: string[]
    sort: DatasetSortDto[]
}

export interface DatasetFieldDto {
    alias: string,
    type: 'data' | 'calc'
    format?: string
    aggFunc?: 'none' | 'sum' | 'avg' | 'min' | 'max'
}

export interface DatasetSortDto {
    alias: string
    order: 'asc' | 'desc'
}

export class ReportV2Dto {
    id?: string
    accountId: number
    version: number
    title: string
    parameters: ReportParameterDto[]
    description?: string
    templateType: 'html' | 'excel'
    permissions: any
    html?: string
    xlsx?: string
    style?: string
    postprocessing?: string
    datasets: DatasetDto[]
    pages: string[]
    pageSettings: {
        size?: string,
        layout?: 'portrait' | 'landscape'
        margin?: 'default' | 'custom'
        marginTop?: number,
        marginLeft?: number,
        marginRight?: number,
        marginBottom?: number
    }
}

export class PreviewRequestDto {
    report: ReportV2Dto
    params: {
        [key in string]: any
    }
    output: 'xlsx' | 'pdf'
}

export class PostprocessRequestDto {
    report: ReportV2Dto
    params: {
        [key in string]: any
    }
}

export class RenderReportResponseDto extends ResponseDto {
    contentType: string
    report: string
    filename: string
    renderingTime: number
    preparingTime: number
}

export class PostprocessReportResponseDto extends ResponseDto {
    data: any
}

export class AddReportResponse extends ResponseDto {
    id: number
}

export class UpdateReportByAliasRequest extends ReportV2Dto {

}

export class GetOneByAliasDto  extends ResponseDto {
    report?: ReportV2Dto
}

export class GetParamsByAliasDto extends ResponseDto {
    report?: {
        alias: string,
        description: string,
        parameters: ReportParameterDto[]
    }
}



export class GetReportsManyResponse extends ResponseDto {
    items: {
        id: string
        title: string
    }[]
}
