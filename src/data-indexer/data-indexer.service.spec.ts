import { Test, TestingModule } from '@nestjs/testing';
import { DataIndexerService } from './data-indexer.service';

describe('DataIndexerService', () => {
  let service: DataIndexerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataIndexerService],
    }).compile();

    service = module.get<DataIndexerService>(DataIndexerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
