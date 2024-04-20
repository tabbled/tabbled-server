import { ApiProperty } from '@nestjs/swagger';

export class ConfigDto {
    alias: string
}

export class GetManyDto extends ConfigDto {
}

export class GetByIdDto extends ConfigDto {
    id: string
}

export class GetByKeyDto extends ConfigDto {
    key: string
}

export class UpsertDto extends ConfigDto {
    id: string
    value: any
}

export type ConflictAction = 'replace' | 'skip'

export class ConfigImportDto {
    @ApiProperty()
    version: number

    @ApiProperty()
    rev: string

    @ApiProperty()
    importConfig: boolean

    @ApiProperty()
    importData: boolean

    @ApiProperty()
    partially: boolean

    @ApiProperty()
    selected: string[]

    @ApiProperty()
    data: any[]

    @ApiProperty()
    configuration: any

    @ApiProperty()
    clearData: boolean

    @ApiProperty()
    clearConfig: boolean

    @ApiProperty()
    dataConflictAction: ConflictAction

    @ApiProperty()
    configConflictAction: ConflictAction

}

export class ConfigExportDto {
    @ApiProperty()
    data: boolean

    @ApiProperty()
    config: boolean
}