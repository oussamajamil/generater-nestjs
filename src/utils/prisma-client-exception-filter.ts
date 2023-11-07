import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let statusCode = exception?.response?.statusCode || 400;
    let message = exception?.response?.message || 'Bad Request';
    console.log(exception);
    if (exception instanceof PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        statusCode = 409;
        message = 'Duplicate key violation error ' + exception?.meta?.target;
      }
      if (exception.code === 'P2003') {
        statusCode = 404;
        message = 'Foreign key violation error ' + exception?.meta?.target;
      }
      if (exception.code === 'P2025') {
        statusCode = 404;
        message = exception?.meta?.cause || 'Record to delete does not exist.';
      }
      if (exception.code === 'P2016') {
        statusCode = 404;
        message = exception?.meta?.cause || 'Record to update does not exist.';
      }
      if (exception.code === 'P2017') {
        statusCode = 400;
        message = exception?.meta?.cause || 'Invalid relation.';
      }
    }
    if (exception instanceof PrismaClientValidationError) {
      statusCode = 400;
      message = exception.message;
    }
    response.status(statusCode).json({
      statusCode: statusCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
