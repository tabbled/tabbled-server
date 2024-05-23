import { Module } from '@nestjs/common'
import { AccountsGateway } from './accounts.gateway'

@Module({
    providers: [AccountsGateway],
})
export class AccountsModule {}
