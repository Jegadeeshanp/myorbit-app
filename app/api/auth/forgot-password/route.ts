import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import crypto from 'crypto';

export const runtime = 'nodejs';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    if (resend) {
      await resend.emails.send({
        from:    'MyOrbit <noreply@myorbit.app>',
        to:      email,
        subject: 'Reset your MyOrbit password',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#059669">Reset your password</h2>
            <p>Hi ${user.name},</p>
            <p>We received a request to reset your MyOrbit password. Click the button below — this link expires in <strong>1 hour</strong>.</p>
            <p style="margin:24px 0">
              <a href="${resetUrl}"
                 style="background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
                Reset Password
              </a>
            </p>
            <p style="color:#6b7280;font-size:13px">
              If you didn't request this, you can safely ignore this email.<br>
              Or copy this link: ${resetUrl}
            </p>
          </div>
        `,
      });
    } else {
      // No email provider configured — log URL so dev/staging can still test the flow
      console.warn('[Password Reset] RESEND_API_KEY not set. Reset URL:', resetUrl);
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[POST /api/auth/forgot-password]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
