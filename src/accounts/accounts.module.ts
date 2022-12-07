import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsGateway } from './accounts.gateway';

@Module({
  providers: [AccountsGateway, AccountsService]
})
export class AccountsModule {}
