import { Module } from '@nestjs/common';
    import { PrismaModule } from '@/prisma.module';
    import { TestService } from './test.service';
    import { TestController } from './test.controller';
    
    @Module({
      controllers: [TestController],
      providers: [TestService],
      imports: [PrismaModule],
    })
    export class TestModule {}