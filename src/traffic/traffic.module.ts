import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TrafficMiddleware } from './traffic.middleware';
import { TrafficService } from './traffic.service';
import { TrafficController } from './traffic.controller';
import { CategorieModule } from '../categorie/categorie.module';

@Module({
  imports: [CategorieModule],
  providers: [TrafficService],
  controllers: [TrafficController],
  exports: [TrafficService],
})
export class TrafficModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TrafficMiddleware).forRoutes('*');
  }
}
