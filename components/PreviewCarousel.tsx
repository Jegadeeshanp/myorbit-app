'use client';

import { useMemo, useState } from 'react';

type Screen = {
  key: string;
  title: string;
  subtitle: string;
  src: string;
};

const SCREENS: Screen[] = [
  {
    key: 'finance',
    title: 'Finance dashboard',
    subtitle: 'Track accounts, spending and net worth in one place.',
    src: '/screens/finance.svg',
  },
  {
    key: 'accounts',
    title: 'Accounts overview',
    subtitle: 'See balances and transactions across wallets.',
    src: '/screens/accounts.svg',
  },
  {
    key: 'expenses',
    title: 'Expense tracking',
    subtitle: 'Know where your money is going each month.',
    src: '/screens/expenses.svg',
  },
  {
    key: 'investments',
    title: 'Investments view',
    subtitle: 'Review performance across stocks and funds.',
    src: '/screens/investments.svg',
  },
];

export default function PreviewCarousel() {
  const [active, setActive] = useState(0);
  const screen = SCREENS[active];

  const canPrev = active > 0;
  const canNext = active < SCREENS.length - 1;

  const handlePrev = () => setActive((prev) => Math.max(0, prev - 1));
  const handleNext = () => setActive((prev) => Math.min(SCREENS.length - 1, prev + 1));

  const dots = useMemo(
    () =>
      SCREENS.map((_, index) => (
        <button
          key={index}
          onClick={() => setActive(index)}
          className={`h-2 w-2 rounded-full transition ${
            index === active ? 'bg-white' : 'bg-white/40 hover:bg-white/70'
          }`}
        />
      )),
    [active]
  );

  return (
    <div className="relative">
      <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl shadow-black/10 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{screen.title}</h3>
            <p className="mt-1 text-sm text-white/80">{screen.subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={!canPrev}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous preview"
            >
              ←
            </button>
            <button
              onClick={handleNext}
              disabled={!canNext}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next preview"
            >
              →
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-4">
            <img
              src={screen.src}
              alt={screen.title}
              className="h-56 w-full object-cover rounded-xl border border-white/10"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent rounded-2xl" />
          </div>

          <div className="flex flex-col justify-between">
            <div className="space-y-3">
              <p className="text-sm text-white/80">
                Swipe through the preview to see what the MyOrbit dashboard looks like.
              </p>
              <div className="flex gap-2">{dots}</div>
            </div>
            <div className="text-xs text-white/60">
              Works best on desktop, but also responsive on mobile.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
