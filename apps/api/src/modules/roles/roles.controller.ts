import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { z } from 'zod';
import { CsrfGuard } from '../../common/guards/csrf.guard';

const CreateRoleSchema = z.object({ name: z.enum(['ADMIN', 'ANALYST', 'USER']), permissions: z.array(z.string()) });

@Controller('roles')
@UseGuards(AuthGuard, RbacGuard)
export class RolesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    return this.prisma.role.findMany({ include: { permissions: true } });
  }

  @Post()
  @UseGuards(CsrfGuard)
  @Permissions('roles:manage')
  async create(@Body(new ZodValidationPipe(CreateRoleSchema)) body: any) {
    const perms = await this.prisma.permission.findMany({ where: { code: { in: body.permissions } } });
    return this.prisma.role.create({ data: { name: body.name, permissions: { connect: perms.map(p => ({ id: p.id })) } } });
  }
}
