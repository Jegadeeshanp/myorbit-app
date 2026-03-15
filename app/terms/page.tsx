// app/terms/page.tsx
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — MyOrbit',
  description: 'Terms and conditions for using MyOrbit.',
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

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F7F7F5]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-base font-bold text-gray-900">
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
          <h1 className="text-3xl font-semibold text-gray-900">Terms of Service</h1>
          <p className="mt-2 text-sm text-gray-400">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <Section title="1. Acceptance of terms">
            <p>
              By creating an account or using MyOrbit, you agree to be bound by these Terms of
              Service. If you do not agree to these terms, do not use the service.
            </p>
          </Section>

          <Section title="2. Description of service">
            <p>
              MyOrbit is a personal finance tracking application that allows you to manually record
              and monitor your accounts, transactions, assets, liabilities, and budgets. MyOrbit is
              a tool for personal organisation and does not constitute financial advice.
            </p>
            <p>
              The information displayed in MyOrbit is based solely on data you enter. We make no
              representations about the accuracy of calculations based on data you provide.
            </p>
          </Section>

          <Section title="3. Account responsibilities">
            <p>You are responsible for:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activity that occurs under your account</li>
              <li>Ensuring the accuracy of data you enter into the application</li>
              <li>Notifying us immediately of any unauthorised use of your account</li>
            </ul>
          </Section>

          <Section title="4. Acceptable use">
            <p>You agree not to:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Use the service for any unlawful purpose</li>
              <li>Attempt to gain unauthorised access to other users&apos; data</li>
              <li>Reverse-engineer, decompile, or disassemble any part of the service</li>
              <li>Use the service to store data belonging to other individuals without their consent</li>
              <li>Attempt to overwhelm or disrupt the service infrastructure</li>
            </ul>
          </Section>

          <Section title="5. Data and privacy">
            <p>
              Your use of MyOrbit is also governed by our{' '}
              <Link href="/privacy" className="text-emerald-600 hover:underline">
                Privacy Policy
              </Link>
              , which is incorporated into these Terms by reference.
            </p>
          </Section>

          <Section title="6. Disclaimer of warranties">
            <p>
              MyOrbit is provided &quot;as is&quot; without warranties of any kind, express or implied.
              We do not warrant that the service will be uninterrupted, error-free, or that data
              will never be lost. You use the service at your own risk.
            </p>
            <p>
              MyOrbit is not a licensed financial advisor, bank, or financial institution. Nothing
              in the application constitutes financial, investment, legal, or tax advice.
            </p>
          </Section>

          <Section title="7. Limitation of liability">
            <p>
              To the maximum extent permitted by law, MyOrbit and its operators shall not be liable
              for any indirect, incidental, special, or consequential damages arising from your use
              of the service, including loss of data or financial decisions made based on information
              displayed in the app.
            </p>
          </Section>

          <Section title="8. Termination">
            <p>
              We reserve the right to suspend or terminate your account if you violate these terms.
              You may delete your account at any time. Upon termination, your data will be deleted
              within 30 days as described in our Privacy Policy.
            </p>
          </Section>

          <Section title="9. Changes to terms">
            <p>
              We may modify these terms at any time. We will provide notice of significant changes
              via email or in-app notification. Continued use of the service after changes
              constitutes your acceptance of the updated terms.
            </p>
          </Section>

          <Section title="10. Governing law">
            <p>
              These terms are governed by the laws of India. Any disputes arising from these terms
              or your use of MyOrbit shall be subject to the exclusive jurisdiction of courts in
              Bengaluru, Karnataka, India.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              For questions about these terms, contact us at{' '}
              <a href="mailto:legal@myorbit.app" className="text-emerald-600 hover:underline">
                legal@myorbit.app
              </a>
              .
            </p>
          </Section>
        </div>

        <div className="mt-8 flex gap-6 text-sm text-gray-400">
          <Link href="/privacy" className="hover:text-gray-700">Privacy Policy</Link>
          <Link href="/contact" className="hover:text-gray-700">Contact</Link>
          <Link href="/" className="hover:text-gray-700">Home</Link>
        </div>
      </div>
    </main>
  );
}
