'use client';

import Link from 'next/link';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Wallet, Target, HeartPulse, CheckCircle2, ClipboardList, Lightbulb, Sparkles, Clock, Layers } from 'lucide-react';
import ForceLightMode from '@/components/ForceLightMode';
import OrbitIcon from '@/components/OrbitIcon';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#about', label: 'About' },
];

const BACKGROUND = 'bg-[#F7F7F5]';

function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-md border-b border-white/40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="#" className="flex items-center gap-2 text-lg font-bold tracking-tight text-gray-900">
          <OrbitIcon
            src="/icons/top-icon.svg"
            className="h-10 w-10 rounded-2xl object-cover shadow-sm"
            fallbackClassName="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-sm"
          />
          <span className="leading-none">MyOrbit</span>
        </Link>

        <div className="hidden items-center gap-10 md:flex">
          <nav className="flex gap-6 text-sm font-medium text-gray-700">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center transition hover:text-gray-900"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/signin"
              className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-gradient-to-r from-emerald-600 to-green-700 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-300/30 transition hover:from-emerald-700 hover:to-green-800"
            >
              Get Started
            </Link>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white/80 p-2 text-gray-700 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          <span className="sr-only">Toggle navigation</span>
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d={
                open
                  ? 'M6 18L18 6M6 6l12 12'
                  : 'M4 6h16M4 12h16M4 18h16'
              }
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden">
          <div className="space-y-1 border-t border-white/40 bg-white/90 px-5 pb-5 pt-4 backdrop-blur">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block rounded-xl px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}

            <div className="mt-2 flex flex-col gap-2">
              <Link
                href="/signin"
                className="rounded-full px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100"
                onClick={() => setOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-gradient-to-r from-emerald-600 to-green-700 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm shadow-emerald-300/30 hover:from-emerald-700 hover:to-green-800"
                onClick={() => setOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function FloatingShapes() {
  return (
    <div aria-hidden="true" className="pointer-events-none">
      <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-200/60 to-emerald-100/10 blur-3xl" />
      <div className="absolute right-10 top-40 h-56 w-56 rounded-2xl bg-gradient-to-br from-green-300/30 to-emerald-200/0 blur-3xl" />
      <div className="absolute left-1/2 top-[25rem] h-72 w-72 -translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-400/20 to-transparent blur-3xl" />
    </div>
  );
}

function HeroText() {
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError,   setDemoError]   = useState<string | null>(null);

  const handleDemo = async () => {
    setDemoLoading(true);
    setDemoError(null);
    try {
      const res  = await fetch('/api/demo', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to set up demo');
      const result = await signIn('credentials', {
        email:    data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) throw new Error('Sign-in failed');
      window.location.href = '/orbit';
    } catch {
      setDemoError('Could not start demo. Please try again.');
      setDemoLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
        Your life. One orbit.
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-gray-600">
        Track your finances, goals, health, habits and tasks in one beautiful dashboard.
      </p>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link
          href="/signup"
          className="inline-flex w-full items-center justify-center rounded-full bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-700/40 transition hover:bg-emerald-800 sm:w-auto"
        >
          Get Started
        </Link>
        <button
          type="button"
          onClick={handleDemo}
          disabled={demoLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-8 py-3 text-base font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {demoLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
              Loading demo…
            </>
          ) : (
            'Try Demo'
          )}
        </button>
      </div>

      {demoError && (
        <p className="mt-3 text-sm text-red-600">{demoError}</p>
      )}

      <div className="mt-10 grid grid-cols-2 gap-2 text-xs text-gray-500 sm:grid-cols-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Clean, modern UI</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Secure & private</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Works on any device</span>
        </div>
      </div>
    </div>
  );
}

// FIX: Was showing $38,480 which didn't match sub-cards sum of $25,560.
// Now computed from a single source of truth so the numbers always add up.
function HeroPreviewCard() {
  const investments = 14220;
  const expenses    = 2840;
  const savings     = 8500;
  const netWorth    = investments + savings; // $22,720

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="relative flex w-full max-w-2xl justify-center">
      <div className="pointer-events-none absolute inset-0">
        <FloatingShapes />
      </div>

      <div className="relative z-10 w-full overflow-hidden rounded-3xl border border-white/30 bg-white/70 shadow-2xl shadow-emerald-200/20 backdrop-blur animate-float">
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Net worth</p>
              <p className="text-2xl font-semibold text-gray-900">{fmt(netWorth)}</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              +7.2%
            </span>
          </div>

          <div className="relative h-32 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100">
            <div className="absolute bottom-0 left-0 h-[72%] w-1/4 rounded-t-2xl bg-emerald-400/70" />
            <div className="absolute bottom-0 left-1/4 h-[55%] w-1/4 rounded-t-2xl bg-emerald-300/70" />
            <div className="absolute bottom-0 left-2/4 h-[65%] w-1/4 rounded-t-2xl bg-emerald-500/70" />
            <div className="absolute bottom-0 left-3/4 h-[48%] w-1/4 rounded-t-2xl bg-emerald-200/70" />
          </div>

          <div className="grid gap-3 rounded-2xl bg-white/80 p-4 shadow-inner shadow-emerald-100/50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Investments</span>
              <span className="font-semibold text-gray-900">{fmt(investments)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Expenses</span>
              <span className="font-semibold text-gray-900">{fmt(expenses)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Savings</span>
              <span className="font-semibold text-gray-900">{fmt(savings)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type FeatureCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/40 bg-white/60 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-200/40">
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl text-emerald-700 shadow-sm transition group-hover:scale-105">
          {icon}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
      </div>

      <div className="pointer-events-none absolute -right-10 -bottom-10 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-200/30 to-transparent opacity-0 transition group-hover:opacity-100" />
    </div>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">{title}</h2>
      {subtitle ? (
        <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">{subtitle}</p>
      ) : null}
    </div>
  );
}

function FeaturesSection() {
  const features = [
    {
      title: 'Finance',
      description: 'Link accounts, track spending, and follow your investments in one place.',
      icon: <Wallet className="h-6 w-6" />,
    },
    {
      title: 'Goals',
      description: 'Set targets and watch progress over time with gentle nudges.',
      icon: <Target className="h-6 w-6" />,
    },
    {
      title: 'Health',
      description: 'Track habits, fitness, and wellness metrics with a calm dashboard.',
      icon: <HeartPulse className="h-6 w-6" />,
    },
    {
      title: 'Habits',
      description: 'Build momentum with habit streaks and daily check-ins.',
      icon: <CheckCircle2 className="h-6 w-6" />,
    },
    {
      title: 'Tasks',
      description: 'Capture tasks, projects, and reminders in a single view.',
      icon: <ClipboardList className="h-6 w-6" />,
    },
    {
      title: 'Insights',
      description: 'Smart prompts and summaries help you stay on track.',
      icon: <Lightbulb className="h-6 w-6" />,
    },
  ];

  return (
    <section id="features" className="py-20">
      <SectionHeading
        title="Everything in one orbit"
        subtitle="Modules designed to keep your daily routines, finances, and goals aligned."
      />

      <div className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}

function ProductPreviewSection() {
  return (
    <section className="relative overflow-hidden py-20">
      <FloatingShapes />

      <div className="mx-auto flex max-w-6xl flex-col items-start gap-10 px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <SectionHeading
            title="A dashboard you want to open every day"
            subtitle="A serene, focused view of your net worth, spending, and investments — with no noise."
          />

          <p className="mt-6 text-base leading-relaxed text-gray-600">
            MyOrbit&apos;s preview offers a clean overview so you can quickly see what matters. Designed to feel like a personal command center.
          </p>
        </div>

        <div className="w-full max-w-xl">
          <HeroPreviewCard />
        </div>
      </div>
    </section>
  );
}

function BenefitCard({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/50 bg-white/60 p-8 shadow-sm shadow-emerald-200/25 transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-700">{icon}</div>
      <h3 className="mt-5 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-gray-600">{description}</p>
    </div>
  );
}

function BenefitsSection() {
  const benefits = [
    {
      title: 'Private & secure',
      description:
        'Your data is yours. Everything stays private by default, and we never sell your information.',
      icon: '🔒',
    },
    {
      title: 'Everything in one place',
      description:
        'From budgets to habits, you get a single home to track what matters without jumping between apps.',
      icon: '🧩',
    },
    {
      title: 'Smart insights',
      description:
        'Contextual summaries and gentle reminders help turn your intentions into progress.',
      icon: '💡',
    },
  ];

  return (
    <section className="py-20">
      <SectionHeading title="Built for calm progress" subtitle="The tools you need, presented without clutter." />

      <div className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((benefit) => (
          <BenefitCard key={benefit.title} {...benefit} />
        ))}
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="py-20">
      <SectionHeading
        title="A single orbit for your day"
        subtitle="Designed to feel like a calm companion, MyOrbit helps you stay on track without distraction."
      />

      <div className="mx-auto mt-12 grid max-w-6xl gap-8 lg:grid-cols-2">
        <div className="space-y-6 rounded-3xl border border-white/50 bg-white/60 p-10 shadow-sm shadow-emerald-100/25">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Thoughtful by design</h3>
              <p className="mt-2 text-gray-600 leading-relaxed">
                From the typography to the pacing, everything is made so you can focus on the things that matter most. No frantic dashboards, just calm clarity.
              </p>
            </div>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Built with privacy at the core, MyOrbit keeps your data yours and gives you control over what you share.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-white/50 bg-white/60 p-8 shadow-sm shadow-emerald-100/25">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Made for routines</h4>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Whether you&apos;re tracking finances, habits, or goals, MyOrbit is built to be part of your daily rhythm.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-white/50 bg-white/60 p-8 shadow-sm shadow-emerald-100/25">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Flexible workflows</h4>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Start with a clean slate or import your existing routines — the canvas is yours to shape.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CallToAction() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-green-700 py-20 text-white">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-white/40 blur-3xl" />
        <div className="absolute -right-24 top-1/2 h-52 w-52 rounded-full bg-white/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Start organizing your life today.</h2>
        <p className="mt-4 mx-auto max-w-xl text-base leading-relaxed text-emerald-100">
          Get started for free and see how a single dashboard can be the home for everything you care about.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-emerald-700 shadow-lg shadow-emerald-800/10 transition hover:bg-white/90"
          >
            Get Started
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Learn more
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className={`${BACKGROUND} border-t border-white/40 py-12`}>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3 text-base font-semibold text-gray-900">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">⭑</span>
            MyOrbit
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-gray-600">
            The calm command center for your finances, habits, and goals.
          </p>
        </div>

        {/* FIX: Footer links were all href="#" — now pointing to real routes */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-900">Terms</Link>
          <Link href="/contact" className="hover:text-gray-900">Contact</Link>
        </div>
      </div>

      <div className="mt-10 border-t border-white/40 pt-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} MyOrbit. Built for calm progress.
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main className={`${BACKGROUND} min-h-screen text-gray-900`} data-landing>
      <ForceLightMode />
      <NavBar />

      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-white pb-24 pt-20">
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-emerald-50 to-transparent" />
        <div className="mx-auto flex flex-col gap-12 px-5 pt-10 lg:flex-row lg:items-center lg:justify-between">
          <HeroText />

          <div className="relative hidden w-full max-w-xl lg:block">
            <HeroPreviewCard />
          </div>
        </div>
      </section>

      <FeaturesSection />
      <ProductPreviewSection />
      <BenefitsSection />
      <AboutSection />

      <section id="get-started">
        <CallToAction />
      </section>

      <Footer />
    </main>
  );
}