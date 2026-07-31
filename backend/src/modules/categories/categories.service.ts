import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(tenantId: string, dto: CreateCategoryDto) {
    const slug = this.generateSlug(dto.name);

    // Validate duplicate name
    const existingName = await this.prisma.category.findFirst({
      where: { tenantId, name: { equals: dto.name, mode: 'insensitive' }, deletedAt: null },
    });
    if (existingName) {
      throw new ConflictException('Category name already exists in this tenant.');
    }

    // Validate duplicate code (slug)
    const existingSlug = await this.prisma.category.findFirst({
      where: { tenantId, slug, deletedAt: null },
    });
    if (existingSlug) {
      throw new ConflictException('Category slug/code already exists in this tenant.');
    }

    // Validate parent category exists if provided
    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, tenantId, deletedAt: null },
      });
      if (!parent) {
        throw new BadRequestException('Parent category not found.');
      }
    }

    return this.prisma.category.create({
      data: {
        tenantId,
        name: dto.name,
        slug,
        parentId: dto.parentId || null,
        description: dto.description || null,
      },
    });
  }

  async findAll(tenantId: string, query: CategoryQueryDto) {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [items, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { parent: true },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      success: true,
      statusCode: 200,
      message: 'Categories retrieved successfully',
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { parent: true, children: { where: { deletedAt: null } } },
    });

    if (!category) {
      throw new NotFoundException('Category not found in this tenant.');
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Category retrieved successfully',
      data: category,
    };
  }

  async update(tenantId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!category) {
      throw new NotFoundException('Category not found in this tenant.');
    }

    const updateData: any = {};

    if (dto.name) {
      const slug = this.generateSlug(dto.name);
      // Validate duplicate name
      const existingName = await this.prisma.category.findFirst({
        where: {
          tenantId,
          name: { equals: dto.name, mode: 'insensitive' },
          id: { not: id },
          deletedAt: null,
        },
      });
      if (existingName) {
        throw new ConflictException('Category name already exists in this tenant.');
      }

      // Validate duplicate code (slug)
      const existingSlug = await this.prisma.category.findFirst({
        where: {
          tenantId,
          slug,
          id: { not: id },
          deletedAt: null,
        },
      });
      if (existingSlug) {
        throw new ConflictException('Category slug/code already exists in this tenant.');
      }

      updateData.name = dto.name;
      updateData.slug = slug;
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException('A category cannot be its own parent.');
      }
      if (dto.parentId) {
        const parent = await this.prisma.category.findFirst({
          where: { id: dto.parentId, tenantId, deletedAt: null },
        });
        if (!parent) {
          throw new BadRequestException('Parent category not found.');
        }
      }
      updateData.parentId = dto.parentId || null;
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description || null;
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      statusCode: 200,
      message: 'Category updated successfully',
      data: updated,
    };
  }

  async softDelete(tenantId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!category) {
      throw new NotFoundException('Category not found in this tenant.');
    }

    // Check if category is used by any products
    const productsCount = await this.prisma.product.count({
      where: { categoryId: id, deletedAt: null },
    });
    if (productsCount > 0) {
      throw new BadRequestException('Cannot delete category as it is currently associated with products.');
    }

    // Check if category has child categories
    const childrenCount = await this.prisma.category.count({
      where: { parentId: id, deletedAt: null },
    });
    if (childrenCount > 0) {
      throw new BadRequestException('Cannot delete category as it has sub-categories.');
    }

    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return {
      success: true,
      statusCode: 200,
      message: 'Category deleted successfully',
    };
  }
}
