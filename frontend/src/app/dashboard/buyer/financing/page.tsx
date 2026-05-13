"use client";
import { useState } from "react";
import Link from "next/link";
import CurrencyInput from "@/app/components/ui/CurrencyInput";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

const TERM_OPTIONS = [
  { months: 120, label: "10 anos" },
  { months: 180, label: "15 anos" },
  { months: 240, label: "20 anos" },
  { months: 300, label: "25 anos" },
  { months: 360, label: "30 anos" },
];

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function FinancingSimulationPage() {
  const [propertyValue, setPropertyValue] = useState<number>(500000);
  const [downPayment, setDownPayment] = useState<number>(100000);
  const [userIncome, setUserIncome] = useState<number>(10000);
  const [termMonths, setTermMonths] = useState<number>(360);
  const [amortizationType, setAmortizationType] = useState<"SAC" | "PRICE">("SAC");

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const financeAmount = Math.max(0, (propertyValue || 0) - (downPayment || 0));
  const downPct = propertyValue > 0 ? Math.round(((downPayment || 0) / propertyValue) * 100) : 0;

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyValue || !downPayment || !userIncome || !termMonths) return;
    if (downPayment >= propertyValue) {
      setError("O valor de entrada deve ser menor que o valor do imóvel.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("bai_token");
      const res = await fetch(`${API}/api/v1/financing/simulate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          property_value: propertyValue,
          down_payment: downPayment,
          term_months: termMonths,
          user_income: userIncome,
          amortization_type: amortizationType,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? "Erro ao calcular o financiamento");
      }
      const data = await res.json();
      setResults(data.offers);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao calcular o financiamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-10">
        <Link
          href="/dashboard/buyer"
          className="text-blue-600 font-bold flex items-center gap-2 mb-6 hover:underline text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para o Painel
        </Link>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Simulação de Financiamento</h1>
        <p className="text-slate-500 font-medium">
          Calcule as condições de financiamento nos principais bancos.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* ── Form ── */}
        <div className="lg:col-span-4">
          <form
            onSubmit={handleSimulate}
            className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-6 sticky top-6"
          >
            <h2 className="text-lg font-black text-slate-800">Dados da Simulação</h2>

            {/* Property value */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Valor do Imóvel
              </label>
              <CurrencyInput
                value={propertyValue}
                onChange={(v) => setPropertyValue(v ?? 0)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            {/* Down payment */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Valor de Entrada
              </label>
              <CurrencyInput
                value={downPayment}
                onChange={(v) => setDownPayment(v ?? 0)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              {propertyValue > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${Math.min(downPct, 100)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 shrink-0">
                    {downPct}% de entrada · Financia {fmt(financeAmount)}
                  </span>
                </div>
              )}
            </div>

            {/* Income */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Renda Mensal Bruta
              </label>
              <CurrencyInput
                value={userIncome}
                onChange={(v) => setUserIncome(v ?? 0)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                Capacidade máxima de parcela: {fmt((userIncome || 0) * 0.3)}/mês (30% da renda)
              </p>
            </div>

            {/* Term */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Prazo do Financiamento
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {TERM_OPTIONS.map((opt) => (
                  <button
                    key={opt.months}
                    type="button"
                    onClick={() => setTermMonths(opt.months)}
                    className={`flex flex-col items-center py-2.5 rounded-xl border text-center transition text-[10px] font-black uppercase ${
                      termMonths === opt.months
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-300"
                    }`}
                  >
                    {opt.months}
                    <span className="font-medium normal-case text-[9px] leading-none mt-0.5 opacity-80">meses</span>
                    <span className="font-bold text-[9px] opacity-70">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amortization type */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Sistema de Amortização
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["SAC", "PRICE"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAmortizationType(type)}
                    className={`flex flex-col items-center py-3 rounded-xl border transition ${
                      amortizationType === type
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-sm font-black">{type}</span>
                    <span className="text-[10px] font-medium mt-0.5 opacity-70">
                      {type === "SAC" ? "Parcelas decrescentes" : "Parcelas fixas"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Calculando...
                </>
              ) : (
                "Simular Financiamento"
              )}
            </button>
          </form>
        </div>

        {/* ── Results ── */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {!results ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 h-[480px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-slate-400 mb-2">Preencha os dados ao lado</h3>
              <p className="text-slate-400 font-medium text-sm">Clique em Simular para ver as condições dos bancos.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xl font-black text-slate-800">Resultados</h3>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-widest">
                  {results.length} bancos
                </span>
              </div>

              <div className="grid gap-4">
                {results.map((offer: any) => (
                  <div
                    key={offer.bank_name}
                    className={`relative p-6 rounded-3xl border-2 transition-all ${
                      offer.is_best_offer
                        ? "bg-white border-blue-500 shadow-lg ring-4 ring-blue-500/5"
                        : "bg-white border-slate-100 shadow-sm"
                    }`}
                  >
                    {offer.is_best_offer && (
                      <div className="absolute -top-3.5 left-6 bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black tracking-widest shadow-sm">
                        MELHOR OPÇÃO
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      <div className="flex-1">
                        <h4 className="text-lg font-black text-slate-900 mb-1">{offer.bank_name}</h4>
                        <div className="flex items-baseline gap-1.5 mb-4">
                          <span className="text-3xl font-black text-slate-900">{offer.interest_rate}%</span>
                          <span className="text-xs font-bold text-slate-400 uppercase">a.a.</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">1ª Parcela</p>
                            <p className="text-base font-black text-slate-900">{fmt(offer.first_installment)}</p>
                          </div>
                          {amortizationType === "SAC" && (
                            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Última Parcela</p>
                              <p className="text-base font-black text-slate-900">{fmt(offer.last_installment)}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 md:min-w-[200px]">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custo Total</p>
                          <p className="text-xl font-black text-slate-900">{fmt(offer.total_paid)}</p>
                          <p className="text-[11px] font-bold text-blue-600 mt-0.5">
                            {fmt(offer.total_interest)} em juros
                          </p>
                        </div>

                        {offer.max_financing_reached ? (
                          <div className="bg-amber-50 text-amber-700 p-3 rounded-xl border border-amber-100 text-[11px] font-bold leading-tight">
                            ⚠️ Parcela acima de 30% da renda. O banco pode exigir maior entrada.
                          </div>
                        ) : (
                          <button className="w-full bg-slate-900 hover:bg-black text-white px-4 py-3 rounded-xl text-xs font-black tracking-wide transition">
                            TENHO INTERESSE
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="bg-blue-600 p-8 rounded-3xl text-white relative overflow-hidden shadow-blue-500/20 shadow-xl mt-4">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-black mb-2">Precisa de ajuda para aprovar o crédito?</h3>
                    <p className="text-blue-100 font-medium text-sm">Nossos correspondentes aprovam sem burocracia. Fale com um especialista.</p>
                  </div>
                  <button className="shrink-0 bg-white text-blue-600 px-8 py-4 rounded-2xl font-black text-sm tracking-wide shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all">
                    CHAMAR NO WHATSAPP
                  </button>
                </div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
              </div>

              <p className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] text-slate-400 font-medium leading-relaxed italic">
                * Valores estimados. Taxas reais variam conforme perfil de crédito, idade e seguros obrigatórios (MIP/DFI). Não substitui análise oficial da instituição financeira.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
