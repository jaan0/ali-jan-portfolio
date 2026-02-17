const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findFirst({ where: { email: 'admin@example.com' } }).then(u => {
    console.log('AVATAR_URL:' + u.avatarUrl);
}).finally(() => prisma.$disconnect());
