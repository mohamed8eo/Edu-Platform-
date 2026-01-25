import { Controller, Get, Param, Req } from '@nestjs/common';
import { TrafficService } from './traffic.service';
import { CategorieService } from '../categorie/categorie.service';
import type { Request } from 'express';
@Controller('admin/traffic')
export class TrafficController {
  constructor(
    private readonly trafficService: TrafficService,
    private readonly categorieService: CategorieService,
  ) {}

  @Get('daily')
  async getDailyTraffic(@Req() req: Request) {
    const IsUseAdmin = await this.categorieService.getUserRole(req);
    if (!IsUseAdmin) {
      throw new Error('Unauthorized');
    }
    return this.trafficService.getDailyTraffic();
  }
  @Get('top-endpoints')
  async getTopEndpoints(@Req() req: Request) {
    const IsUseAdmin = await this.categorieService.getUserRole(req);
    if (!IsUseAdmin) {
      throw new Error('Unauthorized');
    }
    return this.trafficService.getTopEndpoints();
  }

  @Get('slow-endpoints')
  async getSlowEndpoints(@Req() req: Request) {
    const IsUseAdmin = await this.categorieService.getUserRole(req);
    if (!IsUseAdmin) {
      throw new Error('Unauthorized');
    }
    return this.trafficService.getSlowEndpoints();
  }

  @Get('error-stats')
  async getErrorStats(@Req() req: Request) {
    const IsUseAdmin = await this.categorieService.getUserRole(req);
    if (!IsUseAdmin) {
      throw new Error('Unauthorized');
    }
    return this.trafficService.getErrorStats();
  }

  @Get('active-users')
  async getActiveUsers(@Req() req: Request) {
    const IsUseAdmin = await this.categorieService.getUserRole(req);
    if (!IsUseAdmin) {
      throw new Error('Unauthorized');
    }
    return this.trafficService.getActiveUsers();
  }

  @Get('user/:id')
  async getUserInfo(@Req() req: Request, @Param('id') id: string) {
    const IsUseAdmin = await this.categorieService.getUserRole(req);
    if (!IsUseAdmin) {
      throw new Error('Unauthorized');
    }
    return this.trafficService.getUserInfo(id);
  }
}
