import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ConvertQueries } from '@/utils/function';
import { CreateUserDto, UpdateUserDto } from './entities';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  @ConvertQueries()
  async findAll(options?: any) {
    const [totalResult, results] = await Promise.all([
      this.prisma.user.count({ where: options.where }),
      this.prisma.user.findMany(options),
    ]);
    return { totalResult, results };
  }

  @ConvertQueries()
  async findOne(id: number, query?: any) {
    return await this.prisma.user.findUnique({ where: { id }, ...query });
  }

  async create(data: CreateUserDto) {
    return await this.prisma.user.create({ data });
  }

  async update(id: number, data: UpdateUserDto) {
    return await this.prisma.user.update({ where: { id }, data });
  }

  async remove(id: number) {
    return await this.prisma.user.delete({ where: { id } });
  }

  async removeAll() {
    return await this.prisma.user.deleteMany({
      where: {
        id: {
          not: 0,
        },
      },
    });
  }

  async addMany(data: CreateUserDto[]) {
    return await this.prisma.user.createMany({ data });
  }
}
