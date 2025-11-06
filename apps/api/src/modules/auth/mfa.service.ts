import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

@Injectable()
export class MfaService {
  generateSecret(): string {
    return authenticator.generateSecret();
  }

  keyUri(email: string, secret: string, appName = 'AegisGuard'): string {
    return authenticator.keyuri(email, appName, secret);
  }

  async qrDataUrl(otpauth: string): Promise<string> {
    return QRCode.toDataURL(otpauth);
  }

  verify(token: string, secret: string): boolean {
    return authenticator.check(token, secret);
  }
}





