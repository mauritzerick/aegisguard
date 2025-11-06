import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { InsightsService } from './insights.service';
import { User } from '../../common/decorators/user.decorator';

@ApiTags('Observability - Insights')
@Controller('insights')
@UseGuards(AuthGuard)
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get()
  @ApiOperation({ summary: 'Get AI-less log insights (pattern detection)' })
  async getInsights(
    @User() user: any,
    @Query('window') window?: string,
  ): Promise<any> {
    const windowMinutes = parseInt(window || '60', 10);
    const orgId = user.organizationId || 1;

    const insights = await this.insightsService.generateInsights(orgId, windowMinutes);

    return {
      org_id: orgId,
      window_minutes: windowMinutes,
      insights,
      generated_at: new Date().toISOString(),
    };
  }
}

