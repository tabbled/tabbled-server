import { Module } from '@nestjs/common';
import { FunctionsService } from './functions.service';
import { FunctionsController } from './functions.controller';
import { ConfigService } from "../config/config.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigItem } from "../config/entities/config.entity";

@Module({
    controllers: [FunctionsController],
    providers: [FunctionsService, ConfigService],
    imports: [TypeOrmModule.forFeature([ConfigItem])],
    exports: [TypeOrmModule]
})
export class FunctionsModule {}
