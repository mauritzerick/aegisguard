import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { LoginSchema, MfaEnableSchema, RegisterSchema } from './dto';
import { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { PrismaService } from '../../prisma/prisma.service';

function cookieOptions() {
  const isDev = process.env.NODE_ENV === 'development';
  const domain = process.env.COOKIE_DOMAIN || 'localhost';
  
  return {
    httpOnly: true,
    // In development, allow non-HTTPS for local testing
    secure: !isDev,
    // In development, use 'lax' to allow cross-site requests from local network
    sameSite: (isDev ? 'lax' : 'strict') as const,
    // Don't set domain in development to allow cookies to work across different IPs
    ...(isDev ? {} : { domain }),
    path: '/',
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly jwt: JwtService, private readonly prisma: PrismaService) {}

  @Post('register')
  async register(@Body(new ZodValidationPipe(RegisterSchema)) body: any, @Req() req: Request) {
    const { email, password, role } = body;
    const user = await this.auth.register(email, password, req.ip || '', req.get('user-agent') || '', role);
    return { id: user.id, email: user.email };
  }

  @Post('login')
  async login(@Body(new ZodValidationPipe(LoginSchema)) body: any, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { email, password, mfaCode, fingerprint } = body;
    const { access, refreshRaw, csrf } = await this.auth.login(email, password, mfaCode, fingerprint, req.ip || '', req.get('user-agent') || '');

    const opts = cookieOptions();
    res.cookie('access_token', access, { ...opts, maxAge: Number(process.env.ACCESS_TOKEN_TTL_MIN || 5) * 60 * 1000 });
    res.cookie('refresh_token', refreshRaw, { ...opts, maxAge: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7) * 24 * 60 * 60 * 1000 });
    res.cookie('csrf_token', csrf, { ...opts, httpOnly: false });

    return { ok: true };
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refresh = req.cookies?.['refresh_token'];
    if (!refresh) return { ok: false };
    const fingerprint = req.header('x-fingerprint') || undefined;
    const { access, refreshRaw, csrf } = await this.auth.refresh(refresh, fingerprint, req.ip || '', req.get('user-agent') || '');

    const opts = cookieOptions();
    res.cookie('access_token', access, { ...opts, maxAge: Number(process.env.ACCESS_TOKEN_TTL_MIN || 5) * 60 * 1000 });
    res.cookie('refresh_token', refreshRaw, { ...opts, maxAge: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7) * 24 * 60 * 60 * 1000 });
    res.cookie('csrf_token', csrf, { ...opts, httpOnly: false });

    return { ok: true };
  }

  @Post('logout')
  @UseGuards(AuthGuard, CsrfGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const userId = (req as any).user?.sub;
    if (userId) await this.auth.logout(userId, req.ip || '', req.get('user-agent') || '');
    const opts = cookieOptions();
    res.clearCookie('access_token', opts);
    res.clearCookie('refresh_token', opts);
    res.clearCookie('csrf_token', { ...opts, httpOnly: false });
    return { ok: true };
  }

  @Post('mfa/setup')
  @UseGuards(AuthGuard)
  async mfaSetup(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    const email = (req as any).user?.email || 'user@local';
    return this.auth.mfaSetup(userId, email);
  }

  @Post('mfa/enable')
  @UseGuards(AuthGuard, CsrfGuard)
  async mfaEnable(@Body(new ZodValidationPipe(MfaEnableSchema)) body: any, @Req() req: Request) {
    const userId = (req as any).user?.sub;
    await this.auth.mfaEnable(userId, body.code);
    return { ok: true };
  }

  @Get('/me')
  @UseGuards(AuthGuard)
  async me(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { role: { include: { permissions: true } } } });
    return { id: user?.id, email: user?.email, role: user?.role.name, permissions: user?.role.permissions.map(p => p.code) };
  }
}
