import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import rateLimit from 'express-rate-limit';
import { json, urlencoded } from 'express';
import { WsAdapter } from '@nestjs/platform-ws';

function getCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS || '';
  return raw.split(',').map(o => o.trim()).filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Only enable WebSocket adapter if not on Vercel (serverless doesn't support persistent connections)
  if (!process.env.VERCEL) {
    app.useWebSocketAdapter(new WsAdapter(app));
  }

  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
      },
    },
    referrerPolicy: { policy: 'no-referrer' },
    crossOriginEmbedderPolicy: false,
  }));

  app.use(cookieParser());

  app.use(json({ verify: (req: any, _res, buf) => { req.rawBody = buf; } }));
  app.use(urlencoded({ extended: true }));

  const origins = getCorsOrigins();
  app.enableCors({
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return cb(null, true);
      
      // Check if origin matches configured origins
      if (origins.includes(origin)) return cb(null, true);
      
      // In development, allow localhost and local network IPs on port 5173
      if (process.env.NODE_ENV === 'development') {
        const vitePortPattern = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+):5173$/;
        if (vitePortPattern.test(origin)) return cb(null, true);
      }
      
      return cb(new Error('CORS not allowed'), false);
    },
    credentials: true,
  });

  app.use('/auth/login', rateLimit({ windowMs: 60_000, max: Number(process.env.RATE_LIMIT_AUTH_PER_MIN || 5) }));
  app.use('/auth/refresh', rateLimit({ windowMs: 60_000, max: Number(process.env.RATE_LIMIT_AUTH_PER_MIN || 5) }));
  app.use('/api', rateLimit({ windowMs: 60_000, max: Number(process.env.RATE_LIMIT_API_PER_MIN || 60) }));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('AegisGuard API')
    .setDescription('Secure-by-default API with auth, RBAC, audit, and events')
    .setVersion('0.1.0')
    .addCookieAuth('access_token')
    .addTag('Auth')
    .addTag('Users')
    .addTag('Roles')
    .addTag('API Keys')
    .addTag('Security Events')
    .addTag('Audit Logs')
    .addTag('IP Allow')
    .addTag('Health')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
