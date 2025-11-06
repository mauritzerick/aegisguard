import { Injectable } from '@nestjs/common';
import * as geoip from 'geoip-lite';
import * as UAParser from 'ua-parser-js';

export interface GeoData {
  country: string;
  city: string;
  region: string;
  timezone: string;
  ll: [number, number]; // [latitude, longitude]
}

export interface UAData {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
  deviceType: string; // mobile, tablet, desktop
}

/**
 * Enrichment Service
 * 
 * Adds contextual information to raw telemetry data:
 * - GeoIP lookup (country, city, timezone)
 * - User agent parsing (browser, OS, device)
 * - Hostname resolution (optional)
 */
@Injectable()
export class EnrichmentService {
  /**
   * Lookup geo information from IP address
   */
  lookupGeo(ip: string): GeoData | null {
    if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') {
      return null;
    }

    try {
      const geo = geoip.lookup(ip);
      if (!geo) return null;

      return {
        country: geo.country || '',
        city: geo.city || '',
        region: geo.region || '',
        timezone: geo.timezone || '',
        ll: geo.ll || [0, 0],
      };
    } catch (error) {
      console.error('GeoIP lookup failed:', error.message);
      return null;
    }
  }

  /**
   * Parse user agent string
   */
  parseUserAgent(ua: string): UAData | null {
    if (!ua) return null;

    try {
      const parser = new UAParser(ua);
      const browser = parser.getBrowser();
      const os = parser.getOS();
      const device = parser.getDevice();

      return {
        browser: browser.name || 'Unknown',
        browserVersion: browser.version || '',
        os: os.name || 'Unknown',
        osVersion: os.version || '',
        device: device.model || '',
        deviceType: this.getDeviceType(device.type),
      };
    } catch (error) {
      console.error('User agent parsing failed:', error.message);
      return null;
    }
  }

  /**
   * Normalize device type
   */
  private getDeviceType(type?: string): string {
    if (!type) return 'desktop';

    const normalized = type.toLowerCase();

    if (normalized.includes('mobile') || normalized.includes('phone')) {
      return 'mobile';
    }
    if (normalized.includes('tablet')) {
      return 'tablet';
    }
    if (normalized.includes('console') || normalized.includes('tv')) {
      return 'console';
    }

    return 'desktop';
  }

  /**
   * Enrich log entry with geo and UA data
   */
  enrichLog(log: any, ip?: string, ua?: string): any {
    const enriched = { ...log };

    if (ip) {
      const geo = this.lookupGeo(ip);
      if (geo) {
        enriched.geo_country = geo.country;
        enriched.geo_city = geo.city;
        enriched.geo_region = geo.region;
        enriched.geo_timezone = geo.timezone;
        enriched.geo_coordinates = geo.ll;
      }
    }

    if (ua) {
      const uaData = this.parseUserAgent(ua);
      if (uaData) {
        enriched.browser = uaData.browser;
        enriched.browser_version = uaData.browserVersion;
        enriched.os = uaData.os;
        enriched.os_version = uaData.osVersion;
        enriched.device_type = uaData.deviceType;
      }
    }

    return enriched;
  }

  /**
   * Enrich RUM event with geo and UA data
   */
  enrichRUMEvent(event: any, ip?: string, ua?: string): any {
    const enriched = { ...event };

    if (ip) {
      const geo = this.lookupGeo(ip);
      if (geo) {
        enriched.geo_country = geo.country;
        enriched.geo_city = geo.city;
      }
    }

    if (ua) {
      const uaData = this.parseUserAgent(ua);
      if (uaData) {
        enriched.browser = uaData.browser;
        enriched.browser_version = uaData.browserVersion;
        enriched.os = uaData.os;
        enriched.os_version = uaData.osVersion;
        enriched.device_type = uaData.deviceType;
      }
    }

    return enriched;
  }

  /**
   * Validate and normalize timestamp
   */
  normalizeTimestamp(ts?: string | number): Date {
    if (!ts) {
      return new Date();
    }

    try {
      if (typeof ts === 'number') {
        // Assume milliseconds if > 1e12, else seconds
        const date = ts > 1e12 ? new Date(ts) : new Date(ts * 1000);
        if (isNaN(date.getTime())) {
          return new Date();
        }
        return date;
      }

      const date = new Date(ts);
      if (isNaN(date.getTime())) {
        return new Date();
      }
      return date;
    } catch {
      return new Date();
    }
  }

  /**
   * Extract service name from resource attributes
   */
  extractServiceName(resource?: any): string {
    if (!resource) return 'unknown';

    return (
      resource.service_name ||
      resource.serviceName ||
      resource['service.name'] ||
      'unknown'
    );
  }

  /**
   * Calculate trace duration from spans
   */
  calculateTraceDuration(spans: any[]): number {
    if (spans.length === 0) return 0;

    const startTimes = spans
      .map((s) => new Date(s.start_time).getTime())
      .filter((t) => !isNaN(t));
    const endTimes = spans
      .map((s) => new Date(s.end_time).getTime())
      .filter((t) => !isNaN(t));

    if (startTimes.length === 0 || endTimes.length === 0) return 0;

    const minStart = Math.min(...startTimes);
    const maxEnd = Math.max(...endTimes);

    return maxEnd - minStart;
  }
}





