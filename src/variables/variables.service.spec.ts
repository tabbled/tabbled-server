import { Test, TestingModule } from '@nestjs/testing';
import { VariablesService } from './variables.service';

describe('VariablesService', () => {
  let service: VariablesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VariablesService],
    }).compile();

    service = module.get<VariablesService>(VariablesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
