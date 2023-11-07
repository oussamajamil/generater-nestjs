import { BadRequestException } from '@nestjs/common';
import { genSalt, hash } from 'bcrypt';

const isValidDate = (date) => {
  const regEx1 = /^\d{4}-\d{2}-\d{2}$/;
  const regEx2 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
  const regEx3 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z$/;
  const regEx4 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+\+\d{2}:\d{2}$/;
  if (
    !date.match(regEx1) &&
    !date.match(regEx2) &&
    !date.match(regEx3) &&
    !date.match(regEx4)
  )
    return false;
  return !isNaN(Date.parse(date));
};
const reviver = (_key: unknown, value: string) => {
  // check if is number string
  if (typeof value === 'string' && !isNaN(Number(value))) {
    return Number(value);
  }
  if (typeof value === 'string' && isValidDate(value)) {
    return new Date(value);
  }
  return value;
};
export const safeParse = (value) => {
  try {
    return JSON.parse(value, reviver);
  } catch (e) {
    return value;
  }
};

const convertToObject = (str) => {
  if (!str) return true;
  const arr = str.split('.');
  if (arr.length === 1) return { [arr[0]]: true };
  return { [arr[0]]: { include: convertToObject(arr.slice(1).join('.')) } };
};

const queryToObj = (str: string) => {
  let include = {};
  try {
    include = JSON.parse(str);
  } catch (e) {
    include = str.split(',').reduce((acc, curr) => {
      const obj = convertToObject(curr.trim());
      return { ...acc, ...obj };
    }, {});
  }
  return include;
};

export function ConvertQueries() {
  return function (_target: any, key: string, descriptor: PropertyDescriptor) {
    if (key == 'findAll') {
      const orignalMethod = descriptor.value;
      descriptor.value = function (params: any, ...args: any[]) {
        const { skip, take, where, orderBy, include, select } = params;
        if (skip && !skip.match(/^\d+$/))
          throw new BadRequestException('skip must be an integer');
        if (take && !take.match(/^\d+$/))
          throw new BadRequestException('take must be an integer');
        params.skip = parseInt(skip || '0');
        params.take = parseInt(take || '20');
        try {
          params.where = JSON.parse(where || '{}');
        } catch (e) {
          throw new BadRequestException('where must be valid JSON');
        }
        try {
          params.orderBy = JSON.parse(orderBy || '{}');
        } catch (e) {
          throw new BadRequestException('orderBy must be valid JSON');
        }
        if (include) {
          params.include = queryToObj(include);
        }
        if (select) params.select = queryToObj(select);
        return orignalMethod.apply(this, [params, ...args]);
      };
      return descriptor;
    }
    if (key == 'findOne' || key == 'create' || key == 'update') {
      const orignalMethod = descriptor.value;
      descriptor.value = function (params: any, params2: any, ...args: any[]) {
        const { include, select } = params2;
        if (include) {
          params2.include = queryToObj(include);
        }
        if (select) {
          params2.select = queryToObj(select);
        }
        console.log({ Data: params });
        return orignalMethod.apply(this, [params, params2, ...args]);
      };
      return descriptor;
    }
  };
}

export async function hashPassword(password: string) {
  const saltRounds = 10;
  const salt = await genSalt(saltRounds);
  const hashedPassword = await hash(password, salt);
  return hashedPassword;
}
