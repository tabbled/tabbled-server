import { Controller, Get } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
let p = require('./../package.json')

@Controller()
export class AppController {
    constructor() {}
    @Get()
    @ApiOperation({ summary: 'Get info about installation' })
    info() {
        return {
            app: 'Tabbled',
            version: p.version,
        }
    }
}
