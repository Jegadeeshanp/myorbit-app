import { LucideIcon } from 'lucide-react';

type Props = {
  title: string;
  value: string;
  subtitle?: string;
  Icon: LucideIcon;
  valueClassName?: string;
  iconBg?: string;
  iconColor?: string;
};

export default function SummaryCard({ title, value, subtitle, Icon, valueClassName, iconBg = 'bg-gray-100', iconColor = 'text-gray-600' }: Props) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm transition hover:shadow-md">
      <div className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-400 truncate">{title}</p>
        <p className={`mt-0.5 text-xl font-bold tracking-tight truncate ${valueClassName ?? 'text-gray-900'}`}>{value}</p>
        {subtitle && <p className="mt-0.5 text-xs text-gray-400 truncate">{subtitle}</p>}
      </div>
    </div>
  );
}
