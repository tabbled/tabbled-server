import { ApiProperty } from '@nestjs/swagger'
import { Context } from '../../entities/context'

export class CallFunctionDto {
    @ApiProperty()
    context: Array<Object> | Object
}

export class RunScriptDto {
    script: string
    context: Context
    room?: string
}

export class CallWsFunctionDto {
    @ApiProperty()
    alias: string

    @ApiProperty()
    context: Context
}
