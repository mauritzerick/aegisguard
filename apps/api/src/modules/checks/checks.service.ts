import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as cron from 'node-cron';

interface Check {
  id: number;
  name: string;
  url: string;
  interval_sec: number;
  method: string;
  expected_status: number;
  timeout_ms: number;
  enabled: boolean;
  last_status?: string;
  last_latency_ms?: number;
  last_checked_at?: Date;
}

interface CheckResult {
  id: number;
  status: 'up' | 'down' | 'degraded';
  latency_ms: number;
  status_code?: number;
  error?: string;
  timestamp: Date;
}

@Injectable()
export class ChecksService implements OnModuleInit {
  private readonly logger = new Logger(ChecksService.name);
  private checks: Map<number, Check> = new Map();
  private scheduledTasks: Map<number, cron.ScheduledTask> = new Map();
  private checkHistory: Map<number, CheckResult[]> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Don't initialize on Vercel (serverless functions don't support persistent state)
    if (process.env.VERCEL) {
      this.logger.log('Synthetic checks service disabled on Vercel (serverless)');
      return;
    }
    
    try {
      // Initialize with default checks
      await this.initializeDefaultChecks();
      this.logger.log('Synthetic checks service initialized');
    } catch (error: any) {
      this.logger.error('Failed to initialize checks service:', (error instanceof Error) ? error.message : String(error));
      // Don't throw - allow app to start even if checks initialization fails
    }
  }

  private async initializeDefaultChecks() {
    const defaultChecks: Omit<Check, 'id'>[] = [
      {
        name: 'API Health',
        url: 'http://localhost:3000/health',
        interval_sec: 30,
        method: 'GET',
        expected_status: 200,
        timeout_ms: 5000,
        enabled: true,
      },
      {
        name: 'API Docs',
        url: 'http://localhost:3000/docs',
        interval_sec: 60,
        method: 'GET',
        expected_status: 200,
        timeout_ms: 5000,
        enabled: true,
      },
      {
        name: 'Web UI',
        url: 'http://localhost:5173',
        interval_sec: 60,
        method: 'GET',
        expected_status: 200,
        timeout_ms: 5000,
        enabled: true,
      },
    ];

    defaultChecks.forEach((check, index) => {
      const id = index + 1;
      this.checks.set(id, { ...check, id });
      this.checkHistory.set(id, []);
      this.scheduleCheck(id);
    });
  }

  private scheduleCheck(id: number) {
    const check = this.checks.get(id);
    if (!check || !check.enabled) return;

    // Cancel existing task if any
    const existingTask = this.scheduledTasks.get(id);
    if (existingTask) {
      existingTask.stop();
    }

    // Schedule new task
    const cronExpression = `*/${check.interval_sec} * * * * *`; // Every N seconds
    const task = cron.schedule(cronExpression, async () => {
      await this.runCheck(id);
    });

    this.scheduledTasks.set(id, task);
    this.logger.log(`Scheduled check: ${check.name} (every ${check.interval_sec}s)`);
  }

  async runCheck(id: number): Promise<CheckResult> {
    const check = this.checks.get(id);
    if (!check) {
      throw new Error(`Check ${id} not found`);
    }

    const startTime = Date.now();
    let result: CheckResult;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), check.timeout_ms);

      const response = await fetch(check.url, {
        method: check.method,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      const status = response.status === check.expected_status ? 'up' : 'degraded';

      result = {
        id,
        status,
        latency_ms: latency,
        status_code: response.status,
        timestamp: new Date(),
      };
    } catch (error: any) {
      const latency = Date.now() - startTime;
      result = {
        id,
        status: 'down',
        latency_ms: latency,
        error: error.message,
        timestamp: new Date(),
      };
    }

    // Update check state
    check.last_status = result.status;
    check.last_latency_ms = result.latency_ms;
    check.last_checked_at = result.timestamp;

    // Store in history
    const history = this.checkHistory.get(id) || [];
    history.unshift(result);
    if (history.length > 100) {
      history.pop();
    }
    this.checkHistory.set(id, history);

    // Log if degraded or down
    if (result.status !== 'up') {
      this.logger.warn(`Check ${check.name}: ${result.status} (${result.error || result.status_code})`);
    }

    return result;
  }

  async getAllChecks(): Promise<Check[]> {
    return Array.from(this.checks.values());
  }

  async getCheck(id: number): Promise<Check | undefined> {
    return this.checks.get(id);
  }

  async getCheckHistory(id: number, limit: number = 50): Promise<CheckResult[]> {
    const history = this.checkHistory.get(id) || [];
    return history.slice(0, limit);
  }

  async createCheck(data: Omit<Check, 'id'>): Promise<Check> {
    const id = Math.max(...Array.from(this.checks.keys()), 0) + 1;
    const check: Check = { ...data, id };
    
    this.checks.set(id, check);
    this.checkHistory.set(id, []);
    
    if (check.enabled) {
      this.scheduleCheck(id);
    }

    return check;
  }

  async updateCheck(id: number, data: Partial<Check>): Promise<Check> {
    const check = this.checks.get(id);
    if (!check) {
      throw new Error(`Check ${id} not found`);
    }

    Object.assign(check, data);
    
    // Reschedule if interval or enabled status changed
    if (data.interval_sec !== undefined || data.enabled !== undefined) {
      this.scheduleCheck(id);
    }

    return check;
  }

  async deleteCheck(id: number): Promise<void> {
    const task = this.scheduledTasks.get(id);
    if (task) {
      task.stop();
      this.scheduledTasks.delete(id);
    }

    this.checks.delete(id);
    this.checkHistory.delete(id);
  }

  async runCheckNow(id: number): Promise<CheckResult> {
    return this.runCheck(id);
  }
}

