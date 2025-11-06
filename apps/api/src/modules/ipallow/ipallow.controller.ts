import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { z } from 'zod';

const CreateSchema = z.object({ cidr: z.string().regex(/^\d+\.\d+\.\d+\.\d+\/\d+$/) });

@Controller('ip-allow')
@UseGuards(AuthGuard)
export class IpAllowController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() req: any) {
    const userId: string = req.user.sub;
    return this.prisma.ipAllow.findMany({ where: { userId } });
  }

  @Post()
  @UseGuards(CsrfGuard)
  async create(@Req() req: any, @Body(new ZodValidationPipe(CreateSchema)) body: any) {
    const userId: string = req.user.sub;
    await this.prisma.ipAllow.create({ data: { userId, cidr: body.cidr } });
    return { ok: true };
  }

  @Delete(':id')
  @UseGuards(CsrfGuard)
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId: string = req.user.sub;
    await this.prisma.ipAllow.deleteMany({ where: { id, userId } });
    return { ok: true };
  }
}
