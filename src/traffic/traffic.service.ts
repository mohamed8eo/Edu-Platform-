/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { TrafficLog } from './dto/trafficLog.dto';
import { db } from '../db';
import { eq, gte, sql } from 'drizzle-orm';
import { trafficLogs, user } from '../db/schema';
import { auth } from '../lib/auth';
import type { Request } from 'express';
import { BanUserDto } from './dto/banUser.dto';

// const DEFAULT_BAN_DURATION = Number(process.env.DEFAULT_BAN_DURATION);
@Injectable()
export class TrafficService {
  private readonly logger = new Logger('TrafficService');

  async log(data: TrafficLog) {
    await db.insert(trafficLogs).values({
      method: data.method,
      path: data.path,
      statusCode: data.statusCode,
      durationMs: data.durationMs,
      ip: data.ip,
      userAgent: data.userAgent,
      userId: data.userId,
      createdAt: data.timestamp,
    });
  }

  async getDailyTraffic() {
    return db
      .select({
        day: sql<string>`DATE(${trafficLogs.createdAt})`,
        requests: sql<number>`COUNT(*)`,
      })
      .from(trafficLogs)
      .groupBy(sql`DATE(${trafficLogs.createdAt})`)
      .orderBy(sql`DATE(${trafficLogs.createdAt})`);
  }
  async getTopEndpoints() {
    return db
      .select({
        path: trafficLogs.path,
        method: trafficLogs.method,
        statusCode: trafficLogs.statusCode,
        hits: sql<number>`COUNT(*)`,
        averageDuration: sql<number>`AVG(${trafficLogs.durationMs})`,
      })
      .from(trafficLogs)
      .groupBy(trafficLogs.path, trafficLogs.method, trafficLogs.statusCode)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(10);
  }

  async getSlowEndpoints() {
    return db
      .select({
        path: trafficLogs.path,
        method: trafficLogs.method,
        statusCode: trafficLogs.statusCode,
        hits: sql<number>`COUNT(*)`,
        averageDuration: sql<number>`AVG(${trafficLogs.durationMs})`,
      })
      .from(trafficLogs)
      .groupBy(trafficLogs.path, trafficLogs.method, trafficLogs.statusCode)
      .having(sql`COUNT(*) >= 10`)
      .orderBy(sql`AVG(${trafficLogs.durationMs}) DESC`)
      .limit(10);
  }

  async getHttpStatusCodes() {
    return db
      .select({
        statusCode: trafficLogs.statusCode,
        count: sql<number>`COUNT(*)`,
      })
      .from(trafficLogs)
      .where(gte(trafficLogs.statusCode, 200))
      .groupBy(trafficLogs.statusCode)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(10);
  }

  // async getAverageResponseTime() {
  //   return db
  //     .select({
  //       averageResponseTime: sql<number>`AVG(${trafficLogs.durationMs})`,
  //     })
  //     .from(trafficLogs);
  // }

  // async getErrorRate() {
  //   return db
  //     .select({
  //       totalRequests: sql<number>`COUNT(*)::int`,
  //       errorRequests: sql<number>`
  //       COUNT(*) FILTER (WHERE ${trafficLogs.statusCode} >= 400)::int
  //     `,
  //       errorRate: sql<number>`
  //       ROUND(
  //         (
  //           COUNT(*) FILTER (WHERE ${trafficLogs.statusCode} >= 400)::decimal
  //           / NULLIF(COUNT(*), 0)
  //         ) * 100,
  //         2
  //       )
  //     `,
  //     })
  //     .from(trafficLogs);
  // }

  async getDashboardStats(req: Request) {
    // 1. Query all traffic metrics in one go
    const trafficStats = await db
      .select({
        totalRequests: sql<number>`COUNT(*)::int`,
        errorRequests: sql<number>`
        COUNT(*) FILTER (WHERE ${trafficLogs.statusCode} >= 400)::int
      `,
        averageResponseTime: sql<number>`AVG(${trafficLogs.durationMs})`,
        activeUsersCount: sql<number>`
        COUNT(DISTINCT ${trafficLogs.userId})::int
      `,
      })
      .from(trafficLogs);

    // 2. Extract values from the result
    const {
      totalRequests,
      errorRequests,
      averageResponseTime,
      activeUsersCount,
    } = trafficStats[0] || {
      totalRequests: 0,
      errorRequests: 0,
      averageResponseTime: 0,
      activeUsersCount: 0,
    };

    // 3. Compute error rate
    const errorRate =
      totalRequests > 0
        ? parseFloat(((errorRequests / totalRequests) * 100).toFixed(2))
        : 0;

    // 4. Get total users from Auth API
    const totalUsersResponse = await auth.api.listUsers({
      query: { limit: 1 }, // only need total count
      headers: req.headers as any,
    });

    const totalUsers = totalUsersResponse.total ?? 0;

    // 5. Return aggregated dashboard data
    return {
      totalRequests,
      errorRequests,
      errorRate, // in percentage
      averageResponseTime, // in ms
      activeUsers: activeUsersCount,
      totalUsers,
    };
  }

  async getUserInfo(userId: string) {
    const userInfo = await db.select().from(user).where(eq(user.id, userId));
    if (userInfo.length === 0) throw new Error('User not found');
    return userInfo[0];
  }

  async getAllUsers(req: Request) {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = parseInt(req.query.limit as string) || 10;
    const pageSize = limit > 10 ? 10 : limit;

    return await auth.api.listUsers({
      query: {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        sortBy: 'name',
        sortDirection: 'desc',
        filterField: 'role',
        filterValue: 'admin',
        filterOperator: 'ne',
      },
      headers: req.headers as any,
    });
  }
  private parseDuration(value: string): number {
    if (value.endsWith('d')) return Number(value.slice(0, -1)) * 86400;
    if (value.endsWith('h')) return Number(value.slice(0, -1)) * 3600;
    if (value.endsWith('m')) return Number(value.slice(0, -1)) * 60;
    return Number(value);
  }

  async banUser(banUser: BanUserDto, res: Request, id: string) {
    const { banReason, banExpiresIn } = banUser;
    const parsedDuration = banExpiresIn
      ? this.parseDuration(banExpiresIn)
      : Number(process.env.DEFAULT_BAN_DURATION);

    await auth.api.banUser({
      body: {
        userId: id,
        banReason,
        banExpiresIn: parsedDuration,
      },
      headers: res.headers as any,
    });

    return {
      message: 'User banned successfully',
    };
  }

  async unbinUser(userId: string, res: Request) {
    await auth.api.unbanUser({
      body: {
        userId,
      },
      headers: res.headers as any,
    });
  }
}
