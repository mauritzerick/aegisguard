import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding organizations...');

  // Generate API key and secret
  const apiKeyPrefix = 'obs_dev123';
  const fullApiKey = `${apiKeyPrefix}_${crypto.randomBytes(16).toString('hex')}`;
  const secret = crypto.randomBytes(32).toString('hex');

  // Hash API key (SHA-256)
  const apiKeyHash = crypto.createHash('sha256').update(fullApiKey).digest('hex');

  // Hash secret (for HMAC verification)
  const secretHash = crypto.createHash('sha256').update(secret).digest('hex');

  // Create test organization
  const org = await prisma.organization.upsert({
    where: { slug: 'test-org' },
    update: {},
    create: {
      name: 'Test Organization',
      slug: 'test-org',
      apiKeyPrefix,
      apiKeyHash,
      secretHash,
    },
  });

  console.log('✅ Organization created:', org.name);
  console.log('');
  console.log('📋 API Credentials:');
  console.log('-------------------');
  console.log('Organization ID:', org.id);
  console.log('API Key Prefix (x-org-key):', apiKeyPrefix);
  console.log('Full API Key:', fullApiKey);
  console.log('Secret (for HMAC):', secret);
  console.log('');
  console.log('🔐 Example HMAC Signature Generation (bash):');
  console.log('-------------------------------------------');
  console.log(`BODY='{"logs":[{"service":"api","level":"info","message":"Test log"}]}'`);
  console.log(`SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "${secret}" | awk '{print $2}')`);
  console.log(`echo "x-signature: sha256=$SIGNATURE"`);
  console.log('');

  // Link admin user to organization (if exists)
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@example.com' },
  });

  if (adminUser) {
    await prisma.organizationUser.upsert({
      where: {
        orgId_userId: {
          orgId: org.id,
          userId: adminUser.id,
        },
      },
      update: {},
      create: {
        orgId: org.id,
        userId: adminUser.id,
        role: 'owner',
      },
    });
    console.log('✅ Admin user linked to organization');
  } else {
    console.log('⚠️  Admin user not found. Run seed.ts first to create users.');
  }

  // Add necessary permissions for query endpoints
  const queryPermissions = [
    'logs:read',
    'metrics:read',
    'traces:read',
    'rum:read',
  ];

  for (const code of queryPermissions) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }

  // Link permissions to admin role
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' },
    include: { permissions: true },
  });

  if (adminRole) {
    for (const code of queryPermissions) {
      const permission = await prisma.permission.findUnique({ where: { code } });
      if (permission && !adminRole.permissions.some((p) => p.code === code)) {
        await prisma.$executeRaw`
          INSERT INTO "_PermissionToRole" ("A", "B")
          VALUES (${permission.id}, ${adminRole.id})
          ON CONFLICT DO NOTHING
        `;
      }
    }
    console.log('✅ Query permissions added to admin role');
  }

  console.log('');
  console.log('🎉 Organization seeding complete!');
  console.log('');
  console.log('📝 Save these credentials securely:');
  console.log(`   API Key Prefix: ${apiKeyPrefix}`);
  console.log(`   HMAC Secret: ${secret}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





