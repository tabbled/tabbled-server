import { ApiProperty } from '@nestjs/swagger';
import { ConfigItem } from "../entities/config.entity";

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