'use client';

export default function NetWorthCard() {
  return (
    <div className="bg-gradient-to-br from-green-800 to-green-900 text-white rounded-2xl p-8 shadow-lg">
      <div className="text-sm opacity-75 font-semibold tracking-wide">
        NET WORTH
      </div>

      <div className="text-5xl font-bold mt-3">
        ₹58.4L
      </div>

      <div className="flex gap-8 mt-8 text-sm">
        <div>
          <div className="opacity-75 text-sm">Cash</div>
          <div className="text-xl font-semibold mt-1">₹1.34L</div>
        </div>

        <div>
          <div className="opacity-75 text-sm">Investments</div>
          <div className="text-xl font-semibold mt-1">₹52.1L</div>
        </div>

        <div>
          <div className="opacity-75 text-sm">Debt</div>
          <div className="text-xl font-semibold mt-1">₹32.6L</div>
        </div>
      </div>
    </div>
  );
}
