import { Test, TestingModule } from '@nestjs/testing'
import { ReportsGateway } from './reports.gateway'
import { ReportsService } from './reports.service'

describe('ReportsGateway', () => {
    let gateway: ReportsGateway

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ReportsGateway, ReportsService],
        }).compile()

        gateway = module.get<ReportsGateway>(ReportsGateway)
    })

    it('should be defined', () => {
        expect(gateway).toBeDefined()
    })
})
