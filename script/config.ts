const config = {
  String: {
    type: 'string',
    validation: ['@IsString()', '@MaxLength(255)', '@MinLength(1)'],
  },
  Int: {
    type: 'number',
    validation: ['@IsNumber()', '@IsNotEmpty()', '@Min(1)'],
  },
  Float: {
    type: 'number',
    validation: ['@IsNumber()', '@IsNotEmpty()', '@Min(1)'],
  },
  Boolean: {
    type: 'boolean',
    validation: ['@IsBoolean()'],
  },
  DateTime: {
    type: 'Date',
    validation: ['@IsDate()'],
  },
  Json: {
    type: 'any',
    validation: [],
  },
  'String[]': {
    type: 'string[]',
    validation: ['@IsArray()', '@IsString({ each: true })'],
  },
  auth: {
    model: 'User',
    email: 'email',
    password: 'password',
    tokenExpiration: 3600,
    refreshTokenExpiration: 3600 * 24 * 30,
    authMiddleware: ['Test'],
  },
};

export default config;
