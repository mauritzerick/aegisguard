import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface StreamMessage {
  id: string;
  data: Record<string, any>;
}

export enum StreamName {
  LOGS_RAW = 'logs:raw',
  METRICS_RAW = 'metrics:raw',
  TRACES_RAW = 'traces:raw',
  RUM_RAW = 'rum:raw',
}

@Injectable()
export class RedisStreamsService implements OnModuleInit {
  private redis: Redis;
  private consumerGroup = 'normalizer-workers';

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    // Test connection
    try {
      await this.redis.ping();
      console.log('✅ Redis Streams connected successfully');
      
      // Create consumer groups if they don't exist
      await this.createConsumerGroups();
    } catch (error: any) {
      console.error('❌ Redis Streams connection failed:', error.message);
    }
  }

  /**
   * Create consumer groups for each stream
   */
  private async createConsumerGroups() {
    const streams = Object.values(StreamName);
    
    for (const stream of streams) {
      try {
        // Create consumer group (starts from beginning of stream)
        await this.redis.xgroup('CREATE', String(stream), this.consumerGroup, '0', 'MKSTREAM');
        console.log(`✅ Consumer group created for ${stream}`);
      } catch (error: any) {
        // Group already exists or other error
        if (!error.message.includes('BUSYGROUP')) {
          console.error(`⚠️  Could not create consumer group for ${stream}:`, error.message);
        }
      }
    }
  }

  /**
   * Add message to stream
   */
  async add(
    stream: StreamName,
    data: Record<string, any>,
  ): Promise<string> {
    // Serialize all fields to strings (Redis requirement)
    const fields: string[] = [];
    for (const [key, value] of Object.entries(data)) {
      fields.push(key, typeof value === 'string' ? value : JSON.stringify(value));
    }

    // XADD returns the message ID
    const messageId = await this.redis.xadd(
      String(stream),
      '*', // Auto-generate ID
      ...fields,
    );

    return messageId || '';
  }

  /**
   * Add batch of messages to stream
   */
  async addBatch(
    stream: StreamName,
    messages: Record<string, any>[],
  ): Promise<string[]> {
    const pipeline = this.redis.pipeline();

    for (const data of messages) {
      const fields: string[] = [];
      for (const [key, value] of Object.entries(data)) {
        fields.push(key, typeof value === 'string' ? value : JSON.stringify(value));
      }
      pipeline.xadd(String(stream), '*', ...fields);
    }

    const results = await pipeline.exec();
    if (!results) return [];
    return results.map(([err, messageId]) => {
      if (err) throw err;
      return (messageId as string) || '';
    });
  }

  /**
   * Read messages from stream (consumer group)
   */
  async read(
    stream: StreamName,
    consumerId: string,
    count: number = 10,
    blockMs: number = 5000,
  ): Promise<StreamMessage[]> {
    // XREADGROUP GROUP <group> <consumer> COUNT <count> BLOCK <ms> STREAMS <stream> >
    const result = await this.redis.xreadgroup(
      'GROUP',
      this.consumerGroup,
      consumerId,
      'COUNT',
      count,
      'BLOCK',
      blockMs,
      'STREAMS',
      String(stream),
      '>', // Read only new messages
    );

    if (!result || (Array.isArray(result) ? result.length : String(result ?? '').length) === 0) {
      return [];
    }

    const messages: StreamMessage[] = [];
    const resultArray = Array.isArray(result as any) ? (result as any) : [result];
    for (const [, entries] of resultArray) {
      const entriesArray = Array.isArray(entries as any) ? (entries as any) : [entries];
      for (const [id, fields] of entriesArray) {
        // Convert fields array to object
        const data: Record<string, any> = {};
        for (let i = 0; i < fields.length; i += 2) {
          const key = fields[i];
          let value = fields[i + 1];
          
          // Try to parse JSON
          try {
            value = JSON.parse(value);
          } catch {
            // Keep as string
          }
          
          data[key] = value;
        }
        
        messages.push({ id, data });
      }
    }

    return messages;
  }

  /**
   * Acknowledge message processing
   */
  async ack(stream: StreamName, ...messageIds: string[]): Promise<number> {
    if (messageIds.length === 0) return 0;
    return await this.redis.xack(String(stream), this.consumerGroup, ...messageIds);
  }

  /**
   * Get stream info
   */
  async getStreamInfo(stream: StreamName): Promise<any> {
    return await this.redis.xinfo('STREAM', String(stream));
  }

  /**
   * Get consumer group info
   */
  async getConsumerGroupInfo(stream: StreamName): Promise<any> {
    return await this.redis.xinfo('GROUPS', String(stream));
  }

  /**
   * Get pending messages count
   */
  async getPendingCount(stream: StreamName): Promise<number> {
    const result = await this.redis.xpending(String(stream), this.consumerGroup);
    // Result: [count, minId, maxId, consumers]
    const resultArray = Array.isArray(result as any) ? (result as any) : [];
    return Number(resultArray[0]) || 0;
  }

  /**
   * Claim old pending messages (for handling worker failures)
   */
  async claimOldMessages(
    stream: StreamName,
    consumerId: string,
    minIdleTime: number = 60000, // 1 minute
    count: number = 10,
  ): Promise<StreamMessage[]> {
    // XAUTOCLAIM <stream> <group> <consumer> <min-idle-time> <start> COUNT <count>
    const result = await this.redis.xautoclaim(
      String(stream),
      this.consumerGroup,
      consumerId,
      minIdleTime,
      '0-0',
      'COUNT',
      count,
    );

    if (!result || (Array.isArray(result as any) ? (result as any).length : String(result ?? '').length) === 0) {
      return [];
    }

    const messages: StreamMessage[] = [];
    const resultArray = Array.isArray(result as any) ? (result as any) : [result];
    const [, entries] = resultArray;

    if (!entries || (Array.isArray(entries as any) ? (entries as any).length : String(entries ?? '').length) === 0) {
      return [];
    }

    const entriesArray = Array.isArray(entries as any) ? (entries as any) : [entries];
    for (const [id, fields] of entriesArray) {
      const data: Record<string, any> = {};
      for (let i = 0; i < fields.length; i += 2) {
        const key = fields[i];
        let value = fields[i + 1];
        try {
          value = JSON.parse(value);
        } catch {
          // Keep as string
        }
        data[key] = value;
      }
      messages.push({ id, data });
    }

    return messages;
  }

  /**
   * Trim stream to max length (prevent unbounded growth)
   */
  async trimStream(stream: StreamName, maxLength: number = 100000): Promise<number> {
    return await this.redis.xtrim(String(stream), 'MAXLEN', '~', maxLength);
  }

  /**
   * Get stream length
   */
  async getStreamLength(stream: StreamName): Promise<number> {
    return Number(await this.redis.xlen(String(stream))) || 0;
  }

  /**
   * Delete consumer from group
   */
  async deleteConsumer(stream: StreamName, consumerId: string): Promise<number> {
    return Number(await this.redis.xgroup('DELCONSUMER', String(stream), this.consumerGroup, consumerId)) || 0;
  }

  /**
   * Close Redis connection
   */
  async close() {
    await this.redis.quit();
  }
}





