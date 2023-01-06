import { Test, TestingModule } from '@nestjs/testing';
import { DataitemGateway } from './dataitem.gateway';
import { DataitemService } from './dataitem.service';

describe('DataitemGateway', () => {
  let gateway: DataitemGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataitemGateway, DataitemService],
    }).compile();

    gateway = module.get<DataitemGateway>(DataitemGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
