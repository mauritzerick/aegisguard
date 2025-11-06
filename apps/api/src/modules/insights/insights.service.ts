import { Injectable } from '@nestjs/common';
import { ClickHouseService } from '../../services/clickhouse.service';

interface InsightBadge {
  id: string;
  type: 'security' | 'performance' | 'error' | 'anomaly';
  title: string;
  description: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
  samples?: any[];
}

@Injectable()
export class InsightsService {
  constructor(private readonly clickhouse: ClickHouseService) {}

  async generateInsights(orgId: number, timeWindowMinutes: number = 60): Promise<InsightBadge[]> {
    const insights: InsightBadge[] = [];

    try {
      // Get recent logs for analysis
      const logs = await this.getRecentLogs(orgId, timeWindowMinutes);

      if (logs.length === 0) {
        return insights;
      }

      // 1. Auth brute-force detection
      const authInsight = this.detectAuthBruteForce(logs);
      if (authInsight) insights.push(authInsight);

      // 2. Error burst detection
      const errorInsight = this.detectErrorBurst(logs);
      if (errorInsight) insights.push(errorInsight);

      // 3. Secret leak detection
      const secretInsight = this.detectSecretLeaks(logs);
      if (secretInsight) insights.push(secretInsight);

      // 4. Slow query detection
      const slowQueryInsight = this.detectSlowQueries(logs);
      if (slowQueryInsight) insights.push(slowQueryInsight);

      // 5. High latency pattern
      const latencyInsight = this.detectHighLatency(logs);
      if (latencyInsight) insights.push(latencyInsight);

      // 6. Repeated errors
      const repeatedErrorInsight = this.detectRepeatedErrors(logs);
      if (repeatedErrorInsight) insights.push(repeatedErrorInsight);

    } catch (error) {
      console.error('Error generating insights:', error);
    }

    return insights;
  }

  private async getRecentLogs(orgId: number, minutes: number): Promise<any[]> {
    try {
      const query = `
        SELECT 
          timestamp,
          level,
          service,
          message,
          attributes,
          source_ip
        FROM logs
        WHERE org_id = ${orgId}
          AND timestamp >= now() - INTERVAL ${minutes} MINUTE
        ORDER BY timestamp DESC
        LIMIT 10000
      `;

      const result = await this.clickhouse.query(query);
      return (Array.isArray((result) as any) ? (result as any[]) : []);
    } catch {
      return [];
    }
  }

  private detectAuthBruteForce(logs: any[]): InsightBadge | null {
    // Look for multiple auth failures from same IP
    const authFailures = logs.filter(log => 
      log.level === 'error' && 
      (log.message.toLowerCase().includes('auth') || 
       log.message.toLowerCase().includes('login') ||
       log.message.toLowerCase().includes('invalid credentials'))
    );

    if (authFailures.length === 0) return null;

    const ipCounts = new Map<string, number>();
    authFailures.forEach(log => {
      const ip = log.source_ip || 'unknown';
      ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
    });

    const suspiciousIPs = Array.from(ipCounts.entries())
      .filter(([, count]) => count >= 5)
      .sort((a, b) => b[1] - a[1]);

    if (suspiciousIPs.length === 0) return null;

    return {
      id: 'auth-bruteforce',
      type: 'security',
      title: 'Possible Brute-Force Attack',
      description: `${suspiciousIPs.length} IP(s) with multiple failed auth attempts`,
      count: authFailures.length,
      severity: suspiciousIPs[0][1] >= 10 ? 'high' : 'medium',
      samples: suspiciousIPs.slice(0, 3).map(([ip, count]) => ({ ip, attempts: count })),
    };
  }

