import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Prevent Prisma and bcrypt from being bundled for Edge/browser
  serverExternalPackages: ['@prisma/client', 'prisma', 'bcryptjs'],
};

export default nextConfig;
