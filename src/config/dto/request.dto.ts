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

export class ConfigImportDto {
    @ApiProperty()
    version: number

    @ApiProperty()
    rev: string

    @ApiProperty()
    entire: boolean

    @ApiProperty()
    entities: string[]

    @ApiProperty()
    config: any

}