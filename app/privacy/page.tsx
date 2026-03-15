// app/privacy/page.tsx
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — MyOrbit',
  description: 'How MyOrbit collects, uses, and protects your personal data.',
};

const LAST_UPDATED = 'March 15, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-gray-600">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F7F7F5]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-base font-bold text-gray-900"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white text-sm">
              ⭑
            </span>
            MyOrbit
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
            ← Back to home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-gray-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-400">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <Section title="1. Introduction">
            <p>
              MyOrbit (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your
              personal information. This Privacy Policy explains how we collect, use, store, and protect
              your data when you use our application.
            </p>
            <p>
              By using MyOrbit, you agree to the collection and use of information as described in
              this policy. This policy complies with the Digital Personal Data Protection Act, 2023
              (India) and applicable data protection regulations.
            </p>
          </Section>

          <Section title="2. Data we collect">
            <p>We collect only the information necessary to provide our service:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li><strong className="text-gray-700">Account data:</strong> Your name, email address, and encrypted password when you register.</li>
              <li><strong className="text-gray-700">Financial data:</strong> Account balances, transactions, assets, liabilities, and budgets that you manually enter.</li>
              <li><strong className="text-gray-700">Usage data:</strong> Basic app usage logs for debugging and improving the service.</li>
            </ul>
            <p>
              We do not collect bank credentials, link to bank accounts, or access any financial
              institution on your behalf.
            </p>
          </Section>

          <Section title="3. How we use your data">
            <p>Your data is used exclusively to:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Display your financial summary and dashboard</li>
              <li>Calculate your net worth, budgets, and spending trends</li>
              <li>Send transactional emails (account creation, password reset)</li>
              <li>Improve the application based on anonymised usage patterns</li>
            </ul>
            <p>
              We never sell your data to third parties. We never use your financial data for
              advertising purposes.
            </p>
          </Section>

          <Section title="4. Data security">
            <p>
              All financial values (balances, amounts, asset values) are encrypted at rest using
              AES-256 encryption before being stored in our database. Your password is hashed using
              bcrypt and is never stored in plain text.
            </p>
            <p>
              All data is transmitted over HTTPS/TLS. We use industry-standard security practices
              and regularly review our security posture.
            </p>
          </Section>

          <Section title="5. Data retention">
            <p>
              We retain your data for as long as your account is active. You may request deletion
              of your account and all associated data at any time by contacting us at{' '}
              <a href="mailto:privacy@myorbit.app" className="text-emerald-600 hover:underline">
                privacy@myorbit.app
              </a>
              . Deletion is processed within 30 days.
            </p>
          </Section>

          <Section title="6. Your rights">
            <p>Under applicable law, you have the right to:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:privacy@myorbit.app" className="text-emerald-600 hover:underline">
                privacy@myorbit.app
              </a>
              .
            </p>
          </Section>

          <Section title="7. Cookies">
            <p>
              MyOrbit uses only essential session cookies required for authentication. We do not
              use tracking cookies, analytics cookies, or advertising cookies.
            </p>
          </Section>

          <Section title="8. Changes to this policy">
            <p>
              We may update this policy from time to time. We will notify you of significant changes
              by email or via an in-app notice. Continued use of MyOrbit after changes constitutes
              acceptance of the updated policy.
            </p>
          </Section>

          <Section title="9. Contact">
            <p>
              For any privacy-related questions, contact us at{' '}
              <a href="mailto:privacy@myorbit.app" className="text-emerald-600 hover:underline">
                privacy@myorbit.app
              </a>
              .
            </p>
          </Section>
        </div>

        <div className="mt-8 flex gap-6 text-sm text-gray-400">
          <Link href="/terms" className="hover:text-gray-700">Terms of Service</Link>
          <Link href="/contact" className="hover:text-gray-700">Contact</Link>
          <Link href="/" className="hover:text-gray-700">Home</Link>
        </div>
      </div>
    </main>
  );
}
