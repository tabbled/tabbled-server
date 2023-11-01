import { ApiProperty } from '@nestjs/swagger';

export class InviteUserDto {
    @ApiProperty()
    email: string;
    
    @ApiProperty()
    account_id: string;
}

export class InsertUserDto {
    value: any
}
