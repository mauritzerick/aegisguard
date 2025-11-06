import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { z } from 'zod';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { AuditService } from '../audit/audit.service';
import * as argon2 from 'argon2';

const RoleUpdateSchema = z.object({ roleName: z.enum(['ADMIN', 'ANALYST', 'USER']) });
const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.union([z.enum(['ADMIN', 'ANALYST', 'USER']), z.string()]).optional().default('USER'),
});
const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['ADMIN', 'ANALYST', 'USER']).optional(),
});

@Controller('users')
@UseGuards(AuthGuard, RbacGuard)
export class UsersController {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  @Get()
  @Permissions('users:read')
  async list() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: { select: { name: true } },
        mfaEnabled: true,
        createdAt: true
      }
    });
    return users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role.name,
      mfaEnabled: user.mfaEnabled,
      createdAt: user.createdAt.toISOString(),
    }));
  }

  @Post()
  @UseGuards(CsrfGuard)
  @Permissions('users:update')
  async create(@Body(new ZodValidationPipe(CreateUserSchema)) body: any, @Req() req: any) {
    const actorUserId = req.user?.sub || null;
    
    // Check if user already exists
    const existing = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      throw new Error('User with this email already exists');
    }
    
    // Get role - normalize to uppercase and map aliases
    let roleName = body.role ? String(body.role).toUpperCase() : 'USER';
    // Map common aliases
    if (roleName === 'VIEWER') roleName = 'USER';
    if (roleName === 'EDITOR') roleName = 'ANALYST';
    
    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }
    
    // Hash password
    const passwordHash = await argon2.hash(body.password, { type: argon2.argon2id });
    
    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        roleId: role.id,
        mfaEnabled: false,
      },
    });
    
    await this.audit.log({
      action: 'user.create',
      resource: user.id,
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      actorUserId,
    });
    
    return {
      id: user.id,
      email: user.email,
      role: roleName,
      mfaEnabled: false,
      createdAt: user.createdAt.toISOString(),
    };
  }

  @Patch(':id')
  @UseGuards(CsrfGuard)
  @Permissions('users:update')
  async update(@Param('id') id: string, @Body(new ZodValidationPipe(UpdateUserSchema)) body: any, @Req() req: any) {
    const actorUserId = req.user?.sub || null;
    const updateData: any = {};
    
    if (body.email) {
      // Check if email is already taken
      const existing = await this.prisma.user.findUnique({ where: { email: body.email } });
      if (existing && existing.id !== id) {
        throw new Error('Email already in use');
      }
      updateData.email = body.email;
    }
    
    if (body.password) {
      updateData.passwordHash = await argon2.hash(body.password, { type: argon2.argon2id });
    }
    
    if (body.role) {
      let roleName = String(body.role).toUpperCase();
      // Map common aliases
      if (roleName === 'VIEWER') roleName = 'USER';
      if (roleName === 'EDITOR') roleName = 'ANALYST';
      
      const role = await this.prisma.role.findUnique({ where: { name: roleName } });
      if (!role) {
        throw new Error(`Role ${roleName} not found`);
      }
      updateData.roleId = role.id;
    }
    
    if (Object.keys(updateData).length === 0) {
      return { ok: true };
    }
    
    await this.prisma.user.update({ where: { id }, data: updateData });
    await this.audit.log({
      action: 'user.update',
      resource: id,
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      actorUserId,
    });
    
    return { ok: true };
  }

  @Patch(':id/role')
  @UseGuards(CsrfGuard)
  @Permissions('users:update')
  async updateRole(@Param('id') id: string, @Body(new ZodValidationPipe(RoleUpdateSchema)) body: any, @Req() req: any) {
    const role = await this.prisma.role.findUnique({ where: { name: body.roleName } });
    if (!role) {
      throw new Error(`Role ${body.roleName} not found`);
    }
    await this.prisma.user.update({ where: { id }, data: { roleId: role.id } });
    const actorUserId = req.user?.sub || null;
    await this.audit.log({ action: 'user.role.update', resource: id, ip: req.ip || '', userAgent: req.get('user-agent') || '', actorUserId });
    return { ok: true };
  }

  @Delete(':id')
  @UseGuards(CsrfGuard)
  @Permissions('users:update')
  async delete(@Param('id') id: string, @Req() req: any) {
    const actorUserId = req.user?.sub || req.user?.id || null;
    
    // Prevent deleting yourself
    if (actorUserId === id) {
      throw new Error('Cannot delete your own account');
    }
    
    // Check if user exists
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }
    
    try {
      // Delete related data first (sessions, API keys, IP allows, organization memberships)
      await Promise.all([
        this.prisma.session.deleteMany({ where: { userId: id } }),
        this.prisma.apiKey.deleteMany({ where: { userId: id } }),
        this.prisma.ipAllow.deleteMany({ where: { userId: id } }),
        this.prisma.organizationUser.deleteMany({ where: { userId: id } }),
      ]);
      
      // Delete the user
      await this.prisma.user.delete({ where: { id } });
      
      await this.audit.log({ 
        action: 'user.delete', 
        resource: id, 
        ip: req.ip || '', 
        userAgent: req.get('user-agent') || '', 
        actorUserId 
      });
      
      return { ok: true, message: 'User deleted successfully' };
    } catch (error: any) {
      console.error('Delete user error:', error);
      throw new Error(error.message || 'Failed to delete user');
    }
  }
}