  private detectErrorBurst(logs: any[]): InsightBadge | null {
    const errors = logs.filter(log => log.level === 'error');
    
    if (errors.length < 10) return null;

    // Calculate error rate
    const totalLogs = logs.length;
    const errorRate = (errors.length / totalLogs) * 100;

    if (errorRate < 5) return null;

    return {
      id: 'error-burst',
      type: 'error',
      title: 'Error Rate Spike',
      description: `${errorRate.toFixed(1)}% of recent logs are errors`,
      count: errors.length,
      severity: errorRate > 20 ? 'high' : errorRate > 10 ? 'medium' : 'low',
      samples: errors.slice(0, 3),
    };
  }

  private detectSecretLeaks(logs: any[]): InsightBadge | null {
    const patterns = [
      { name: 'AWS Key', regex: /AKIA[0-9A-Z]{16}/ },
      { name: 'JWT', regex: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/ },
      { name: 'API Key', regex: /api[_-]?key[_-]?=?['\"]?[a-zA-Z0-9]{16,}/ },
      { name: 'Private Key', regex: /-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----/ },
    ];

    const leaks: any[] = [];

    for (const log of logs) {
      const text = JSON.stringify(log);
      for (const pattern of patterns) {
        if (pattern.regex.test(text)) {
          leaks.push({ log, pattern: pattern.name });
        }
      }
    }

    if (leaks.length === 0) return null;

    return {
      id: 'secret-leak',
      type: 'security',
      title: 'Potential Secret Exposure',
      description: `Found ${leaks.length} log(s) with potential secrets`,
      count: leaks.length,
      severity: 'high',
      samples: leaks.slice(0, 3).map(l => ({ pattern: l.pattern, timestamp: l.log.timestamp })),
    };
  }

  private detectSlowQueries(logs: any[]): InsightBadge | null {
    const slowLogs = logs.filter(log => 
      log.message.toLowerCase().includes('slow') ||
      log.message.toLowerCase().includes('timeout') ||
      (log.attributes && JSON.parse(log.attributes).duration_ms > 1000)
    );

    if (slowLogs.length < 5) return null;

    return {
      id: 'slow-queries',
      type: 'performance',
      title: 'Slow Query Pattern',
      description: `${slowLogs.length} slow queries or timeouts detected`,
      count: slowLogs.length,
      severity: slowLogs.length > 20 ? 'high' : 'medium',
      samples: slowLogs.slice(0, 3),
    };
  }

  private detectHighLatency(logs: any[]): InsightBadge | null {
    const latencyLogs = logs.filter(log => {
      try {
        const attrs = log.attributes ? JSON.parse(log.attributes) : {};
        return attrs.duration_ms && attrs.duration_ms > 500;
      } catch {
        return false;
      }
    });

    if (latencyLogs.length < 10) return null;

    const avgLatency = latencyLogs.reduce((sum, log) => {
      const attrs = JSON.parse(log.attributes);
      return sum + attrs.duration_ms;
    }, 0) / latencyLogs.length;

    return {
      id: 'high-latency',
      type: 'performance',
      title: 'High Latency Pattern',
      description: `Average latency: ${avgLatency.toFixed(0)}ms across ${latencyLogs.length} requests`,
      count: latencyLogs.length,
      severity: avgLatency > 2000 ? 'high' : 'medium',
    };
  }

  private detectRepeatedErrors(logs: any[]): InsightBadge | null {
    const errors = logs.filter(log => log.level === 'error');
    
    if (errors.length < 5) return null;

    const messageCounts = new Map<string, number>();
    errors.forEach(log => {
      const msg = log.message.substring(0, 100); // First 100 chars
      messageCounts.set(msg, (messageCounts.get(msg) || 0) + 1);
    });

    const repeatedErrors = Array.from(messageCounts.entries())
      .filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1]);

    if (repeatedErrors.length === 0) return null;

    return {
      id: 'repeated-errors',
      type: 'error',
      title: 'Repeated Error Pattern',
      description: `${repeatedErrors.length} error message(s) occurring multiple times`,
      count: errors.length,
      severity: repeatedErrors[0][1] >= 10 ? 'high' : 'medium',
      samples: repeatedErrors.slice(0, 3).map(([msg, count]) => ({ message: msg, count })),
    };
  }
}

