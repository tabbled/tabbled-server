import { Module } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config";
import { PagesService } from "./pages.service";
import { PagesController } from "./pages.contreller";
import { UsersModule } from "../users/users.module";

@Module({imports: [
        ConfigModule,
        UsersModule
    ],
    controllers: [PagesController],
    providers: [PagesService]})
export class PagesModule { }
