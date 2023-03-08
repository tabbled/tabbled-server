import { Controller, Get } from "@nestjs/common";
let p = require('./../package.json');

@Controller()
export class AppController {
    constructor() {}
    @Get()
    info() {
        return {
            app: 'Tabbled',
            version: p.version
        }
    }
}
