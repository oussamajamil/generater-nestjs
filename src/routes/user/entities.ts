import { IsString,
MaxLength,
MinLength,
IsBoolean,
IsNumber,
IsNotEmpty,
Min , IsOptional
       } from '@/utils/validation';
   import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';

    

 export class UserDto {
@ApiProperty({required: false 
            })
  @IsOptional()
  id: string;
@ApiProperty({required: true 
            })
@IsString()
@MaxLength(255)
@MinLength(1)
  firstName: string;
@ApiProperty({required: true 
            })
@IsString()
@MaxLength(255)
@MinLength(1)
  lastName: string;
@ApiProperty({required: true 
            })
@IsString()
@MaxLength(255)
@MinLength(1)
  email: string;
@ApiProperty({required: false 
            })
  @IsOptional()
@IsBoolean()
  isFirstLogin: boolean;
@ApiProperty({required: false 
            })
  @IsOptional()
  createdAt: Date;
@ApiProperty({required: false 
            })
  @IsOptional()
  updatedAt: Date;
@ApiProperty({required: false 
            })
  @IsOptional()
@IsNumber()
@IsNotEmpty()
@Min(1)
  plantId: number;
@ApiProperty({required: false 
            })
  @IsOptional()
@IsNumber()
@IsNotEmpty()
@Min(1)
  teamId: number;
}

 export class CreateUserDto extends OmitType(UserDto, ['id', 'createdAt', 'updatedAt', ]) {}


 export class UpdateUserDto extends PartialType(CreateUserDto) {} 