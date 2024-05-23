import { Test, TestingModule } from '@nestjs/testing'
import { DatasourcesGateway } from './datasources.gateway'
import { DatasourcesService } from './datasources.service'

describe('DatasourcesGateway', () => {
    let gateway: DatasourcesGateway

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DatasourcesGateway, DatasourcesService],
        }).compile()

        gateway = module.get<DatasourcesGateway>(DatasourcesGateway)
    })

    it('should be defined', () => {
        expect(gateway).toBeDefined()
    })
})
