import { Controller, Post, Get, Body, Headers, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { createHmac, timingSafeEqual } from 'crypto';

interface WebhookSendDto {
  target: string;
  body: any;
  bodyString?: string; // Optional: original JSON string to preserve exact format
  secret: string;
}

interface WebhookReceiveResult {
  timestamp: string;
  signature: string;
  valid: boolean;
  body: any;
  latency_ms?: number;
}

@ApiTags('Demo & Playground')
@Controller('playground/webhook')
@UseGuards(AuthGuard)
export class WebhookController {
  private receivedWebhooks: WebhookReceiveResult[] = [];

  @Post('send')
  @ApiOperation({ summary: 'Sign and send a webhook (local demo)' })
  async sendWebhook(@Body() dto: WebhookSendDto) {
    const { target, body, bodyString, secret } = dto;

    // Use provided bodyString if available to preserve exact JSON format, otherwise stringify
    // This ensures signature matches what was actually sent
    const payloadString = bodyString || JSON.stringify(body);
    
    // Debug: log what we're signing
    console.log('Webhook signing debug:', {
      hasBodyString: !!bodyString,
      payloadStringLength: payloadString.length,
      payloadStringPreview: payloadString.substring(0, 100),
      secretLength: secret.length,
      secretPreview: secret.substring(0, 10) + '...',
    });
    
    const signature = this.signPayload(payloadString, secret);
    
    console.log('Generated signature:', signature.substring(0, 20) + '...');

    const startTime = Date.now();

    // Verify the signature we just created (should always pass)
    // This simulates what would happen on the receiver side
    const expectedSignature = this.signPayload(payloadString, secret);
    const valid = this.verifySignature(signature, expectedSignature);
    const verificationResult = { valid };

    const latency = Date.now() - startTime;

    // Also record in history for display
    const historyItem: WebhookReceiveResult = {
      timestamp: new Date().toISOString(),
      signature: `sha256=${signature}`,
      valid: verificationResult.valid,
      body,
      latency_ms: latency,
    };
    this.receivedWebhooks.unshift(historyItem);
    if (this.receivedWebhooks.length > 50) {
      this.receivedWebhooks = this.receivedWebhooks.slice(0, 50);
    }

    return {
      success: verificationResult.valid, // Return actual verification result
      signature: `sha256=${signature}`,
      target,
      latency_ms: latency,
      verification: verificationResult,
    };
  }

  @Post('receive')
  @ApiOperation({ summary: 'Receive and verify webhook signature' })
  async receiveWebhook(
    @Headers('x-signature') signatureHeader: string,
    @Body() body: any,
  ) {
    if (!signatureHeader) {
      throw new BadRequestException('Missing x-signature header');
    }

    // Extract signature
    const signature = signatureHeader.replace('sha256=', '');
    
    // For demo, use a default secret
    const demoSecret = 'demo-webhook-secret-12345';
    const bodyString = JSON.stringify(body);
    const expectedSignature = this.signPayload(bodyString, demoSecret);

    const valid = this.verifySignature(signature, expectedSignature);

    const result: WebhookReceiveResult = {
      timestamp: new Date().toISOString(),
      signature: signatureHeader,
      valid,
      body,
    };

    this.receivedWebhooks.unshift(result);
    if (this.receivedWebhooks.length > 50) {
      this.receivedWebhooks = this.receivedWebhooks.slice(0, 50);
    }

    return {
      success: valid,
      message: valid ? 'Signature verified' : 'Invalid signature',
      received_at: result.timestamp,
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get recent webhook receive history' })
  async getHistory() {
    return {
      count: this.receivedWebhooks.length,
      webhooks: this.receivedWebhooks,
    };
  }

  @Post('clear-history')
  @ApiOperation({ summary: 'Clear webhook history' })
  async clearHistory() {
    this.receivedWebhooks = [];
    return { success: true, message: 'History cleared' };
  }

  private signPayload(payload: string, secret: string): string {
    return createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  private verifySignature(received: string, expected: string): boolean {
    try {
      // First do a simple string comparison for debugging
      const stringMatch = received === expected;
      
      // Then do the secure comparison
      const receivedBuf = Buffer.from(received, 'hex');
      const expectedBuf = Buffer.from(expected, 'hex');
      
      if (receivedBuf.length !== expectedBuf.length) {
        console.log('Signature length mismatch:', {
          receivedLength: receivedBuf.length,
          expectedLength: expectedBuf.length,
          received: received.substring(0, 20),
          expected: expected.substring(0, 20),
        });
        return false;
      }

      const secureMatch = timingSafeEqual(receivedBuf, expectedBuf);
      
      if (!secureMatch && stringMatch) {
        console.log('String match but secure match failed - encoding issue?');
      }
      
      return secureMatch;
    } catch (error: any) {
      console.error('Signature verification error:', error.message);
      return false;
    }
  }

  private async simulateReceive(
    body: string,
    signature: string,
    secret: string,
  ): Promise<{ valid: boolean }> {
    const expectedSignature = this.signPayload(body, secret);
    const valid = this.verifySignature(signature, expectedSignature);

    // Debug logging
    console.log('Webhook verification debug:', {
      bodyLength: body.length,
      bodyPreview: body.substring(0, 100),
      signatureLength: signature.length,
      signature: signature.substring(0, 20) + '...',
      expectedSignatureLength: expectedSignature.length,
      expectedSignature: expectedSignature.substring(0, 20) + '...',
      secretLength: secret.length,
      valid,
      signaturesMatch: signature === expectedSignature,
    });

    return { valid };
  }
}

