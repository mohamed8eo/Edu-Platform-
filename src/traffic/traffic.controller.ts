import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { TrafficService } from './traffic.service';
import { CategorieService } from '../categorie/categorie.service';
import type { Request } from 'express';
import { BanUserDto } from './dto/banUser.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Admin')
@Controller('admin')
export class TrafficController {
  constructor(
    private readonly trafficService: TrafficService,
    private readonly categorieService: CategorieService,
  ) {}

  @Get('traffic/daily')
  @ApiOperation({ summary: 'Get daily traffic statistics' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved daily traffic data.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  async getDailyTraffic(@Req() req: Request) {
    const IsUseAdmin = await this.categorieService.getUserRole(req);
    if (!IsUseAdmin) {
      throw new UnauthorizedException('Unauthorized');
    }
    return this.trafficService.getDailyTraffic();
  }
  @Get('traffic/top-endpoints')
  @ApiOperation({ summary: 'Get top visited endpoints' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved top endpoints.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  async getTopEndpoints(@Req() req: Request) {
    const IsUseAdmin = await this.categorieService.getUserRole(req);
    if (!IsUseAdmin) {
      throw new UnauthorizedException('Unauthorized');
    }
    return this.trafficService.getTopEndpoints();
  }

  @Get('traffic/slow-endpoints')
  @ApiOperation({ summary: 'Get slowest endpoints' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved slow endpoints.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  async getSlowEndpoints(@Req() req: Request) {
    const IsUseAdmin = await this.categorieService.getUserRole(req);
    if (!IsUseAdmin) {
      throw new UnauthorizedException('Unauthorized');
    }
    return this.trafficService.getSlowEndpoints();
  }

  @Get('traffic/error-stats')
  @ApiOperation({ summary: 'Get error statistics' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved error statistics.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  async getErrorStats(@Req() req: Request) {
    const IsUseAdmin = await this.categorieService.getUserRole(req);
    if (!IsUseAdmin) {
      throw new UnauthorizedException('Unauthorized');
    }
    return this.trafficService.getHttpStatusCodes();
  }

  // @Get('traffic/average-response-time')
  // @ApiOperation({ summary: 'Get average response time' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Successfully retrieved average response time.',
  // })
  // async getAverageResponseTime(@Req() req: Request) {
  //   const IsUseAdmin = await this.categorieService.getUserRole(req);
  //   if (!IsUseAdmin) {
  //     throw new UnauthorizedException('Unauthorized');
  //   }
  //   return await this.trafficService.getAverageResponseTime();
  // }

  // @Get('traffic/error-rate')
  // @ApiOperation({ summary: 'Get error rate' })
  // async getErrorRate(@Req() req: Request) {
  //   const IsUseAdmin = await this.categorieService.getUserRole(req);
  //   if (!IsUseAdmin) {
  //     throw new UnauthorizedException('Unauthorized');
  //   }
  //   return await this.trafficService.getErrorRate();
  // }

  // @Get('traffic/active-users')
  // @ApiOperation({ summary: 'Get active users count' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Successfully retrieved active users.',
  // })
  // @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  // async getActiveUsers(@Req() req: Request) {
  //   const IsUseAdmin = await this.categorieService.getUserRole(req);
  //   if (!IsUseAdmin) {
  //     throw new UnauthorizedException('Unauthorized');
  //   }
  //   return this.trafficService.getActiveUsers();
  // }

  @Get('user/:id')
  @ApiOperation({ summary: 'Get user information by ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved user information.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  async getUserInfo(@Req() req: Request, @Param('id') id: string) {
    const IsUseAdmin = await this.categorieService.getUserRole(req);
    if (!IsUseAdmin) {
      throw new UnauthorizedException('Unauthorized');
    }
    return this.trafficService.getUserInfo(id);
  }

  @Get('traffic/dashboard-stats')
  async getDashboardStats(@Req() req: Request) {
    const IsUseAdmin = await this.categorieService.getUserRole(req);
    if (!IsUseAdmin) {
      throw new UnauthorizedException('Unauthorized');
    }
    return this.trafficService.getDashboardStats(req);
  }

  @Get('all-users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved all users.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  async getAllUsers(@Req() req: Request) {
    const IsUseAdmin = await this.categorieService.getUserRole(req);
    if (!IsUseAdmin) {
      throw new UnauthorizedException('Unauthorized');
    }
    return this.trafficService.getAllUsers(req);
  }

  @Post('ban-user/:id')
  @ApiOperation({ summary: 'Ban a user' })
  @ApiResponse({ status: 201, description: 'User successfully banned.' })
  async banUser(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() banUser: BanUserDto,
  ) {
    return await this.trafficService.banUser(banUser, req, id);
  }
  @Post('unban-user/:id')
  @ApiOperation({ summary: 'Unban a user' })
  @ApiResponse({ status: 201, description: 'User successfully unbanned.' })
  async unbanUser(@Req() req: Request, @Param('id') id: string) {
    return await this.trafficService.unbinUser(id, req);
  }
}
