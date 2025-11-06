import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { Injectable, Logger } from '@nestjs/common';

interface LogEvent {
  ts: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  message: string;
  attrs?: Record<string, any>;
}

@Injectable()
@WebSocketGateway(3001, { 
  cors: { origin: 'http://localhost:5173', credentials: true },
  transports: ['websocket']
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WsGateway.name);
  private logGenerator: NodeJS.Timeout | null = null;
  private connectedClients = new Set<WebSocket>();

  private readonly services = ['api', 'worker', 'db', 'auth', 'web'];
  private readonly patterns = [
    { message: 'User authentication successful', level: 'info' as const, weight: 30 },
    { message: 'Database query executed', level: 'debug' as const, weight: 40 },
    { message: 'Cache miss - fetching from DB', level: 'warn' as const, weight: 15 },
    { message: 'JWT token expired', level: 'error' as const, weight: 5 },
    { message: 'Payment processing completed', level: 'info' as const, weight: 20 },
    { message: 'Slow query detected (>1s)', level: 'warn' as const, weight: 8 },
    { message: 'Connection timeout', level: 'error' as const, weight: 3 },
    { message: 'API request received', level: 'debug' as const, weight: 50 },
    { message: 'Rate limit exceeded', level: 'warn' as const, weight: 4 },
    { message: 'Authentication failed - invalid credentials', level: 'error' as const, weight: 6 },
  ];

  handleConnection(client: WebSocket) {
    this.logger.log('Client connected to WebSocket');
    this.connectedClients.add(client);

    // Start log generator if this is the first client
    if (this.connectedClients.size === 1) {
      this.startLogGenerator();
    }
  }

  handleDisconnect(client: WebSocket) {
    this.logger.log('Client disconnected from WebSocket');
    this.connectedClients.delete(client);

    // Stop log generator if no more clients
    if (this.connectedClients.size === 0) {
      this.stopLogGenerator();
    }
  }

  private startLogGenerator() {
    if (this.logGenerator) return;

    this.logger.log('Starting log generator');
    
    // Generate logs at ~10 events per second (more reasonable for demo)
    this.logGenerator = setInterval(() => {
      const log = this.generateLog();
      this.broadcast(log);
    }, 100); // 1000ms / 10 = 100ms (10 events/second)
  }

  private stopLogGenerator() {
    if (this.logGenerator) {
      clearInterval(this.logGenerator);
      this.logGenerator = null;
      this.logger.log('Stopped log generator');
    }
  }

  private generateLog(): LogEvent {
    // Weighted random selection
    const totalWeight = this.patterns.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedPattern = this.patterns[0];
    for (const pattern of this.patterns) {
      random -= pattern.weight;
      if (random <= 0) {
        selectedPattern = pattern;
        break;
      }
    }

    const service = this.services[Math.floor(Math.random() * this.services.length)];
    
    return {
      ts: new Date().toISOString(),
      level: selectedPattern.level,
      service,
      message: selectedPattern.message,
      attrs: {
        request_id: this.generateRequestId(),
        duration_ms: Math.floor(Math.random() * 500),
        user_id: Math.floor(Math.random() * 1000),
      },
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private broadcast(data: any) {
    const message = JSON.stringify(data);
    this.connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Method to trigger burst for demo
  triggerBurst(count: number = 100, level: 'error' | 'warn' = 'error') {
    this.logger.log(`Triggering burst of ${count} ${level} logs`);
    for (let i = 0; i < count; i++) {
      const log: LogEvent = {
        ts: new Date().toISOString(),
        level,
        service: this.services[Math.floor(Math.random() * this.services.length)],
        message: level === 'error' 
          ? 'Database connection failed - max retries exceeded'
          : 'High latency detected - connection pool exhausted',
        attrs: {
          request_id: this.generateRequestId(),
          duration_ms: Math.floor(Math.random() * 5000) + 1000,
          retry_count: Math.floor(Math.random() * 5),
        },
      };
      this.broadcast(log);
    }
  }
}

