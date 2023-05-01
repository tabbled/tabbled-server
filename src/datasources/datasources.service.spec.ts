import { Test, TestingModule } from '@nestjs/testing';
import { DatasourcesService } from './datasources.service';

describe('DatasourcesService', () => {
  let service: DatasourcesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatasourcesService],
    }).compile();

    service = module.get<DatasourcesService>(DatasourcesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
