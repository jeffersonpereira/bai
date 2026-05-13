interface QuotaBarProps {
  used: number;
  max: number | null;
  color?: string;
}

export function QuotaBar({ used, max, color = "blue" }: QuotaBarProps) {
  const pct = max === null ? 0 : Math.min(100, (used / max) * 100);
  const danger = pct >= 90;
  const warn = pct >= 70;
  const barColor = danger ? "bg-red-500" : warn ? "bg-amber-400" : `bg-${color}-500`;

  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      {max === null ? (
        <div className="h-full bg-emerald-400 w-full opacity-30 animate-pulse" />
      ) : (
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      )}
    </div>
  );
}

interface QuotaCardProps {
  label: string;
  icon: string;
  used: number;
  max: number | null;
  formatValue?: (v: number) => string;
}

export function QuotaCard({ label, icon, used, max, formatValue = (v) => String(v) }: QuotaCardProps) {
  const unlimited = max === null;
  const pct = unlimited ? 0 : Math.min(100, (used / max!) * 100);
  const danger = !unlimited && pct >= 90;

  return (
    <div className={`bg-white rounded-3xl border p-6 ${danger ? "border-red-200" : "border-slate-100"} shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <span className="text-sm font-bold text-slate-600">{label}</span>
        </div>
        {danger && (
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-red-50 text-red-600">
            Limite próximo
          </span>
        )}
      </div>
      <div className="mb-3">
        <span className="text-3xl font-black text-slate-900">{formatValue(used)}</span>
        {!unlimited && (
          <span className="text-sm text-slate-400 ml-2">/ {formatValue(max!)}</span>
        )}
        {unlimited && (
          <span className="text-sm text-emerald-500 font-bold ml-2">Ilimitado</span>
        )}
      </div>
      <QuotaBar used={used} max={max} />
    </div>
  );
}
