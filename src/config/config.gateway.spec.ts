import { Test, TestingModule } from '@nestjs/testing';
import { ConfigGateway } from './config.gateway';
import { ConfigService } from './config.service';

describe('ConfigGateway', () => {
  let gateway: ConfigGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigGateway, ConfigService],
    }).compile();

    gateway = module.get<ConfigGateway>(ConfigGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
