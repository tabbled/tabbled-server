import { ApiProperty } from '@nestjs/swagger';

export class CallFunctionDto {
    @ApiProperty()
    context: Array<Object> | Object;
}
