"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function ProgressBar({ used, max, color = "blue" }: { used: number; max: number | null; color?: string }) {
  const pct = max === null ? 0 : Math.min(100, (used / max) * 100);
  const danger = pct >= 90;
  const warn = pct >= 70;
  const barColor = danger ? "bg-red-500" : warn ? "bg-amber-400" : `bg-${color}-500`;

  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      {max === null ? (
        <div className="h-full bg-emerald-400 w-full opacity-30 animate-pulse" />
      ) : (
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
      )}
    </div>
  );
}

function QuotaCard({
  label,
  icon,
  used,
  max,
  formatValue = (v: number) => String(v),
}: {
  label: string;
  icon: string;
  used: number;
  max: number | null;
  formatValue?: (v: number) => string;
}) {
  const unlimited = max === null;
  const pct = unlimited ? 0 : Math.min(100, (used / max!) * 100);
  const danger = !unlimited && pct >= 90;
  const warn = !unlimited && pct >= 70;

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
        {warn && !danger && (
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-amber-50 text-amber-600">
            Atenção
          </span>
        )}
      </div>
      <div className="mb-2">
        <span className="text-3xl font-black text-slate-900">{formatValue(used)}</span>
        <span className="text-slate-400 font-medium ml-2 text-sm">
          {unlimited ? "/ ilimitado" : `/ ${formatValue(max!)}`}
        </span>
      </div>
      <ProgressBar used={used} max={max} />
    </div>
  );
}

const PLAN_COLORS: Record<string, string> = {
  gratuito: "bg-slate-100 text-slate-600",
  pro: "bg-blue-100 text-blue-700",
  premium: "bg-amber-100 text-amber-700",
};

const PLAN_LABELS: Record<string, string> = {
  gratuito: "Gratuito",
  pro: "Pro",
  premium: "Premium",
};

