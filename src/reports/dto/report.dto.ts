import {ResponseDto} from "../../common/dto/response"

export class RenderByIdRequestDto {
    id: string
    context: any
}

export class RenderByIdResponseDto extends ResponseDto {
    contentType: string
    report: string
    filename: string
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

export class GetReportsManyResponse extends ResponseDto {
    items: {
        id: string
        alias: string
        title: string
    }[]
}
