/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import type { Request } from 'express';
import { CategorieService } from '../categorie/categorie.service';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@ApiTags('Courses')
@Controller('course')
export class CourseController {
  constructor(
    private readonly courseService: CourseService,
    private readonly categoriesService: CategorieService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new course',
    description: 'Creates a new course. Requires admin privileges.',
  })
  @ApiResponse({
    status: 201,
    description: 'The course has been successfully created.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Admin access required.',
  })
  async creatCourse(
    @Body() createCourse: CreateCourseDto,
    @Req() req: Request,
  ) {
    const IsUseAdmin = await this.categoriesService.getUserRole(req);
    if (!IsUseAdmin) {
      throw new Error('Unauthorized');
    }
    return await this.courseService.createCourse(createCourse);
  }

  @Get('all')
  async getAllCourses() {
    return await this.courseService.getAllcourses();
  }

  @Patch('update/:slug')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a course',
    description:
      'Updates an existing course by slug. Requires admin privileges.',
  })
  @ApiParam({
    name: 'slug',
    description: 'The unique slug of the course',
    example: 'introduction-to-react',
  })
  @ApiResponse({
    status: 200,
    description: 'The course has been successfully updated.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Admin access required.',
  })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  async updateCourse(
    @Param('slug') slug: string,
    @Body() updateCourse: UpdateCourseDto,
    @Req() req: Request,
  ) {
    const IsUseAdmin = await this.categoriesService.getUserRole(req);
    if (!IsUseAdmin) {
      throw new Error('Unauthorized');
    }
    return await this.courseService.updateCourse(slug, updateCourse);
  }

  @Delete('delete/:slug')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a course',
    description: 'Deletes a course by slug. Requires admin privileges.',
  })
  @ApiParam({
    name: 'slug',
    description: 'The unique slug of the course',
    example: 'introduction-to-react',
  })
  @ApiResponse({
    status: 200,
    description: 'The course has been successfully deleted.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Admin access required.',
  })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  async deleteCourse(@Param('slug') slug: string, @Req() req: Request) {
    const IsUseAdmin = await this.categoriesService.getUserRole(req);
    if (!IsUseAdmin) {
      throw new Error('Unauthorized');
    }
    return await this.courseService.deleteCourse(slug);
  }

  // GET http://localhost:3000/users/search?quary=html
  @Get('search')
  @ApiOperation({
    summary: 'Search courses',
    description: 'Search for courses by title or description.',
  })
  @ApiQuery({
    name: 'query',
    description: 'The search keyword',
    example: 'javascript',
  })
  @ApiResponse({
    status: 200,
    description: 'List of courses matching the search query.',
  })
  async searchCourses(@Query('query') query: string) {
    return await this.courseService.searchCourses(query);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get course details',
    description: 'Retrieve detailed information about a specific course.',
  })
  @ApiParam({
    name: 'slug',
    description: 'The unique slug of the course',
    example: 'introduction-to-react',
  })
  @ApiResponse({
    status: 200,
    description: 'The course details.',
  })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  async getCourse(@Param('slug') slug: string) {
    return await this.courseService.getCourse(slug);
  }

  @Get(':slug/lessons')
  @ApiOperation({
    summary: 'Get course lessons',
    description: 'Retrieve all lessons associated with a specific course.',
  })
  @ApiParam({
    name: 'slug',
    description: 'The unique slug of the course',
    example: 'introduction-to-react',
  })
  @ApiResponse({
    status: 200,
    description: 'List of lessons for the course.',
  })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  async getCourseLessons(@Param('slug') slug: string) {
    return await this.courseService.getCourseLessons(slug);
  }
  @Post(':slug/lessons/:lessonId/progress')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update lesson progress',
    description:
      'Mark a lesson as completed or incomplete for the current user.',
  })
  @ApiParam({
    name: 'slug',
    description: 'The unique slug of the course',
    example: 'introduction-to-react',
  })
  @ApiParam({
    name: 'lessonId',
    description: 'The UUID of the lesson',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 201,
    description: 'Lesson progress updated successfully.',
  })
  @ApiResponse({ status: 401, description: 'User not authenticated.' })
  @ApiResponse({ status: 404, description: 'Course or lesson not found.' })
  async updateLessonProgress(
    @Req() req: Request,
    @Param('slug') slug: string,
    @Param('lessonId') lessonId: string,
    @Body() body: UpdateLessonProgressDto,
  ) {
    const user = (req as any).user;
    if (!user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Find courseId by slug
    const courseData = await this.courseService.getCourse(slug);
    const courseId = courseData.course.id;

    const { completed } = body;

    return this.courseService.markLessonProgress(
      user.id,
      courseId,
      lessonId,
      completed,
    );
  }

  @Get(':slug/lessons/progress')
  @ApiOperation({
    summary: 'Get all progress lessons for a user in a course',
    description:
      'Retrieves all progress lessons for a user in a specific course.',
  })
  @ApiParam({
    name: 'slug',
    description: 'The unique slug of the course',
    example: 'introduction-to-react',
  })
  @ApiResponse({
    status: 200,
    description: 'List of progress lessons for the user in the course.',
  })
  @ApiResponse({ status: 401, description: 'User not authenticated.' })
  @ApiResponse({ status: 404, description: 'Course or user not found.' })
  async getProgressLessonsForUserInCourse(
    @Req() req: Request,
    @Param('slug') slug: string,
  ) {
    const user = (req as any).user;
    if (!user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    return await this.courseService.getProgressLessonsForUserInCourse(
      user.id,
      slug,
    );
  }

  //get Randown 4 courses
  @Get('random/:limit')
  @AllowAnonymous()
  async getRandomCourses(@Param('limit') limit: number) {
    return await this.courseService.getRandomCourses(limit);
  }
}
