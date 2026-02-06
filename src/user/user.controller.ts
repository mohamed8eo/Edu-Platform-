import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { UserService } from './user.service';
import type { Request } from 'express';
import { UpdateUserDto } from './dto/update-user.dto';
import { AddCourseDto } from './dto/add-course.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('User')
@Controller('me')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({
    status: 200,
    description: 'User info retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getUser(@Req() req: Request) {
    return this.userService.getUser(req);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 201, description: 'User updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async updateUser(@Req() req: Request, @Body() updaetUser: UpdateUserDto) {
    return this.userService.updateUser(req, updaetUser);
  }

  @Post('add-course')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add course to user' })
  @ApiResponse({ status: 201, description: 'Course added successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 404,
    description: 'Course not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'User is already enrolled in this course.',
  })
  async addCourseToUser(
    @Req() req: Request,
    @Body() addCourseDto: AddCourseDto,
  ) {
    return this.userService.addCourseToUser(req, addCourseDto.courseId);
  }

  @Get('subscibe/all')
  async getSubscribedCourses(@Req() req: Request) {
    return this.userService.getSubscribedCourses(req);
  }

  @Get('subscibe/:courseId')
  async getSubscribedCourse(
    @Req() req: Request,
    @Param('courseId') courseId: string,
  ) {
    return this.userService.getSubscribedCourse(req, courseId);
  }
}
