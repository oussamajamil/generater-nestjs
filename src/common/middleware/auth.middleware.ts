import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Cache } from 'cache-manager';
@Injectable()
export class MiddlewareAuth implements NestMiddleware {
  constructor(@Inject(CACHE_MANAGER) public cacheManager: Cache) {}
  async use(req: Request, res: Response, next: NextFunction) {
    return next();
    if (req.headers.authorization != undefined) {
      const token = req.headers.authorization.split(' ')[1];

      const is_valide = await this.cacheManager.get(token);
      if (is_valide == null) throw new UnauthorizedException();
    } else {
      throw new UnauthorizedException();
    }
    next();
  }
}
