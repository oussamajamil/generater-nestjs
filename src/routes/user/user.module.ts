import { Module } from '@nestjs/common';
    import { PrismaModule } from '@/prisma.module';
    import { UserService } from './user.service';
    import { UserController } from './user.controller';
    
    @Module({
      controllers: [UserController],
      providers: [UserService],
      imports: [PrismaModule],
    })
    export class UserModule {}