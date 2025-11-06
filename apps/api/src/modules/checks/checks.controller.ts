import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ChecksService } from './checks.service';

@ApiTags('Demo - Synthetic Checks')
@Controller('checks')
@UseGuards(AuthGuard)
export class ChecksController {
  constructor(private readonly checksService: ChecksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all synthetic checks' })
  async getAllChecks() {
    const checks = await this.checksService.getAllChecks();
    return { checks };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get check by ID' })
  async getCheck(@Param('id') id: string) {
    const check = await this.checksService.getCheck(parseInt(id, 10));
    if (!check) {
      return { error: 'Check not found' };
    }
    return check;
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get check history' })
  async getCheckHistory(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const history = await this.checksService.getCheckHistory(
      parseInt(id, 10),
      limit ? parseInt(limit, 10) : 50,
    );
    return { history };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new synthetic check' })
  async createCheck(@Body() body: any) {
    const check = await this.checksService.createCheck(body);
    return check;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a check' })
  async updateCheck(@Param('id') id: string, @Body() body: any) {
    const check = await this.checksService.updateCheck(parseInt(id, 10), body);
    return check;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a check' })
  async deleteCheck(@Param('id') id: string) {
    await this.checksService.deleteCheck(parseInt(id, 10));
    return { success: true };
  }

  @Post(':id/run')
  @ApiOperation({ summary: 'Run check immediately' })
  async runCheck(@Param('id') id: string) {
    const result = await this.checksService.runCheckNow(parseInt(id, 10));
    return result;
  }
}

