import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * PII Scrubbing Service
 * 
 * Detects and removes/masks Personally Identifiable Information:
 * - Email addresses
 * - Credit card numbers
 * - Social Security Numbers (SSN)
 * - Phone numbers
 * - IP addresses (optionally)
 * - API keys/tokens
 * 
 * Strategies:
 * 1. Redaction: Replace with [REDACTED]
 * 2. Masking: Partial display (e.g., "***@example.com")
 * 3. Hashing: Deterministic hash for joins
 */
@Injectable()
export class PIIScrubberService {
  // Regex patterns for PII detection
  private readonly patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    phone: /\b(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    // Common API key patterns
    apiKey: /\b(?:Bearer\s+)?[A-Za-z0-9_-]{32,}\b/g,
    jwt: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
  };

  // Sensitive JSON keys that might contain PII
  private readonly sensitiveKeys = [
    'password',
    'token',
    'secret',
    'apikey',
    'api_key',
    'authorization',
    'auth',
    'credit_card',
    'creditcard',
    'ssn',
    'social_security',
    'phone',
    'email',
  ];

  /**
   * Scrub PII from string
   */
  scrubString(text: string, options?: { strategy?: 'redact' | 'mask' | 'hash' }): string {
    const strategy = options?.strategy || 'redact';

    let result = text;

    // Email
    result = result.replace(this.patterns.email, (match) => {
      if (strategy === 'mask') {
        return this.maskEmail(match);
      } else if (strategy === 'hash') {
        return this.hash(match);
      }
      return '[EMAIL_REDACTED]';
    });

    // Credit cards
    result = result.replace(this.patterns.creditCard, (match) => {
      if (strategy === 'mask') {
        return this.maskCreditCard(match);
      } else if (strategy === 'hash') {
        return this.hash(match);
      }
      return '[CARD_REDACTED]';
    });

    // SSN
    result = result.replace(this.patterns.ssn, () => '[SSN_REDACTED]');

    // Phone
    result = result.replace(this.patterns.phone, (match) => {
      if (strategy === 'mask') {
        return this.maskPhone(match);
      }
      return '[PHONE_REDACTED]';
    });

    // API keys / JWTs
    result = result.replace(this.patterns.jwt, () => '[JWT_REDACTED]');
    result = result.replace(this.patterns.apiKey, () => '[API_KEY_REDACTED]');

    return result;
  }

  /**
   * Scrub PII from object (deep)
   */
  scrubObject(obj: any, options?: { strategy?: 'redact' | 'mask' | 'hash' }): any {
    if (typeof obj !== 'object' || obj === null) {
      if (typeof obj === 'string') {
        return this.scrubString(obj, options);
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.scrubObject(item, options));
    }

    const result: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      // Check if key is sensitive
      const isSensitive = this.sensitiveKeys.some((sk) => lowerKey.includes(sk));

      if (isSensitive) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'string') {
        result[key] = this.scrubString(value, options);
      } else if (typeof value === 'object') {
        result[key] = this.scrubObject(value, options);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Mask email: show first char and domain
   * Example: john.doe@example.com → j***@example.com
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '***@***';
    return `${local[0]}***@${domain}`;
  }

  /**
   * Mask credit card: show last 4 digits
   * Example: 4532-1234-5678-9010 → ****-****-****-9010
   */
  private maskCreditCard(card: string): string {
    const cleaned = card.replace(/[-\s]/g, '');
    if (cleaned.length < 4) return '****';
    const last4 = cleaned.slice(-4);
    return `****-****-****-${last4}`;
  }

  /**
   * Mask phone: show last 4 digits
   * Example: +1-555-123-4567 → ***-***-4567
   */
  private maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '***';
    const last4 = digits.slice(-4);
    return `***-***-${last4}`;
  }

  /**
   * Deterministic hash (for joining datasets while preserving privacy)
   */
  hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
  }

  /**
   * Check if string contains PII
   */
  containsPII(text: string): boolean {
    return (
      this.patterns.email.test(text) ||
      this.patterns.creditCard.test(text) ||
      this.patterns.ssn.test(text) ||
      this.patterns.phone.test(text) ||
      this.patterns.jwt.test(text) ||
      this.patterns.apiKey.test(text)
    );
  }

  /**
   * Get PII summary (for audit/debugging)
   */
  getPIISummary(obj: any): {
    found: boolean;
    types: string[];
    count: number;
  } {
    const text = JSON.stringify(obj);
    const types: string[] = [];

    if (this.patterns.email.test(text)) types.push('email');
    if (this.patterns.creditCard.test(text)) types.push('credit_card');
    if (this.patterns.ssn.test(text)) types.push('ssn');
    if (this.patterns.phone.test(text)) types.push('phone');
    if (this.patterns.jwt.test(text)) types.push('jwt');
    if (this.patterns.apiKey.test(text)) types.push('api_key');

    return {
      found: types.length > 0,
      types,
      count: types.length,
    };
  }
}