export default function CobrancaPage() {
  const { token, user, isTeamBroker } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [planos, setPlanos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && isTeamBroker) {
      router.replace("/dashboard/agency");
      return;
    }
    if (!token) return;
    Promise.all([
      fetch(`${API}/api/v1/cobranca/consumo`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API}/api/v1/cobranca/planos`),
    ])
      .then(([r1, r2]) => Promise.all([r1.json(), r2.json()]))
      .then(([consumo, planosList]) => {
        setData(consumo);
        setPlanos(planosList);
      })
      .catch(() => setError("Erro ao carregar dados de consumo."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-500 font-bold bg-red-50 rounded-3xl border border-red-100">
        {error || "Erro desconhecido"}
      </div>
    );
  }

  const { tipo_plano, plano_expira_em, limites, consumo } = data;
  const isPremium = tipo_plano === "premium";
  const expiracao = plano_expira_em ? new Date(plano_expira_em).toLocaleDateString("pt-BR") : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Plano & Consumo</h1>
          <p className="text-slate-500 font-medium">Acompanhe o uso dos recursos do seu plano atual.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-block px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest ${PLAN_COLORS[tipo_plano] ?? "bg-slate-100 text-slate-600"}`}>
            {PLAN_LABELS[tipo_plano] ?? tipo_plano}
          </span>
          {expiracao && (
            <span className="text-xs text-slate-400 font-medium">Válido até {expiracao}</span>
          )}
        </div>
      </div>

      {/* Quota cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuotaCard
          label="Imóveis Ativos"
          icon="🏠"
          used={consumo.imoveis_ativos}
          max={limites.imoveis_ativos}
        />
        <QuotaCard
          label="Leads Ativos"
          icon="🎯"
          used={consumo.leads_ativos}
          max={limites.leads_ativos}
        />
        <QuotaCard
          label="Documentos"
          icon="📄"
          used={consumo.documentos}
          max={limites.documentos}
        />
        <QuotaCard
          label="Storage (documentos)"
          icon="💾"
          used={consumo.storage_bytes_documentos}
          max={limites.storage_bytes}
          formatValue={formatBytes}
        />
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📸</span>
            <span className="text-sm font-bold text-slate-600">Fotos por Imóvel</span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {limites.fotos_por_imovel ?? "∞"}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {limites.fotos_por_imovel ? `Máximo por anúncio` : "Sem limite"}
          </p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">👥</span>
            <span className="text-sm font-bold text-slate-600">Corretores na Equipe</span>
          </div>
          <div className="text-3xl font-black text-slate-900">{limites.corretores_equipe}</div>
          <p className="text-xs text-slate-400 mt-1">máximo permitido</p>
        </div>
      </div>

      {/* Feature flags */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Funcionalidades</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "WhatsApp", key: "whatsapp", icon: "💬" },
            { label: "Landing Page", key: "landing_page", icon: "🌐" },
            { label: "Assinatura Digital", key: "assinatura_digital", icon: "✍️" },
            { label: "Relatórios", key: "relatorios", icon: "📊" },
            { label: "Matching de Compradores", key: "matching", icon: "🔍" },
          ].map(({ label, key, icon }) => {
            const ativo = limites[key];
            return (
              <div
                key={key}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold ${
                  ativo ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-400"
                }`}
              >
                <span>{icon}</span>
                <span className="flex-1">{label}</span>
                <span className="text-xs">{ativo ? "✓" : "—"}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade CTA */}
      {!isPremium && (
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white">
          <h2 className="text-xl font-black mb-2">
            {tipo_plano === "gratuito" ? "Desbloqueie todo o potencial da plataforma" : "Expanda para o Premium"}
          </h2>
          <p className="text-blue-200 text-sm mb-6">
            {tipo_plano === "gratuito"
              ? "Com o plano Pro você publica até 25 imóveis, 5 fotos por imóvel, 2 GB de armazenamento, CRM, landing page, WhatsApp e relatórios."
              : "No Premium você tem imóveis ilimitados, assinatura digital e até 15 corretores na equipe."}
          </p>
          <div className="flex flex-wrap items-end gap-4">
            {planos
              .filter((p) => (tipo_plano === "gratuito" ? p.chave !== "gratuito" : p.chave === "premium"))
              .map((p) => (
                <div key={p.chave} className="bg-white/10 rounded-2xl p-4 min-w-[180px]">
                  <div className="font-black text-lg">{p.nome}</div>
                  <div className="text-2xl font-black mt-1">
                    R${" "}
                    {p.preco_mensal === 0
                      ? "0"
                      : p.preco_mensal.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                    <span className="text-sm font-medium text-blue-200">/mês</span>
                  </div>
                  {p.preco_anual > 0 && (
                    <div className="text-xs text-blue-200 mt-0.5">
                      ou R$ {p.preco_anual}/mês no anual
                    </div>
                  )}
                </div>
              ))}
            <Link
              href={`/dashboard/cobranca/upgrade?plano=${tipo_plano === "gratuito" ? "pro" : "premium"}`}
              className="px-7 py-4 bg-white text-blue-700 rounded-2xl font-black text-sm hover:bg-blue-50 transition shadow-lg"
            >
              Fazer Upgrade →
            </Link>
          </div>
        </div>
      )}

      {/* Plan comparison table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Comparativo de Planos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left p-4 text-slate-500 font-bold">Recurso</th>
                {planos.map((p) => (
                  <th
                    key={p.chave}
                    className={`p-4 font-black ${p.chave === tipo_plano ? "text-blue-600" : "text-slate-700"}`}
                  >
                    {p.nome}
                    {p.chave === tipo_plano && (
                      <span className="ml-1 text-[9px] font-black uppercase tracking-widest bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                        atual
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Imóveis Ativos", key: "imoveis_ativos", fmt: (v: any) => v === null ? "∞" : String(v) },
                { label: "Fotos / Imóvel", key: "fotos_por_imovel", fmt: (v: any) => v === null ? "∞" : String(v) },
                { label: "Leads Ativos", key: "leads_ativos", fmt: (v: any) => v === null ? "∞" : String(v) },
                { label: "Documentos", key: "documentos", fmt: (v: any) => v === null ? "∞" : String(v) },
                { label: "Storage", key: "storage_bytes", fmt: (v: any) => formatBytes(v) },
                { label: "WhatsApp", key: "whatsapp", fmt: (v: any) => v ? "✓" : "—" },
                { label: "Landing Page", key: "landing_page", fmt: (v: any) => v ? "✓" : "—" },
                { label: "Assinatura Digital", key: "assinatura_digital", fmt: (v: any) => v ? "✓" : "—" },
                { label: "Relatórios", key: "relatorios", fmt: (v: any) => v ? "✓" : "—" },
                { label: "Equipe (corretores)", key: "corretores_equipe", fmt: (v: any) => String(v) },
              ].map(({ label, key, fmt }) => (
                <tr key={key} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="p-4 text-slate-600 font-medium">{label}</td>
                  {planos.map((p) => (
                    <td
                      key={p.chave}
                      className={`p-4 text-center font-semibold ${
                        p.chave === tipo_plano ? "text-blue-600" : "text-slate-700"
                      }`}
                    >
                      {fmt(p.limites[key])}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="p-4 text-slate-600 font-bold">Preço Mensal</td>
                {planos.map((p) => (
                  <td key={p.chave} className="p-4 text-center font-black text-slate-900">
                    {p.preco_mensal === 0 ? "Grátis" : `R$ ${p.preco_mensal}/mês`}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
