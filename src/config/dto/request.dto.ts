import { ApiProperty } from '@nestjs/swagger';
import { ConfigItem } from "../entities/config.entity";

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
    function?: ConfigItem[]

    @ApiProperty()
    page?: ConfigItem[]

    @ApiProperty()
    datasource?: ConfigItem[]

    @ApiProperty()
    menu?: ConfigItem[]
}