import * as fs from 'fs';
import config from './config';
import { lowerFirst } from './utils';

const getFile = (path: string) => {
  const data = fs.readFileSync(path, 'utf8');
  return data;
};
const getModal = (path: string) => {
  const regex = new RegExp(/model\s+\w+\s*\{([\s\S]*?)\s+\}\s+/g);
  const data = getFile(path);
  const enums = data.match(/(?<=\s*enum\s+)\w+(?=\s*\{)/g);
  const res = data?.match(regex).map((item) => {
    return {
      name: item.match(/model\s+(\w+)\s+\{/)[1],
      isFormdata: false,
      content: item
        .match(/\{([\s\S]*?)\s+\}\s+/)[1]
        ?.split('\n')
        .map((item) => item.trim())
        ?.filter(
          (item) =>
            item !== '' && !item?.startsWith('//') && !item?.includes('@@'),
        )
        ?.map((item) => {
          const [name, type, ...validation] = item.split(/\s+/);
          return {
            name,
            IsRequired:
              !type?.endsWith('?') &&
              !validation.some((ele) => ele?.includes('@default')) &&
              !validation.some((ele) => ele?.includes('@updatedAt')),
            isPrimary: validation.some((ele) => ele?.includes('@id')),
            type: type?.endsWith('?') ? type?.split('?')[0] : type,
            unique: validation?.some((ele) => ele?.includes('@unique')),
            validation: validation
              ?.filter(
                (ele) =>
                  !ele?.includes('@@map') &&
                  !ele?.includes(' @@unique') &&
                  !ele?.includes('@default') &&
                  !ele?.includes('@unique') &&
                  !ele?.includes('@id') &&
                  !ele?.includes('@db.') &&
                  !ele?.includes('@updatedAt'),
              )
              ?.map((ele) => ele.replace(/\//g, '').trim()),
          };
        }),
    };
  });

  // console.log({
  //   res
  // })
  res?.forEach((item) => {
    item.isFormdata = item?.content?.some((ele) =>
      ele.validation.some((ele) => ele?.includes('file')),
    );
  });
  return {
    res,
    enums,
  };
};

const genertateEntity = (item: any, enums: string[], models: string[]) => {
  const setValidation = new Set();
  let dto = '';
  let createDto = '';
  let updateDto = '';
  let enumdata = '';
  createDto += `export class Create${item.name}Dto extends OmitType(${item.name}Dto, [`;
  updateDto = `export class Update${item.name}Dto extends PartialType(Create${item.name}Dto) {}`;
  const isFormdata = item.isFormdata;
  dto += `export class ${item.name}Dto {\n`;
  const isMultiplefile =
    item?.content?.filter((ele) =>
      ele.validation.some((ele) => ele?.includes('file')),
    ).length > 0
      ? true
      : false;

  const filesContent = item?.content
    ?.filter(
      (ele) =>
        ele.validation.some((ele) => ele?.includes('file')) &&
        ele.type === 'String',
    )
    .map((ele) => ele.name);

  console.log({ filesContent, isMultiplefile });

  item?.content?.forEach((ele) => {
    if (!models.includes(ele.type?.replace('[]', ''))) {
      dto += `@ApiProperty({required: ${ele.IsRequired} 
            ${
              enums?.includes(ele.type)
                ? `, type: 'enum', enum:${ele.type}`
                : ''
            }})\n`;
      if (
        !ele.IsRequired ||
        ele.validation.some((dt) => dt?.includes('file' || 'files'))
      )
        dto += `  @IsOptional()\n`;

      if (filesContent?.includes(ele.name) && isMultiplefile) {
        dto += ` @Transform(({ value }) => value[0] || undefined)\n`;
      }

      if (
        !(
          (ele.isPrimary && !ele.IsRequired) ||
          (ele.type === 'DateTime' && !ele.IsRequired)
        )
      ) {
        if (
          isFormdata &&
          config[ele.type]?.type !== 'string' &&
          config[ele.type]?.type !== 'string[]' &&
          !enums?.includes(ele.type)
        ) {
          dto += `@Transform(({ value }) => safeParse(value))\n`;
        }
        for (let i = 0; i < config[ele.type]?.validation.length; i++) {
          setValidation.add(config[ele.type]?.validation[i]);
          dto += `${config[ele.type]?.validation[i]}\n`;
        }
        ele.validation
          ?.map((ele) => ele?.trim())
          ?.filter((ele) => /^\@[A-Z]\w+\(\w*\)$/.test(ele))
          ?.forEach((ele) => {
            setValidation.add(ele);
            dto += `${ele}\n`;
          });
      } else {
        createDto += `'${ele.name}', `;
      }
      if (enums?.includes(ele.type)) {
        enumdata += (enumdata && ', ') + ele.type;
        dto += `@IsEnum(${ele.type})\n`;
      }
      dto += `  ${ele.name}: ${
        config[ele.type]?.type ||
        (enums?.includes(ele.type) && ele.type) ||
        'any'
      };\n`;
    }
  });

  createDto += `]) {}\n`;
  dto += '}';
  /// delete case IsString({ each: true }) in array in imports
  const set2 = new Set();
  setValidation.forEach((ele: string) => {
    set2.add(ele.match(/\w+/)[0]);
  });
  return `import { ${[...set2]
    .map((ele: string) => ele.match(/\w+/)[0])
    .join(',\n')} ${
    item.content.some((cnt) => cnt.IsRequired) ? ', IsOptional' : ''
  }
      ${enumdata && ',IsEnum'} } from '@/utils/validation';\n  ${
    enumdata != '' ? `import { ${enumdata} } from '@prisma/client';\n` : ''
  } import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';\n
    ${
      item.isFormdata
        ? "import { safeParse } from '@/utils/function';\n import { Transform } from 'class-transformer';\n"
        : '\n'
    }\n ${dto}\n\n ${createDto}\n\n ${updateDto} `;
};

const generateModule = (ele: any) => {
  const dt = `import { Module } from '@nestjs/common';
    import { PrismaModule } from '@/prisma.module';
    import { ${ele.name}Service } from './${ele.name.toLowerCase()}.service';
    import { ${
      ele.name
    }Controller } from './${ele.name.toLowerCase()}.controller';
    
    @Module({
      controllers: [${ele.name}Controller],
      providers: [${ele.name}Service],
      imports: [PrismaModule],
    })
    export class ${ele.name}Module {}`;
  return dt;
};

const generateService = (ele: any) => {
  const name = lowerFirst(ele.name);
  const primaryKey =
    ele?.content?.filter((ele) => ele.isPrimary)[0].name || 'id';
  const dt = `import { Injectable } from '@nestjs/common';
    import { PrismaService } from 'src/prisma.service';
    import { ConvertQueries } from '@/utils/function';
    import { Create${ele.name}Dto, Update${ele.name}Dto } from './entities';
    
    @Injectable()
    export class ${ele.name}Service {
      constructor(private prisma: PrismaService) {}
    
    @ConvertQueries()
    async findAll(options?: any) {
      const [totalResult, results] = await Promise.all([
        this.prisma.${name}.count({ where: options.where }),
          this.prisma.${name}.findMany(options),
        ]);
        return { totalResult, results };
    }
    
    @ConvertQueries()
    async findOne(${primaryKey}: number, query?: any) {
      return await this.prisma.${name}.findUnique({ where:{ ${primaryKey}},...query });
    }

    async create(data: Create${ele.name}Dto) {
      return await this.prisma.${name}.create({ data });
    }

    async update(${primaryKey}: number, data: Update${ele.name}Dto) {
      return await this.prisma.${name}.update({ where: { ${primaryKey} }, data });
    }
    
    async remove(${primaryKey}: number) {
      return await this.prisma.${name}.delete({ where: { ${primaryKey} } });
    }
    
    async removeAll() {
      return await this.prisma.${name}.deleteMany({
        where: {
          id: {
            not: 0,
          },
        },
      });
    }

    async addMany(data: Create${ele.name}Dto[]) {
      return await this.prisma.${name}.createMany({ data });
    }
  }
    `;
  return dt;
};

const generateController = (ele: any) => {
  const filedFile = ele.content.filter((res) =>
    res.validation.some((res) => res?.includes('file' || 'files')),
  );

  const name = lowerFirst(ele.name);

  const primaryKey =
    ele?.content?.filter((ele) => ele.isPrimary)[0].name || 'id';
  const dt = `
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
      ${
        filedFile.length === 1 && filedFile?.[0]?.name
          ? `UploadedFile${
              filedFile?.[0]?.validation?.includes('files') ? 's' : ''
            },`
          : filedFile.length > 1
          ? 'UploadedFiles,'
          : ''
      }
      Query,
    } from '@nestjs/common';
    ${
      filedFile && filedFile.length === 1
        ? `import {  File${
            filedFile?.[0]?.validation?.includes('files') ? 's' : ''
          }Interceptor } from '@nestjs/platform-express';\nimport { multerConfig } from '@/utils/multer';\n`
        : filedFile && filedFile.length > 1
        ? `
         import {  FileFieldsInterceptor } from '@nestjs/platform-express';\nimport { storageAfterAndBefor } from '@/utils/multer-multiple';\n`
        : ``
    }
    ${filedFile.length > 0 ? `import * as fs from 'fs';\n` : ``}
    import { ${ele.name}Service } from './${name?.toLowerCase()}.service';
    import { ${ele.name}Dto, Create${ele.name}Dto, Update${
    ele.name
  }Dto } from './entities';
    import { NotFoundInterceptor } from '@/common/interceptors/notFound.interceptor';
    import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
    
    @ApiTags('${name}')
    @Controller('${name}')
    export class ${ele.name}Controller {
      constructor(private readonly ${name}Service: ${ele.name}Service) { }
    
      @ApiOkResponse({ type: [${ele.name}Dto] })
      @Get()
      findAll(@Query() query: any) {
        return this.${name}Service.findAll(query);
      }
      @UseInterceptors(NotFoundInterceptor) 
      @ApiOkResponse({ type: ${ele.name}Dto })
      @Get(':${primaryKey}')
      findOne(@Query() query: any, @Param('${primaryKey}', ParseIntPipe) ${primaryKey}: number) {
        return this.${name}Service.findOne(${primaryKey}, query);
      }
  
      @ApiCreatedResponse({ type: ${ele.name}Dto })
      @Post()
      ${
        filedFile.length === 1 && filedFile?.[0]?.name
          ? `@UseInterceptors(File${
              filedFile?.[0]?.validation?.includes('files') ? 's' : ''
            }Interceptor('${filedFile?.[0]?.name}', 
          ${filedFile?.[0]?.validation?.includes('files') ? '20,' : ''}
          multerConfig))`
          : filedFile.length > 1
          ? `@UseInterceptors(
            FileFieldsInterceptor(
                ${JSON.stringify(
                  filedFile?.map((ele) => {
                    return {
                      name: ele.name,
                      maxCount: ele.type === 'String[]' ? 10 : 1,
                    };
                  }),
                )},
              {
                storage: storageAfterAndBefor,
              },
              ))
            `
          : ``
      }
     async create(${
       filedFile?.length === 1
         ? `@UploadedFile${
             filedFile?.[0]?.validation?.includes('files') ? 's' : ''
           }() files,`
         : filedFile?.length > 1
         ? `@UploadedFiles()\n
      file:{
        ${filedFile
          .map((ele) => {
            return `${ele.name}?: Express.Multer.File[];`;
          })
          .join('\n')}
      },
      
      `
         : ``
     }
 @Body() data: Create${ele.name}Dto) { 
        try{\n
           ${
             filedFile.length === 1
               ? ` if (files)\n${
                   filedFile?.[0]?.validation?.includes('file')
                     ? `data['${filedFile?.[0]?.name}'] = files.filename`
                     : filedFile?.[0]?.validation?.includes('files')
                     ? `data['${filedFile?.[0]?.name}'] = files.map((file) => file.filename);\n`
                     : ''
                 }`
               : ''
           }
        return  ${
          filedFile?.[0]?.name ? 'await' : ''
        }  this.${name}Service.create(data);
        ${
          filedFile.length === 1 && filedFile?.[0]?.name
            ? `}\n catch(err){
              if (files){\n
          ${
            filedFile?.[0]?.validation?.includes('file')
              ? `multerConfig.storage._removeFile(null, files, () => {
                void 0;
              });`
              : filedFile?.[0]?.validation?.includes('files')
              ? `files?.forEach((file) => {
                multerConfig.storage._removeFile(null, file, () => {
                  void 0;
                });
                });
                `
              : ``
          }
            }
            throw err;}`
            : `}\n catch(err){
              ${
                filedFile.length > 1
                  ? `${filedFile
                      .map((ele) => {
                        return `
                      file['${ele.name}']?.forEach((file) => {
                        storageAfterAndBefor._removeFile(null, file, () => {
                          void 0;
                        });
                      });
                    `;
                      })
                      .join('')}`
                  : ``
              }
              throw err;
            }`
        }
      }
   
   
      @ApiOkResponse({ type: ${ele.name}Dto })
      @Patch(':${primaryKey}')
      ${
        filedFile.length === 1 && filedFile?.[0]?.name
          ? `@UseInterceptors(File${
              filedFile?.[0]?.validation?.includes('files') ? 's' : ''
            }Interceptor('${filedFile?.[0]?.name}', 
          ${filedFile?.[0]?.validation?.includes('files') ? '20,' : ''}
          multerConfig))`
          : filedFile.length > 1
          ? `@UseInterceptors(
            FileFieldsInterceptor(
                ${JSON.stringify(
                  filedFile.map((ele) => {
                    return {
                      name: ele.name,
                      maxCount: ele.type === 'String[]' ? 10 : 1,
                    };
                  }),
                )},
              {
                storage: storageAfterAndBefor,
              },
              ))
            `
          : ``
      }
      update(
        ${
          filedFile?.length === 1 && filedFile?.[0]?.name
            ? `@UploadedFile${
                filedFile?.[0]?.validation?.includes('files') ? 's' : ''
              }() files,`
            : filedFile?.length > 1
            ? `@UploadedFiles()\n
         file:{
           ${filedFile
             .map((ele) => {
               return `${ele.name}?: Express.Multer.File[];`;
             })
             .join('\n')}
         },
         `
            : ``
        }
        @Param('${primaryKey}', ParseIntPipe) ${primaryKey}: number, @Body() data: Update${
    ele.name
  }Dto) {
    try{\n
      ${
        filedFile.length === 1
          ? ` if (files)\n${
              filedFile?.[0]?.validation?.includes('file')
                ? `data['${filedFile?.[0]?.name}'] = files.filename`
                : filedFile?.[0]?.validation?.includes('files')
                ? `data['${filedFile?.[0]?.name}'] = files.map((file) => file.filename);\n`
                : ''
            }`
          : ''
      }
        return this.${name}Service.update(${primaryKey}, data);
        ${
          filedFile.length === 1 && filedFile?.[0]?.name
            ? `}\n catch(err){
              if (files){\n
          ${
            filedFile?.[0]?.validation?.includes('file')
              ? `multerConfig.storage._removeFile(null, files, () => {
                void 0;
              });`
              : filedFile?.[0]?.validation?.includes('files')
              ? `files?.forEach((file) => {
                multerConfig.storage._removeFile(null, file, () => {
                  void 0;
                });
                });
                `
              : ``
          }
            }
            throw err;}`
            : `}\n catch(err){
              ${
                filedFile.length > 1
                  ? `${filedFile
                      .map((ele) => {
                        return `
                      file['${ele.name}']?.forEach((file) => {
                        storageAfterAndBefor._removeFile(null, file, () => {
                          void 0;
                        });
                      });
                    `;
                      })
                      .join('')}`
                  : ``
              }
              throw err;
            }`
        }
      }
    
      @ApiOkResponse({ type: ${ele.name}Dto })
      @Delete(':${primaryKey}')
      remove(@Param('${primaryKey}', ParseIntPipe) ${primaryKey}: number) {
        const data = this.${name}Service.remove(${primaryKey});
        ${
          filedFile.length === 1
            ? `
          if (data){
              if (data['${filedFile?.[0]?.name}'])
              {
               fs.unlinkSync(\`\${process.cwd()}/uploads/\${data['${filedFile?.[0]?.name}']}\`);
              }}`
            : filedFile.length > 1
            ? `${filedFile
                .map((ele) => {
                  return `
                  if (data){
                    ${
                      ele.type === 'String[]'
                        ? `
                        if (Array.isArray(data['${ele.name}']) && data['${ele.name}'].length > 0)
                        {
                        data['${ele.name}']?.forEach((file) => {
                          fs.unlinkSync(\`\${process.cwd()}/uploads/\${file}\`);
                        });
                      }
                        `
                        : `
                        if (data['${ele.name}'])
                        {
                        fs.unlinkSync(\`\${process.cwd()}/uploads/\${data['${ele.name}']}\`);} `
                    }`;
                })
                .join('')}}   }`
            : ``
        }
        return data;
      }
    
      @ApiOkResponse({ type: ${ele.name}Dto, isArray: true })
      @Post('/bulk')
      bulkCreate(@Body() data: Create${ele.name}Dto[]) {
        return this.${name}Service.addMany(data);
      }
      @ApiOkResponse({ type: ${ele.name}Dto, isArray: true })
      @Delete('/bulk/delete-all')
      bulkDelete() {
        return this.${name}Service.removeAll();
      }
    }
    `;
  return dt;
};

const authGenerator = (auth: any, authModel: any) => {
  const setValidationEmail = new Set();
  const setValidationPassword = new Set();
  const name = lowerFirst(auth.model);

  authModel.content.forEach((ele) => {
    if (ele.name === auth.email || ele.name === auth.password) {
      ele.validation
        ?.filter((dt) => /^\@[A-Z]\w+\(\w*\)$/.test(dt))
        ?.forEach((dt) => {
          if (ele.name === auth.email) setValidationEmail.add(dt);
          if (ele.name === auth.password) setValidationPassword.add(dt);
        });
    }
  });
  const entities = `
    import { ApiProperty } from '@nestjs/swagger';
    import {
      ${[
        ...setValidationEmail,
        ...setValidationPassword,
        ...config['String']?.validation,
      ]
        .map((ele: string) => ele.match(/\w+/)[0])
        .join(',\n')}
      } from '@/utils/validation';

    export class LoginDto {
      @ApiProperty({required: true})
      ${[...setValidationEmail, config['String']?.validation]
        .join('\n')
        .replace(/,/g, '\n')}
      ${auth.email}: string;
      @ApiProperty({required: true})
      ${[...setValidationPassword, config['String']?.validation]
        .join('\n')
        .replace(/,/g, '\n')}
      ${auth.password}: string;
    }
    export class LogOutDto {
      @ApiProperty({required: true})
      token:string;
      @ApiProperty({required: true})
      refreshToken: string;
    }
    export class RefreshTokenDto {
      @ApiProperty({required: true})
      refreshToken: string;
    }
  `;
  const service = `import { Injectable } from '@nestjs/common';
  import { PrismaService } from 'src/prisma.service';
  import { JwtService } from '@nestjs/jwt';
  import * as bcrypt from 'bcryptjs';
  import {LoginDto, LogOutDto, RefreshTokenDto} from './entities';

  @Injectable()
  export class AuthService {
    constructor(
      private prisma: PrismaService,
      private jwtService: JwtService,
    ) {}

    async login(data: LoginDto) {
      const user = await this.prisma.${name}.findFirst({
        where: { ${auth.email}: data.${auth.email} },
      });
      if (!user) throw new Error('User not found');
      const isMatch = await bcrypt.compare(data.${auth.password}, user.${auth.password});
      if (!isMatch) throw new Error('Incorrect password');
      const payload = {email: user.${auth.email}, role: user.role || 'user' };
      return {
        accessToken: this.jwtService.sign(payload),
        refreshToken: this.jwtService.sign(payload, {
          expiresIn: ${config['auth'].refreshTokenExpiration},
        }),
      };
    }
      async logout(data: LogOutDto) {
      }
      async refreshToken(data: RefreshTokenDto) {
        // refresh token
      }
    }`;

  const controller = `
    import { Controller, Post, Body } from '@nestjs/common';
    import { AuthService } from './auth.service';
    import { LoginDto, LogOutDto, RefreshTokenDto } from './entities';
    import { ApiTags } from '@nestjs/swagger';

    @ApiTags('auth')
    @Controller('auth')
    export class AuthController {
      constructor(private readonly authService: AuthService) {}

      @Post('/login')
      login(@Body() data: LoginDto) {
        return this.authService.login(data);
      }
      @Post('/logout')
      logout(@Body() data: LogOutDto) {
        return this.authService.logout(data);
      }
      @Post('/refresh-token')
      refreshToken(@Body() data: RefreshTokenDto) {
        return this.authService.refreshToken(data);
      }
    }
    `;

  const module = `
    import { Module } from '@nestjs/common';
    import { PrismaModule } from '@/prisma.module';
    import { AuthService } from './auth.service';
    import { AuthController } from './auth.controller';
    import { JwtModule } from '@nestjs/jwt';
    import { PassportModule } from '@nestjs/passport';
    import { JwtStrategy } from './jwt.strategy';

    @Module({
      imports: [
        PrismaModule,
        PassportModule,
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: ${config['auth'].tokenExpiration} },
        }),
      ],
      controllers: [AuthController],
      providers: [AuthService, JwtStrategy],
    })
    export class AuthModule {}
    `;
  fs.mkdirSync(`src/routes/auth`, {
    recursive: true,
  });
  fs.writeFileSync(`src/routes/auth/entities.ts`, entities);
  fs.writeFileSync(`src/routes/auth/auth.service.ts`, service);
  fs.writeFileSync(`src/routes/auth/auth.controller.ts`, controller);
  fs.writeFileSync(`src/routes/auth/auth.module.ts`, module);
};

const generateAllFiles = (item, enums, namesModal, flag) => {
  if (flag === '-g') {
    const entity = genertateEntity(item, enums, namesModal);
    const module = generateModule(item);
    const service = generateService(item);
    const controller = generateController(item);
    const appModule = getFile('src/app.module.ts');
    fs.mkdirSync(`src/routes/${item.name.toLowerCase()}`, {
      recursive: true,
    });
    fs.writeFileSync(
      `src/routes/${item.name.toLowerCase()}/entities.ts`,
      entity,
    );
    fs.writeFileSync(
      `src/routes/${item.name.toLowerCase()}/${item.name.toLowerCase()}.module.ts`,
      module,
    );
    fs.writeFileSync(
      `src/routes/${item.name.toLowerCase()}/${item.name.toLowerCase()}.service.ts`,
      service,
    );
    fs.writeFileSync(
      `src/routes/${item.name.toLowerCase()}/${item.name.toLowerCase()}.controller.ts`,
      controller,
    );
    fs.writeFileSync(
      'src/app.module.ts',
      appModule.replace(
        '\n' + '@Module({\n' + '  imports: [\n',
        `\nimport {${
          item.name
        }Module}  from '@/routes/${item.name.toLowerCase()}/${item.name.toLowerCase()}.module';\n` +
          '\n' +
          '@Module({\n' +
          '  imports: [\n' +
          item.name +
          'Module,' +
          '\n',
      ),
    );
  } else if (flag === '-u') {
    const entity = genertateEntity(item, enums, namesModal);
    fs.writeFileSync(
      `src/routes/${item.name.toLowerCase()}/entities.ts`,
      entity,
    );
  }
};
const main = () => {
  try {
    const data = getModal('prisma/schema.prisma');
    const res = data?.res || [];
    const enums = data.enums;
    const namesModal = res.map((item) => item.name);
    if (process.argv[2] === '-g' || process.argv[2] === '-u') {
      if (process.argv[3] === 'all') {
        res.forEach((item) => {
          try {
            if (process.argv[2] === '-g')
              generateAllFiles(item, enums, namesModal, '-g');
            else if (process.argv[2] === '-u')
              generateAllFiles(item, enums, namesModal, '-u');
          } catch (err) {
            console.log(err);
            console.log('error in create ');
          }
        });
      } else if (process.argv[3]) {
        const item = res.find((item) => item.name === process.argv[3]);
        if (item) {
          if (process.argv[2] === '-g')
            generateAllFiles(item, enums, namesModal, '-g');
          else if (process.argv[2] === '-u')
            generateAllFiles(item, enums, namesModal, '-u');
        } else {
          console.log('not found');
        }
      }
    }
    // if (namesModal.includes(config['auth'].model)) {
    //   const auth = config['auth'];
    //   const authModel = res.find((item) => item.name === auth.model);
    //   if (
    //     authModel.content.some((item) => item.name === auth.email) &&
    //     authModel.content.some((item) => item.name === auth.password)
    //   ) {
    //     authGenerator(auth, authModel);
    //   }
    // }
  } catch (error) {
    console.log(error);
  }
};

main();
