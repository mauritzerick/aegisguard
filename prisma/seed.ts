import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const roles = [
  { 
    name: 'ADMIN', 
    permissions: [
      'users:read', 
      'users:update', 
      'roles:manage', 
      'apikeys:manage', 
      'events:read', 
      'audit:read',
      // Observability permissions
      'logs:read',
      'logs:write',
      'metrics:read',
      'metrics:write',
      'traces:read',
      'traces:write',
      'rum:read',
      'rum:write',
      'monitors:read',
      'monitors:write',
      'slo:read',
      'slo:write',
      'usage:read'
    ] 
  },
  { 
    name: 'ANALYST', 
    permissions: [
      'events:read', 
      'audit:read',
      'logs:read',
      'metrics:read',
      'traces:read',
      'rum:read',
      'monitors:read',
      'slo:read'
    ] 
  },
  { name: 'USER', permissions: ['self:read', 'apikeys:self', 'logs:read'] },
];

async function main() {
  console.log('🌱 Starting seed...');
  
  // Upsert permissions
  console.log('📋 Creating permissions...');
  const permissionCodes = Array.from(new Set(roles.flatMap(r => r.permissions)));
  const permissions = await Promise.all(
    permissionCodes.map(code => prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code },
    }))
  );
  const codeToPermissionId = new Map(permissions.map(p => [p.code, p.id]));

  // Upsert roles with permissions
  console.log('👥 Creating roles...');
  const createdRoles = [];
  for (const role of roles) {
    const r = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: { name: role.name },
    });
    createdRoles.push({ roleId: r.id, name: role.name, permCodes: role.permissions });
  }

  // Connect permissions to roles using the junction table
  for (const { roleId, permCodes } of createdRoles) {
    for (const code of permCodes) {
      const permId = codeToPermissionId.get(code)!;
      await prisma.$executeRaw`INSERT INTO "_PermissionToRole" ("A", "B") VALUES (${permId}, ${roleId}) ON CONFLICT DO NOTHING`;
    }
  }

  // Ensure roles exist
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const analystRole = await prisma.role.findUnique({ where: { name: 'ANALYST' } });
  const userRole = await prisma.role.findUnique({ where: { name: 'USER' } });
  if (!adminRole || !analystRole || !userRole) throw new Error('Roles not found after seeding');

  // Seed users
  console.log('👤 Creating users...');
  const adminEmail = 'admin@aegis.local';
  const adminPassword = 'ChangeMeNow!123';
  const adminPasswordHash = await argon2.hash(adminPassword, { type: argon2.argon2id });

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { roleId: adminRole.id },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      roleId: adminRole.id,
      mfaEnabled: false,
    },
  });

  // Create analyst user
  const analystPasswordHash = await argon2.hash('Analyst123!', { type: argon2.argon2id });
  const analystUser = await prisma.user.upsert({
    where: { email: 'analyst@aegis.local' },
    update: { roleId: analystRole.id },
    create: {
      email: 'analyst@aegis.local',
      passwordHash: analystPasswordHash,
      roleId: analystRole.id,
      mfaEnabled: true,
      mfaSecret: 'JBSWY3DPEHPK3PXP', // Demo secret
    },
  });

  // Create regular user
  const regularPasswordHash = await argon2.hash('User123!', { type: argon2.argon2id });
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@aegis.local' },
    update: { roleId: userRole.id },
    create: {
      email: 'user@aegis.local',
      passwordHash: regularPasswordHash,
      roleId: userRole.id,
      mfaEnabled: false,
    },
  });

  console.log('🔑 Creating API keys...');
  // Create mock API keys
  const mockApiKeys = [
    { name: 'Production Integration', userId: adminUser.id, scopes: ['events:read', 'audit:read'] },
    { name: 'Development Testing', userId: analystUser.id, scopes: ['events:read'] },
    { name: 'Monitoring Dashboard', userId: adminUser.id, scopes: ['events:read'] },
  ];

  for (const keyData of mockApiKeys) {
    const plainKey = `ags_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(plainKey).digest('hex');
    const prefix = plainKey.substring(0, 7); // "ags_abc"
    const lastFour = plainKey.slice(-4); // last 4 chars
    
    await prisma.apiKey.create({
      data: {
        name: keyData.name,
        prefix: prefix,
        hash: keyHash,
        lastFour: lastFour,
        scopes: keyData.scopes,
        userId: keyData.userId,
      },
    });
  }

  console.log('🚨 Creating security events...');
  // Create mock security events
  const mockEvents = [
    {
      type: 'auth.failed_login',
      severity: 'HIGH',
      source: '203.0.113.42',
      payload: { reason: 'Invalid password', email: 'attacker@example.com', attempts: 5 },
    },
    {
      type: 'auth.mfa_enabled',
      severity: 'LOW',
      source: '192.168.1.100',
      payload: { userId: analystUser.id, email: 'analyst@aegis.local' },
    },
    {
      type: 'api.rate_limit_exceeded',
      severity: 'MEDIUM',
      source: '198.51.100.23',
      payload: { endpoint: '/api/events', requests: 150, limit: 100 },
    },
    {
      type: 'auth.suspicious_login',
      severity: 'CRITICAL',
      source: '185.220.101.1',
      payload: { reason: 'Login from TOR exit node', email: 'admin@aegis.local' },
    },
    {
      type: 'data.unauthorized_access',
      severity: 'HIGH',
      source: '172.16.0.55',
      payload: { resource: '/users/private-data', userId: regularUser.id },
    },
    {
      type: 'api.key_created',
      severity: 'LOW',
      source: '192.168.1.100',
      payload: { keyName: 'Production Integration', userId: adminUser.id },
    },
    {
      type: 'auth.password_changed',
      severity: 'MEDIUM',
      source: '192.168.1.105',
      payload: { userId: regularUser.id, email: 'user@aegis.local' },
    },
    {
      type: 'network.port_scan_detected',
      severity: 'CRITICAL',
      source: '45.142.212.61',
      payload: { ports: [22, 80, 443, 3306, 5432], duration: '15s' },
    },
    {
      type: 'malware.file_upload_blocked',
      severity: 'CRITICAL',
      source: '10.0.0.25',
      payload: { filename: 'suspicious.exe', hash: 'a1b2c3d4e5f6', userId: regularUser.id },
    },
    {
      type: 'auth.session_expired',
      severity: 'LOW',
      source: '192.168.1.100',
      payload: { userId: adminUser.id, sessionId: 'sess_abc123' },
    },
  ];

  for (let i = 0; i < mockEvents.length; i++) {
    const event = mockEvents[i];
    const fingerprint = crypto.createHash('sha256')
      .update(`${event.type}-${event.source}-${i}-${Date.now()}`)
      .digest('hex');
    
    await prisma.securityEvent.create({
      data: {
        ...event,
        fingerprint: fingerprint,
      },
    });
  }

  console.log('📜 Creating audit logs...');
  // Create mock audit logs
  const mockAuditLogs = [
    {
      action: 'auth.login',
      resource: adminUser.id,
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      actorUserId: adminUser.id,
      meta: { success: true, method: 'password' },
    },
    {
      action: 'user.create',
      resource: regularUser.id,
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      actorUserId: adminUser.id,
      meta: { email: 'user@aegis.local', role: 'USER' },
    },
    {
      action: 'user.role_update',
      resource: analystUser.id,
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      actorUserId: adminUser.id,
      meta: { from: 'USER', to: 'ANALYST' },
    },
    {
      action: 'apikey.create',
      resource: 'key_123',
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      actorUserId: adminUser.id,
      meta: { keyName: 'Production Integration', scopes: ['events:read'] },
    },
    {
      action: 'apikey.revoke',
      resource: 'key_456',
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      actorUserId: adminUser.id,
      meta: { keyName: 'Old Development Key', reason: 'No longer needed' },
    },
    {
      action: 'auth.mfa_setup',
      resource: analystUser.id,
      ip: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      actorUserId: analystUser.id,
      meta: { method: 'TOTP' },
    },
    {
      action: 'auth.logout',
      resource: adminUser.id,
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      actorUserId: adminUser.id,
      meta: { manual: true },
    },
    {
      action: 'security.event_analyzed',
      resource: 'event_789',
      ip: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      actorUserId: analystUser.id,
      meta: { eventType: 'auth.failed_login', severity: 'HIGH', action: 'blocked_ip' },
    },
  ];

  for (const log of mockAuditLogs) {
    await prisma.auditLog.create({
      data: log,
    });
  }

  console.log('🌐 Creating IP allowlist entries...');
  // Create mock IP allowlist
  await prisma.ipAllow.create({
    data: {
      cidr: '192.168.1.100/32',
      userId: adminUser.id,
    },
  });

  await prisma.ipAllow.create({
    data: {
      cidr: '10.0.0.0/8',
      userId: adminUser.id,
    },
  });

  console.log('✅ Seed complete!');
  console.log('\n📊 Summary:');
  console.log('  - 3 Roles (ADMIN, ANALYST, USER)');
  console.log('  - 3 Users (admin@aegis.local, analyst@aegis.local, user@aegis.local)');
  console.log('  - 3 API Keys');
  console.log('  - 10 Security Events');
  console.log('  - 8 Audit Logs');
  console.log('  - 2 IP Allowlist Entries');
  console.log('\n🔐 Login Credentials:');
  console.log('  Admin:    admin@aegis.local / ChangeMeNow!123');
  console.log('  Analyst:  analyst@aegis.local / Analyst123!');
  console.log('  User:     user@aegis.local / User123!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
