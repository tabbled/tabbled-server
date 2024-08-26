import { Module } from '@nestjs/common';
import { VariablesService } from './variables.service';

@Module({
    providers: [VariablesService],
    exports: [VariablesService]
})
export class VariablesModule {}
