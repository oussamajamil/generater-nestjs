import { IsString,
MaxLength,
MinLength , IsOptional
       } from '@/utils/validation';
   import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';

    

 export class TestDto {
@ApiProperty({required: false 
            })
  @IsOptional()
  id: string;
@ApiProperty({required: true 
            })
@IsString()
@MaxLength(255)
@MinLength(1)
  name: string;
@ApiProperty({required: false 
            })
  @IsOptional()
  createdAt: Date;
@ApiProperty({required: false 
            })
  @IsOptional()
  updatedAt: Date;
}

 export class CreateTestDto extends OmitType(TestDto, ['id', 'createdAt', 'updatedAt', ]) {}


 export class UpdateTestDto extends PartialType(CreateTestDto) {} 