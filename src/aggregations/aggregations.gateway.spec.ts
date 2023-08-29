import { Test, TestingModule } from '@nestjs/testing';
import { AggregationsGateway } from './aggregations.gateway';
import { AggregationsService } from './aggregations.service';

describe('AggregationsGateway', () => {
  let gateway: AggregationsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AggregationsGateway, AggregationsService],
    }).compile();

    gateway = module.get<AggregationsGateway>(AggregationsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
