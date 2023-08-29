import { Test, TestingModule } from '@nestjs/testing';
import { AggregationsService } from './aggregations.service';

describe('AggregationsService', () => {
  let service: AggregationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AggregationsService],
    }).compile();

    service = module.get<AggregationsService>(AggregationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
