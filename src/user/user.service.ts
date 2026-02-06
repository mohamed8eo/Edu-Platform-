/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { auth } from '../lib/auth';
import { db } from '../db';
import { courses, user, userCourses } from '../db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  public async getUserInfo(req: Request) {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    return session?.user;
  }
  async getUser(req: Request) {
    const userInfo = await this.getUserInfo(req);
    if (!userInfo?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    const [userData] = await db
      .select()
      .from(user)
      .where(eq(user.id, userInfo?.id));
    return userData;
  }

  async updateUser(req: Request, updateUser: UpdateUserDto) {
    const { name, image } = updateUser;
    const userInfo = await this.getUserInfo(req);
    if (!userInfo?.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    await db.update(user).set({ name, image }).where(eq(user.id, userInfo.id));
    return this.getUser(req);
  }

  /**
   * He send userToken & courseId
   * i will fitch userId
   * go to this table userCourses add this course for this user
   */

  async addCourseToUser(req: Request, courseId: string) {
    const userInfo = await this.getUserInfo(req);
    if (!userInfo?.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    //  Validate course existence
    const [courseExists] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!courseExists) {
      throw new NotFoundException('Course does not exist');
    }

    const [alreadyAdded] = await db
      .select()
      .from(userCourses)
      .where(
        and(
          eq(userCourses.userId, userInfo.id),
          eq(userCourses.courseId, courseId),
        ),
      );

    if (alreadyAdded) {
      throw new ConflictException('Course already added');
    }

    await db.insert(userCourses).values({
      userId: userInfo.id,
      courseId,
    });

    return {
      success: true,
      message: 'Course added successfully',
    };
  }

  //Add Save course
  async saveCourse(req: Request, courseId: string) {
    const userInfo = await this.getUserInfo(req);
    if (!userInfo?.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    //  Validate course existence
    const [courseExists] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!courseExists) {
      throw new NotFoundException('Course does not exist');
    }
  }

  //Get Subscirbe course
  async getSubscribedCourses(req: Request) {
    const userInfo = await this.getUserInfo(req);

    if (!userInfo?.id)
      throw new UnauthorizedException('User not authenticated');
    const subscribedCourses = await db
      .select()
      .from(userCourses)
      .where(eq(userCourses.userId, userInfo.id));

    if (subscribedCourses.length === 0)
      throw new NotFoundException('No courses found');

    //get course data
    const coursesData = await db
      .select()
      .from(courses)
      .where(
        inArray(
          courses.id,
          subscribedCourses.map((course) => course.courseId),
        ),
      );

    return {
      success: true,
      data: coursesData,
    };
  }

  async getSubscribedCourse(req: Request, courseId: string) {
    const userInfo = await this.getUserInfo(req);
    if (!userInfo?.id)
      throw new UnauthorizedException('User not authenticated');

    const result = await db
      .select()
      .from(userCourses)
      .where(
        and(
          eq(userCourses.userId, userInfo.id),
          eq(userCourses.courseId, courseId),
        ),
      );

    if (result.length === 0)
      return {
        success: false,
        message: 'Course not Subscribed',
      };

    return {
      success: true,
      message: 'Course Subscribed',
    };
  }
}
