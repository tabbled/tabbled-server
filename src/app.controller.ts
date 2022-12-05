import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class AppController {
    constructor() {}
}
