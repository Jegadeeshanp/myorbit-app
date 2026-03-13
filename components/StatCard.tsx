interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
}

export default function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
        {title}
      </div>

      <div className="text-2xl font-semibold mt-2 text-gray-900">
        {value}
      </div>

      {subtitle && (
        <div className="text-sm text-gray-500 mt-1">
          {subtitle}
        </div>
      )}
    </div>
  );
}
