import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseInterceptors,
  Query,
} from '@nestjs/common';

import { UserService } from './user.service';
import { UserDto, CreateUserDto, UpdateUserDto } from './entities';
import { NotFoundInterceptor } from '@/common/interceptors/notFound.interceptor';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOkResponse({ type: [UserDto] })
  @Get()
  findAll(@Query() query: any) {
    return this.userService.findAll(query);
  }
  @UseInterceptors(NotFoundInterceptor)
  @ApiOkResponse({ type: UserDto })
  @Get(':id')
  findOne(@Query() query: any, @Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id, query);
  }

  @ApiCreatedResponse({ type: UserDto })
  @Post()
  async create(@Body() data: CreateUserDto) {
    try {
      return this.userService.create(data);
    } catch (err) {
      throw err;
    }
  }

  @ApiOkResponse({ type: UserDto })
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateUserDto) {
    try {
      return this.userService.update(id, data);
    } catch (err) {
      throw err;
    }
  }

  @ApiOkResponse({ type: UserDto })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    const data = this.userService.remove(id);

    return data;
  }

  @ApiOkResponse({ type: UserDto, isArray: true })
  @Post('/bulk')
  bulkCreate(@Body() data: CreateUserDto[]) {
    return this.userService.addMany(data);
  }
  @ApiOkResponse({ type: UserDto, isArray: true })
  @Delete('/bulk/delete-all')
  bulkDelete() {
    return this.userService.removeAll();
  }
}
