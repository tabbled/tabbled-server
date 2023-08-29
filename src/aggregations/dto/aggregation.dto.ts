export class ApplyEntityDto {
    keys: {
        [name: string]: any | never
    }

    values: {
        [name: string]: any | never
    }
}

export class ApplyRecordDto {
    source: ApplyEntityDto
    target: ApplyEntityDto
}

export class ApplyDto {
    dataSource: string
    records: ApplyRecordDto[]
    issuerId: string
}