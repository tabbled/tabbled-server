import { Test, TestingModule } from '@nestjs/testing';
import { DataitemService } from './dataitem.service';

describe('DataitemService', () => {
  let service: DataitemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataitemService],
    }).compile();

    service = module.get<DataitemService>(DataitemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
