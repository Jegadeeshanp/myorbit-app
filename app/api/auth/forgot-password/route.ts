// app/api/auth/forgot-password/route.ts
// Generates a secure password reset token.
// TODO: integrate with Resend / SendGrid to actually send the email.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return 200 — never reveal whether the email is registered
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    // Generate a secure random token (expires in 1 hour)
    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await prisma.passwordResetToken.create({
      data: {
        userId:    user.id,
        token,
        expiresAt,
      },
    });

    // In production: send email via Resend/SendGrid
    // const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    // await sendEmail({ to: email, subject: 'Reset your MyOrbit password', html: ... });

    // For now: log the URL (visible in Vercel function logs)
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    console.log(`[Password Reset] URL for ${email}: ${resetUrl}`);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Forgot password error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
