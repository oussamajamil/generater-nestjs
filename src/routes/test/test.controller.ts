
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
    
    
    import { TestService } from './test.service';
    import { TestDto, CreateTestDto, UpdateTestDto } from './entities';
    import { NotFoundInterceptor } from '@/common/interceptors/notFound.interceptor';
    import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
    
    @ApiTags('test')
    @Controller('test')
    export class TestController {
      constructor(private readonly testService: TestService) { }
    
      @ApiOkResponse({ type: [TestDto] })
      @Get()
      findAll(@Query() query: any) {
        return this.testService.findAll(query);
      }
      @UseInterceptors(NotFoundInterceptor) 
      @ApiOkResponse({ type: TestDto })
      @Get(':id')
      findOne(@Query() query: any,
      @Param('id') id: string
      ) {
        return this.testService.findOne(id, query);
      }
  
      @ApiCreatedResponse({ type: TestDto })
      @Post()
      
     async create(
 @Body() data: CreateTestDto) { 
        try{

           
        return    this.testService.create(data);
        }
 catch(err){
              
              throw err;
            }
      }
   
   
      @ApiOkResponse({ type: TestDto })
      @Patch(':id')
      
      update(
        
        @Param('id') id: string
       ,@Body() data: UpdateTestDto) {
    try{

      
        return this.testService.update(id, data);
        }
 catch(err){
              
              throw err;
            }
      }
    
      @ApiOkResponse({ type: TestDto })
      @Delete(':id')
      remove
      (
      @Param('id') id: string){
        const data = this.testService.remove(id);
        
        return data;
      }
    }
    