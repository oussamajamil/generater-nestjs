import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class NotFoundInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap((data) => {
        const status = _context.switchToHttp().getResponse().statusCode;
        if (status == 200 && data === null) {
          _context.switchToHttp().getResponse().status(404);
          _context.switchToHttp().getResponse().json({
            statusCode: 404,
            message: 'Not Found',
            error: 'Not Found',
          });
        }
      }),
    );
  }
}
