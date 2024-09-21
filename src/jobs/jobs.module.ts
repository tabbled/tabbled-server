import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { FunctionsModule } from "../functions/functions.module";

@Module({
    providers: [JobsService],
    imports: [FunctionsModule],
    exports: [JobsService]
})
export class JobsModule {}