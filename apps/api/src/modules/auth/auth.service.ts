import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { addMinutes, addDays } from 'date-fns';
import { randomBytes } from 'crypto';
import { MfaService } from './mfa.service';
import { AuditService } from '../audit/audit.service';

function cookieOptions() {
  const domain = process.env.COOKIE_DOMAIN || 'localhost';
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    domain,
    path: '/',
  };
}

function issueCsrfToken() {
  return randomBytes(16).toString('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mfa: MfaService,
    private readonly audit: AuditService,
  ) {}

  async register(email: string, password: string, ip: string, userAgent: string, roleName?: string) {
    if (password.length < 8) throw new BadRequestException('Password must be at least 8 characters');
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    const targetRole = roleName || 'USER';
    const userRole = await this.prisma.role.findUnique({ where: { name: targetRole } });
    if (!userRole) throw new BadRequestException(`${targetRole} role not found`);

    const user = await this.prisma.user.create({ data: { email, passwordHash, roleId: userRole.id } });
    await this.audit.log({ action: 'auth.register', resource: user.id, ip, userAgent, actorUserId: user.id });
    return user;
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const ok = await argon2.verify(user.passwordHash, password);
    return ok ? user : null;
  }

  async login(email: string, password: string, mfaCode: string | undefined, fingerprint: string | undefined, ip: string, userAgent: string) {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (user.mfaEnabled) {
      if (!mfaCode || !user.mfaSecret || !this.mfa.verify(mfaCode, user.mfaSecret)) {
        throw new UnauthorizedException('MFA required');
      }
    }

    const accessPayload = { sub: user.id, roleId: user.roleId };
    const access = await this.jwt.signAsync(accessPayload, { secret: process.env.JWT_ACCESS_SECRET!, expiresIn: `${process.env.ACCESS_TOKEN_TTL_MIN || 5}m` });

    const refreshRaw = randomBytes(32).toString('hex');
    const refreshHash = await argon2.hash(refreshRaw, { type: argon2.argon2id });
    const fpHash = fingerprint ? await argon2.hash(fingerprint, { type: argon2.argon2id }) : '';

    const now = new Date();
    const refreshExp = addDays(now, Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7));
    const rotatesAt = addDays(now, Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7));

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: refreshHash,
        fingerprintHash: fpHash,
        rotatesAt,
        expiresAt: refreshExp,
      },
    });

    const csrf = issueCsrfToken();
    await this.audit.log({ action: 'auth.login', resource: user.id, ip, userAgent, actorUserId: user.id });

    return { access, refreshRaw, csrf };
  }

  async refresh(oldToken: string, fingerprint: string | undefined, ip: string, userAgent: string) {
    const sessions = await this.prisma.session.findMany({ where: { revokedAt: null }, orderBy: { createdAt: 'desc' } });
    let session = null as any;
    let userId: string | null = null;

    for (const s of sessions) {
      const ok = await argon2.verify(s.refreshTokenHash, oldToken).catch(() => false);
      if (ok) {
        session = s;
        userId = s.userId;
        break;
      }
    }
    if (!session || !userId) throw new UnauthorizedException('Invalid refresh');

    if (fingerprint) {
      const fpOk = await argon2.verify(session.fingerprintHash, fingerprint).catch(() => false);
      if (!fpOk) throw new UnauthorizedException('Fingerprint mismatch');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    // Rotate refresh
    const newRaw = randomBytes(32).toString('hex');
    const newHash = await argon2.hash(newRaw, { type: argon2.argon2id });

    await this.prisma.session.update({ where: { id: session.id }, data: { refreshTokenHash: newHash } });

    const accessPayload = { sub: user.id, roleId: user.roleId };
    const access = await this.jwt.signAsync(accessPayload, { secret: process.env.JWT_ACCESS_SECRET!, expiresIn: `${process.env.ACCESS_TOKEN_TTL_MIN || 5}m` });

    const csrf = issueCsrfToken();
    await this.audit.log({ action: 'auth.refresh', resource: user.id, ip, userAgent, actorUserId: user.id });

    return { access, refreshRaw: newRaw, csrf };
  }

  async logout(userId: string, ip: string, userAgent: string) {
    await this.prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.audit.log({ action: 'auth.logout', resource: userId, ip, userAgent, actorUserId: userId });
  }

  async mfaSetup(userId: string, email: string) {
    const secret = this.mfa.generateSecret();
    const otpauth = this.mfa.keyUri(email, secret);
    const qr = await this.mfa.qrDataUrl(otpauth);
    await this.prisma.user.update({ where: { id: userId }, data: { mfaSecret: secret } });
    return { secret, otpauth, qr }; // secret returned for demo; in prod you'd avoid sending it back
  }

  async mfaEnable(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mfaSecret) throw new BadRequestException('MFA not initialized');
    const ok = this.mfa.verify(code, user.mfaSecret);
    if (!ok) throw new BadRequestException('Invalid MFA code');
    await this.prisma.user.update({ where: { id: userId }, data: { mfaEnabled: true } });
  }
}

