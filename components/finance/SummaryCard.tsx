import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

type Props = {
  title: string;
  value: string;
  subtitle?: string;
  Icon: LucideIcon;
  valueClassName?: string;
  children?: ReactNode;
};

export default function SummaryCard({
  title,
  value,
  subtitle,
  Icon,
  valueClassName,
  children,
}: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gray-100 p-2">
            <Icon className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-700">{title}</div>
            {subtitle ? <div className="mt-1 text-xs text-gray-500">{subtitle}</div> : null}
          </div>
        </div>
      </div>

      <div className={`mt-5 text-3xl font-semibold ${valueClassName ?? 'text-gray-900'}`}>{value}</div>

      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}
