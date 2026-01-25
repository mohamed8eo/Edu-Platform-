/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { TrafficService } from './traffic.service';
import { auth } from '../lib/auth';

@Injectable()
export class TrafficMiddleware implements NestMiddleware {
  constructor(private readonly trafficService: TrafficService) {}

  async use(req: Request, res: Response, next: () => void) {
    if (req.originalUrl.startsWith('/admin')) {
      next();
      return;
    }

    const start = Date.now();
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    res.on('finish', () => {
      const duration = Date.now() - start;

      void this.trafficService.log({
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: duration,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: session?.user?.id,
        timestamp: new Date(),
      });
    });

    next();
  }
}
