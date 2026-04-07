const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Get super admin email from environment
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@example.com';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'admin123';

  console.log(`📧 Super admin email: ${superAdminEmail}`);
  console.log('⚠️  Using default password. Please change it after first login!');

  // Check if organization already exists
  let organization = await prisma.organization.findFirst({
    where: {
      businessDetails: {
        businessNameCode: 'DEFAULT'
      }
    }
  });

  if (!organization) {
    // Create a default organization
    organization = await prisma.organization.create({
      data: {
        orgType: 'business',
        status: 'A',
        businessDetails: {
          create: {
            businessName: 'Default Organization',
            businessNameCode: 'DEFAULT',
          }
        }
      }
    });

    console.log('✅ Created default organization:', organization.id);
  } else {
    console.log('ℹ️  Default organization already exists:', organization.id);
  }

  // Check if super admin user already exists
  let adminUser = await prisma.user.findUnique({
    where: { email: superAdminEmail }
  });

  if (!adminUser) {
    // Create super admin user
    const hashedPassword = await hash(superAdminPassword, 10);

    adminUser = await prisma.user.create({
      data: {
        email: superAdminEmail,
        password: hashedPassword,
        name: 'Super Admin',
        organizationId: organization.id,
      }
    });

    console.log('✅ Created super admin user:', adminUser.email);
    console.log(`🔑 Default password: ${superAdminPassword}`);
    console.log('⚠️  IMPORTANT: Please change the password after first login!');
  } else {
    console.log('ℹ️  Super admin user already exists:', adminUser.email);
    // Update organizationId if it's missing
    if (!adminUser.organizationId) {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { organizationId: organization.id }
      });
      console.log('✅ Updated user organizationId');
    }
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

