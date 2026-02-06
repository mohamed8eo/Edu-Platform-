/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AddCategorieDto } from './dto/addCategorie.dto';
import slugify from 'slugify';
import { db } from '../db';
import { categories, courseCategories, courses } from '../db/schema';
import { eq, isNull } from 'drizzle-orm';
import { UpdateCategorieDto } from './dto/updateCategorie.dto';
import type { Request } from 'express';
import { auth } from '../lib/auth';

@Injectable()
export class CategorieService {
  public async getUserRole(req: Request) {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (session?.user.role !== 'admin') {
      return false;
    }
    return true;
  }
  async addCategorie(addCategorie: AddCategorieDto, req: Request) {
    // check if user is admin
    const IsUseAdmin = await this.getUserRole(req);
    if (!IsUseAdmin) {
      throw new ConflictException('Unauthorized');
    }

    const { name, image, description, parentId } = addCategorie;

    // generate slug
    const slug = slugify(name, {
      replacement: '-',
      remove: undefined,
      lower: true,
      strict: true,
    });

    // check if name already exists
    const existingName = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug));

    if (existingName.length > 0) {
      throw new ConflictException('Category already exists'); // HTTP 409
    }

    // check if parent category exists
    if (parentId) {
      const parent = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, parentId));

      if (!parent.length) {
        throw new ConflictException('Parent category not found');
      }
    }

    // insert category in DB
    const result = await db
      .insert(categories)
      .values({
        name,
        slug,
        image,
        description,
        parentId,
      })
      .returning();

    return {
      message: 'Category added successfully',
      categorieId: result[0].id,
    };
  }

  async updateCategorie(
    slug: string,
    updateCategorie: UpdateCategorieDto,
    req: Request,
  ) {
    // check if user is admin
    const IsUseAdmin = await this.getUserRole(req);
    if (!IsUseAdmin) {
      throw new ConflictException('Unauthorized');
    }

    const { name, image, description, parentId } = updateCategorie;

    //Check if the categories is exist
    await this.getCategorie(slug);

    const newSlug = slugify(name, {
      replacement: '-',
      remove: undefined,
      lower: true,
      strict: true,
    });
    const result = await db
      .update(categories)
      .set({
        name,
        slug: newSlug,
        image,
        description,
        parentId,
      })
      .where(eq(categories.slug, slug))
      .returning();

    return {
      message: 'Category updated successfully',
      result,
    };
  }

  async deleteCategorie(slug: string, req: Request) {
    // check if user is admin
    const IsUseAdmin = await this.getUserRole(req);
    if (!IsUseAdmin) {
      throw new ConflictException('Unauthorized');
    }

    //check if categorie is exist
    await this.getCategorie(slug);

    //delete categorie
    await db.delete(categories).where(eq(categories.slug, slug)).returning();

    return {
      message: 'Category deleted successfully',
    };
  }

  async getCategorie(slug: string) {
    const categorie = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug));

    if (categorie.length === 0)
      throw new ConflictException('Category not found');

    return categorie;
  }

  async getAllParentCategories() {
    const categorie = await db
      .select()
      .from(categories)
      .where(isNull(categories.parentId));

    if (categorie.length === 0)
      throw new ConflictException('No categories found');

    return categorie;
  }

  async getParentChildren(slug: string) {
    // 1. Get parent category by slug
    const parent = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories)
      .where(eq(categories.slug, slug));

    if (!parent.length) {
      throw new NotFoundException('Category not found');
    }

    const parentId = parent[0].id;

    // 2. Get direct children
    const children = await db
      .select()
      .from(categories)
      .where(eq(categories.parentId, parentId));

    return {
      parent: parent[0],
      children,
    };
  }

  async getTree() {
    const all = await db.select().from(categories);

    // Fetch all courses with their category relationships
    const allCoursesWithCategories = await db
      .select({
        categoryId: courseCategories.categoryId, // Changed from courseId
        course: {
          id: courses.id,
          title: courses.title,
          slug: courses.slug,
          thumbnail: courses.thumbnail,
          level: courses.level,
          language: courses.language,
          isPublished: courses.isPublished,
        },
      })
      .from(courseCategories)
      .innerJoin(courses, eq(courseCategories.courseId, courses.id));

    type CategoryNode = (typeof all)[number] & {
      children: CategoryNode[];
      courses: (typeof allCoursesWithCategories)[number]['course'][];
    };

    const map = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    // Initialize all categories with empty children and courses arrays
    all.forEach((c) =>
      map.set(c.id, { ...c, children: [], courses: [] } as CategoryNode),
    );

    // Build the category tree
    all.forEach((c) => {
      const node = map.get(c.id);
      if (!node) return;

      if (c.parentId) {
        const parent = map.get(c.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    // Attach courses to their respective categories
    allCoursesWithCategories.forEach((cc) => {
      const categoryNode = map.get(cc.categoryId); // Changed from cc.courseId
      if (categoryNode && cc.course) {
        categoryNode.courses.push(cc.course);
      }
    });

    return roots;
  }

  async getCoursesByCategorySlug(slug: string) {
    // 1. Find category
    const category = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug));

    if (!category.length) {
      throw new NotFoundException('Category not found');
    }

    const categoryId = category[0].id;

    // 2. Get courses via pivot table
    const coursesList = await db
      .select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        thumbnail: courses.thumbnail,
        level: courses.level,
        language: courses.language,
        isPublished: courses.isPublished,
      })
      .from(courseCategories)
      .innerJoin(courses, eq(courseCategories.courseId, courses.id))
      .where(eq(courseCategories.categoryId, categoryId));

    return coursesList;
  }
}
