import { ApiProperty } from '@nestjs/swagger';

export class CallFunctionDto {
    @ApiProperty()
    accountId: number

    @ApiProperty()
    context: Array<Object> | Object;
}
