/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import slugify from 'slugify';
import { db } from '../db';
import { lessons, courseCategories, courses } from '../db/schema';
import { eq, or, ilike } from 'drizzle-orm';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

const YT_API_KEY = process.env.YT_API_KEY;

@Injectable()
export class CourseService {
  async createCourse(dto: CreateCourseDto) {
    const slug = slugify(dto.title, { lower: true, strict: true });

    // Prevent duplicate course
    const exists = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.slug, slug));

    if (exists.length) {
      throw new ConflictException('Course already exists');
    }

    //  Resolve YouTube source
    let youtubePlaylistId: string | null = null;
    let youtubeVideoId: string | null = null;
    let lessonsPayload: {
      videoId: string;
      title: string;
      duration?: string;
      thumbnail?: string;
    }[] = [];

    let candidateId = dto.youtubePlaylistId || dto.youtubeVideoId;
    if (!candidateId && dto.youtubeUrl) {
      const parsed = this.parseYoutubeUrl(dto.youtubeUrl);
      if (parsed) candidateId = parsed.id;
    }

    if (candidateId) {
      const playlistVideos = await this.fetchPlaylistVideos(candidateId);
      if (playlistVideos.length > 0) {
        youtubePlaylistId = candidateId;
        lessonsPayload = playlistVideos;
      } else {
        const video = await this.fetchSingleVideo(candidateId);
        if (video) {
          youtubeVideoId = candidateId;
          lessonsPayload = [video];
        }
      }
    }

    //  Create course
    const [course] = await db
      .insert(courses)
      .values({
        title: dto.title,
        slug,
        description: dto.description,
        thumbnail: dto.thumbnail,
        level: dto.level,
        language: dto.language,
        youtubePlaylistId,
        youtubeVideoId,
      })
      .returning();

    //  Attach categories
    if (dto.categoryIds?.length) {
      await db.insert(courseCategories).values(
        dto.categoryIds.map((categoryId) => ({
          courseId: course.id,
          categoryId,
        })),
      );
    }

    //  Create lessons
    if (lessonsPayload.length) {
      await db.insert(lessons).values(
        lessonsPayload.map((l, index) => ({
          courseId: course.id,
          title: l.title,
          youtubeVideoId: l.videoId,
          thumbnail: l.thumbnail,
          position: index.toString(),
          duration: l.duration ?? '',
        })),
      );
    }

    return {
      message: 'Course created successfully',
      id: course.id,
      slug: course.slug,
    };
  }

  async updateCourse(slug: string, updateCourse: UpdateCourseDto) {
    //check if it exist
    await this.getCourse(slug);

    const { title, description, thumbnail, level, language, categoryIds } =
      updateCourse;

    const slugUpdate = slugify(title, { lower: true, strict: true });

    const [updatedCourse] = await db
      .update(courses)
      .set({
        title,
        slug: slugUpdate,
        description,
        thumbnail,
        level,
        language,
      })
      .where(eq(courses.slug, slug))
      .returning();

    if (categoryIds?.length) {
      await db
        .delete(courseCategories)
        .where(eq(courseCategories.courseId, updatedCourse.id));
      await db.insert(courseCategories).values(
        categoryIds.map((categoryId) => ({
          courseId: updatedCourse.id,
          categoryId,
        })),
      );
    }

    return {
      message: 'Course updated successfully',
      id: updatedCourse.id,
      slug: updatedCourse.slug,
    };
  }

  async deleteCourse(slug: string) {
    await this.getCourse(slug);

    await db.delete(courses).where(eq(courses.slug, slug));

    return {
      message: 'Course deleted successfully',
    };
  }

  //Search quary
  async searchCourses(query: string) {
    const coursesInfo = await db
      .select()
      .from(courses)
      .where(
        or(
          ilike(courses.title, `%${query}%`),
          ilike(courses.description, `%${query}%`),
        ),
      );

    if (coursesInfo.length === 0) {
      return {
        message: 'No courses found',
      };
    }
    return {
      message: 'Courses found',
      Courses: [coursesInfo],
    };
  }

  async getCourse(slug: string) {
    const courseInfo = await db
      .select()
      .from(courses)
      .where(eq(courses.slug, slug));

    if (courseInfo.length === 0)
      throw new NotFoundException('Course not found');

    return {
      message: 'Course found',
      course: courseInfo[0],
    };
  }

  async getCourseLessons(slug: string) {
    const courseId = await db
      .select({
        id: courses.id,
      })
      .from(courses)
      .where(eq(courses.slug, slug))
      .limit(1);

    if (courseId.length === 0) {
      throw new NotFoundException('Course not found');
    }

    const lessonsInfo = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId[0].id));

    if (lessonsInfo.length === 0) {
      throw new NotFoundException('Lessons not found');
    }

    return {
      message: 'Lessons found',
      lessons: lessonsInfo,
    };
  }

  //  YOUTUBE SOURCE RESOLUTION
  private parseYoutubeUrl(url: string) {
    try {
      const parsed = new URL(url);

      if (parsed.searchParams.has('list')) {
        return {
          type: 'playlist' as const,
          id: parsed.searchParams.get('list')!,
        };
      }

      if (parsed.searchParams.has('v')) {
        return {
          type: 'video' as const,
          id: parsed.searchParams.get('v')!,
        };
      }

      if (parsed.hostname === 'youtu.be') {
        return {
          type: 'video' as const,
          id: parsed.pathname.slice(1),
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  //  YOUTUBE API
  private async fetchPlaylistVideos(playlistId: string) {
    const BASE = 'https://www.googleapis.com/youtube/v3/playlistItems';
    const VIDEOS_BASE = 'https://www.googleapis.com/youtube/v3/videos';

    let videos: any[] = [];
    let pageToken: string | null = null;

    do {
      const url =
        `${BASE}?part=snippet,contentDetails` +
        `&playlistId=${playlistId}` +
        `&maxResults=50` +
        (pageToken ? `&pageToken=${pageToken}` : '') +
        `&key=${YT_API_KEY}`;

      const res = await fetch(url);
      if (!res.ok) break;

      const data = await res.json();
      const items = data.items || [];

      if (items.length > 0) {
        // Fetch durations for these videos
        const videoIds = items
          .map((item: any) => item.contentDetails.videoId)
          .join(',');

        const videosUrl = `${VIDEOS_BASE}?part=contentDetails&id=${videoIds}&key=${YT_API_KEY}`;
        const videosRes = await fetch(videosUrl);
        const videosData = videosRes.ok ? await videosRes.json() : {};
        const durationMap = new Map<string, string>();

        videosData.items?.forEach((v: any) => {
          durationMap.set(v.id, v.contentDetails.duration);
        });

        videos.push(
          ...items.map((item: any) => ({
            videoId: item.contentDetails.videoId,
            title: item.snippet.title,
            duration: this.formatDuration(
              durationMap.get(item.contentDetails.videoId),
            ),
            thumbnail: item.snippet.thumbnails?.medium?.url,
          })),
        );
      }

      pageToken = data.nextPageToken ?? null;
    } while (pageToken);

    return videos;
  }

  private async fetchSingleVideo(videoId: string) {
    const url =
      `https://www.googleapis.com/youtube/v3/videos` +
      `?part=snippet,contentDetails&id=${videoId}&key=${YT_API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.items?.length) return null;

    const v = data.items[0];
    return {
      videoId: v.id,
      title: v.snippet.title,
      duration: this.formatDuration(v.contentDetails.duration),
      thumbnail: v.snippet.thumbnails?.medium?.url,
    };
  }

  private formatDuration(pt: string | undefined | null): string {
    if (!pt) return '00:00';
    const match = pt.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '00:00';

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
