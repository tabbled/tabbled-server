export class RenderByIdDto {
  id: string
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
    templateFormat: 'html' | 'excel'

}