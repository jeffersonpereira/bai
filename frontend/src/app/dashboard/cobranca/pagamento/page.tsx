"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

export default function PagamentoPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [assinatura, setAssinatura] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/v1/cobranca/assinatura`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(setAssinatura)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const openPortal = async () => {
    setRedirecting(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/v1/cobranca/portal`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Erro ao acessar portal de pagamento.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setRedirecting(false);
    }
  };

  const planLabel: Record<string, string> = { gratuito: "Gratuito", pro: "Pro", premium: "Premium" };
  const currentPlan = user?.tipo_plano ?? "gratuito";
  const isFree = currentPlan === "gratuito";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-4">
          <Link href="/dashboard/cobranca" className="hover:text-blue-600 transition">Plano & Consumo</Link>
          <span>›</span>
          <span className="text-slate-600">Método de Pagamento</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Método de Pagamento</h1>
        <p className="text-slate-500 text-sm">Gerencie seu cartão e dados de cobrança.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 animate-pulse">
          <div className="h-5 w-48 bg-slate-100 rounded mb-4" />
          <div className="h-4 w-64 bg-slate-100 rounded" />
        </div>
      ) : isFree ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center shadow-sm">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Plano Gratuito</h2>
          <p className="text-slate-500 text-sm mb-6">Você está no plano gratuito. Nenhum cartão cadastrado.</p>
          <Link
            href="/dashboard/cobranca/upgrade"
            className="inline-block px-8 py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition text-sm shadow-lg shadow-blue-100"
          >
            Fazer Upgrade
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Plan info */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Plano Atual</p>
              <p className="text-2xl font-black text-slate-900">{planLabel[currentPlan] ?? currentPlan}</p>
            </div>
            <span className="px-4 py-1.5 bg-blue-50 text-blue-700 text-xs font-black rounded-full uppercase tracking-wider">
              {assinatura?.status === "ativo" ? "Ativo" : assinatura?.status ?? "Ativo"}
            </span>
          </div>

          {/* Subscription details */}
          {assinatura && (
            <div className="px-8 py-5 border-b border-slate-100 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-400 font-semibold mb-1">Gateway</p>
                <p className="font-bold text-slate-700 capitalize">{assinatura.gateway ?? "—"}</p>
              </div>
              {assinatura.plano_expira_em && (
                <div>
                  <p className="text-xs text-slate-400 font-semibold mb-1">Próxima cobrança</p>
                  <p className="font-bold text-slate-700">
                    {new Date(assinatura.plano_expira_em).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Portal CTA */}
          <div className="px-8 py-6">
            <p className="text-sm text-slate-500 mb-5">
              Para alterar seu cartão de crédito, cancelar ou atualizar dados de cobrança, acesse o portal seguro do nosso processador de pagamentos.
            </p>
            <button
              onClick={openPortal}
              disabled={redirecting}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm shadow-lg shadow-blue-100"
            >
              {redirecting ? "Abrindo portal..." : "Gerenciar Pagamento →"}
            </button>
            <p className="mt-3 text-xs text-slate-400">Você será redirecionado ao ambiente seguro do Stripe.</p>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Link href="/dashboard/cobranca" className="text-sm text-slate-400 hover:text-slate-600 transition font-medium">
          ← Voltar para Plano & Consumo
        </Link>
      </div>
    </div>
  );
}
