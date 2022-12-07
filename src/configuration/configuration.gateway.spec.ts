import { Test, TestingModule } from '@nestjs/testing';
import { ConfigurationGateway } from './configuration.gateway';
import { ConfigurationService } from './configuration.service';

describe('ConfigurationGateway', () => {
  let gateway: ConfigurationGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigurationGateway, ConfigurationService],
    }).compile();

    gateway = module.get<ConfigurationGateway>(ConfigurationGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
