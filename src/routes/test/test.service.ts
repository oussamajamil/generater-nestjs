import { Injectable } from '@nestjs/common';
    import { PrismaService } from 'src/prisma.service';
    import { ConvertQueries } from '@/utils/function';
    import { CreateTestDto, UpdateTestDto } from './entities';
    
    @Injectable()
    export class TestService {
      constructor(private prisma: PrismaService) {}
    
    @ConvertQueries()
    async findAll(options?: any) {
      const [totalResult, results] = await Promise.all([
        this.prisma.test.count({ where: options.where }),
          this.prisma.test.findMany(options),
        ]);
        return { totalResult, results };
    }
    
    @ConvertQueries()
    async findOne(id: string, query?: any) {
      return await this.prisma.test.findUnique({ where:{ id},...query });
    }

    async create(data: CreateTestDto) {
      return await this.prisma.test.create({ data });
    }

    async update(id:string, data: UpdateTestDto) {
      return await this.prisma.test.update({ where: { id }, data });
    }
    
    async remove(id: 
      string
    ) {
      return await this.prisma.test.delete({ where: { id } });
    }
  }
    