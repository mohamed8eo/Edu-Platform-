import { Module } from '@nestjs/common';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { CategorieModule } from '../categorie/categorie.module';

@Module({
  imports: [CategorieModule],
  controllers: [CourseController],
  providers: [CourseService],
})
export class CourseModule {}
