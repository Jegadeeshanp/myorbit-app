import { Asset } from '@/lib/financeData';

export default function AssetTable({ assets }: { assets: Asset[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/40 bg-white/60 shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Asset</th>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Category</th>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 text-right">Value</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.id} className="border-t border-white/50 hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{asset.name}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{asset.category}</td>
              <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                {asset.value.toLocaleString('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
