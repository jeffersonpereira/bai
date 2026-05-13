"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type GatewayInfo = { tipo: string; chave_publica: string | null; ativo: boolean };
type PlanoInfo   = { chave: string; nome: string; preco_mensal: number; preco_anual: number };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ---------------------------------------------------------------------------
// Stripe Card Form
// ---------------------------------------------------------------------------
function StripeCardForm({
  publishableKey,
  onToken,
  disabled,
}: {
  publishableKey: string;
  onToken: (token: string) => void;
  disabled: boolean;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<any>(null);
  const cardRef  = useRef<any>(null);
  const [cardError, setCardError] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    let mounted = true;
    loadScript("https://js.stripe.com/v3/").then(() => {
      if (!mounted || !mountRef.current) return;
      const stripe = (window as any).Stripe(publishableKey);
      stripeRef.current = stripe;
      const elements = stripe.elements();
      const card = elements.create("card", {
        style: {
          base: { fontSize: "15px", color: "#1e293b", "::placeholder": { color: "#94a3b8" } },
          invalid: { color: "#ef4444" },
        },
        hidePostalCode: true,
      });
      card.mount(mountRef.current);
      card.on("change", (e: any) => setCardError(e.error?.message ?? ""));
      cardRef.current = card;
    });
    return () => { mounted = false; cardRef.current?.destroy(); };
  }, [publishableKey]);

  const handleSubmit = async () => {
    if (!stripeRef.current || !cardRef.current) return;
    const { paymentMethod, error } = await stripeRef.current.createPaymentMethod({
      type: "card",
      card: cardRef.current,
      billing_details: { name },
    });
    if (error) { setCardError(error.message); return; }
    onToken(paymentMethod.id);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
          Nome no Cartão
        </label>
        <input
          className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm transition"
          placeholder="Como está impresso no cartão"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={disabled}
        />
      </div>
      <div>
        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
          Dados do Cartão
        </label>
        <div
          ref={mountRef}
          className="px-4 py-3.5 rounded-2xl bg-slate-50 border border-transparent focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 transition"
        />
        {cardError && <p className="mt-1 text-xs text-red-500 font-medium">{cardError}</p>}
      </div>
      <p className="text-xs text-slate-400 flex items-center gap-1">
        🔒 Seus dados são criptografados pelo Stripe e nunca passam pelos nossos servidores.
      </p>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || !name}
        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {disabled ? "Processando..." : "Confirmar Assinatura"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pagar.me Card Form
// ---------------------------------------------------------------------------
function PagarmeCardForm({
  publishableKey,
  onToken,
  disabled,
}: {
  publishableKey: string;
  onToken: (token: string) => void;
  disabled: boolean;
}) {
  const [form, setForm] = useState({ name: "", number: "", expiry: "", cvv: "" });
  const [err, setErr] = useState("");

  const handleSubmit = async () => {
    setErr("");
    try {
      await loadScript("https://assets.pagar.me/pagarme-js/4/pagarme.min.js");
      const pagarme = (window as any).pagarme;
      const client = await pagarme.client.connect({ encryption_key: publishableKey });
      const hash = await client.security.encrypt({
        card_number: form.number.replace(/\s/g, ""),
        card_holder_name: form.name,
        card_expiration_date: form.expiry.replace("/", ""),
        card_cvv: form.cvv,
      });
      onToken(hash);
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao processar cartão.");
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm transition";

  return (
    <div className="space-y-4">
      {[
        { label: "Nome no Cartão", key: "name", placeholder: "Como impresso no cartão", type: "text" },
        { label: "Número do Cartão", key: "number", placeholder: "0000 0000 0000 0000", type: "tel" },
      ].map(({ label, key, placeholder, type }) => (
        <div key={key}>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
          <input className={inputCls} placeholder={placeholder} type={type} value={(form as any)[key]}
            onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))} disabled={disabled} />
        </div>
      ))}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Validade</label>
          <input className={inputCls} placeholder="MM/AA" value={form.expiry}
            onChange={(e) => setForm(f => ({ ...f, expiry: e.target.value }))} disabled={disabled} />
        </div>
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">CVV</label>
          <input className={inputCls} placeholder="123" type="tel" maxLength={4} value={form.cvv}
            onChange={(e) => setForm(f => ({ ...f, cvv: e.target.value }))} disabled={disabled} />
        </div>
      </div>
      {err && <p className="text-xs text-red-500 font-medium">{err}</p>}
      <p className="text-xs text-slate-400">🔒 Seus dados são criptografados pelo Pagar.me.</p>
      <button type="button" onClick={handleSubmit} disabled={disabled}
        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50">
        {disabled ? "Processando..." : "Confirmar Assinatura"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mercado Pago Card Form
// ---------------------------------------------------------------------------
function MercadoPagoCardForm({
  publishableKey,
  onToken,
  disabled,
}: {
  publishableKey: string;
  onToken: (token: string) => void;
  disabled: boolean;
}) {
  const [form, setForm] = useState({ name: "", number: "", expiryMonth: "", expiryYear: "", cvv: "" });
  const [err, setErr] = useState("");

  const handleSubmit = async () => {
    setErr("");
    try {
      await loadScript("https://sdk.mercadopago.com/js/v2");
      const mp = new (window as any).MercadoPago(publishableKey, { locale: "pt-BR" });
      const token = await mp.createCardToken({
        cardNumber: form.number.replace(/\s/g, ""),
        cardholderName: form.name,
        cardExpirationMonth: form.expiryMonth,
        cardExpirationYear: form.expiryYear,
        securityCode: form.cvv,
      });
      onToken(token.id);
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao processar cartão.");
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm transition";

  return (
    <div className="space-y-4">
      {[
        { label: "Nome no Cartão", key: "name", placeholder: "Como impresso no cartão" },
        { label: "Número do Cartão", key: "number", placeholder: "0000 0000 0000 0000" },
      ].map(({ label, key, placeholder }) => (
        <div key={key}>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
          <input className={inputCls} placeholder={placeholder} value={(form as any)[key]}
            onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))} disabled={disabled} />
        </div>
      ))}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Mês", key: "expiryMonth", placeholder: "MM" },
          { label: "Ano", key: "expiryYear", placeholder: "AA" },
          { label: "CVV", key: "cvv", placeholder: "123" },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
            <input className={inputCls} placeholder={placeholder} value={(form as any)[key]}
              onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))} disabled={disabled} />
          </div>
        ))}
      </div>
      {err && <p className="text-xs text-red-500 font-medium">{err}</p>}
      <p className="text-xs text-slate-400">🔒 Seus dados são criptografados pelo Mercado Pago.</p>
      <button type="button" onClick={handleSubmit} disabled={disabled}
        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50">
        {disabled ? "Processando..." : "Confirmar Assinatura"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Manual Gateway Notice
// ---------------------------------------------------------------------------
function ManualNotice() {
  return (
    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-amber-800">
      <p className="font-black text-sm mb-2">Pagamento Manual</p>
      <p className="text-sm">
        Entre em contato com nossa equipe para realizar o upgrade do seu plano via PIX, boleto ou transferência.
      </p>
      <a href="mailto:suporte@bai.com.br" className="mt-3 inline-block text-sm font-bold text-blue-600 hover:underline">
        suporte@bai.com.br →
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function UpgradePage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const [planos, setPlanos] = useState<PlanoInfo[]>([]);
  const [gateway, setGateway] = useState<GatewayInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  // Selection state
  const [selectedPlano, setSelectedPlano] = useState(params.get("plano") ?? "pro");
  const [selectedCiclo, setSelectedCiclo] = useState<"mensal" | "anual">("mensal");

  // Success state
  const [sucesso, setSucesso] = useState(false);

  // 3DS state (Stripe)
  const [clientSecret, setClientSecret] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [awaiting3DS, setAwaiting3DS] = useState(false);

  // Coupon state
  const [cupomCodigo, setCupomCodigo] = useState("");
  const [cupomInfo, setCupomInfo] = useState<{ valido: boolean; tipo_desconto?: string; valor_desconto?: number; mensagem: string } | null>(null);
  const [validatingCupom, setValidatingCupom] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch(`${API}/api/v1/cobranca/planos`).then((r) => r.json()),
      fetch(`${API}/api/v1/cobranca/gateway-info`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([pl, gw]) => {
        setPlanos(pl.filter((p: PlanoInfo) => p.chave !== "gratuito"));
        setGateway(gw);
      })
      .catch(() => setError("Erro ao carregar dados. Tente novamente."))
      .finally(() => setLoading(false));
  }, [token]);

  const planoSelecionado = planos.find((p) => p.chave === selectedPlano);
  const valorMensal = selectedCiclo === "anual"
    ? planoSelecionado?.preco_anual ?? 0
    : planoSelecionado?.preco_mensal ?? 0;
  const totalAnual = selectedCiclo === "anual" ? valorMensal * 12 : null;
  const economia = planoSelecionado
    ? ((planoSelecionado.preco_mensal - planoSelecionado.preco_anual) * 12)
    : 0;

  const validarCupom = async () => {
    if (!cupomCodigo.trim()) return;
    setValidatingCupom(true);
    try {
      const res = await fetch(`${API}/api/v1/cupons/validar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: cupomCodigo.trim() }),
      });
      const data = await res.json();
      setCupomInfo(data);
    } catch { setCupomInfo({ valido: false, mensagem: "Erro ao validar cupom." }); }
    finally { setValidatingCupom(false); }
  };

  const handleToken = async (paymentToken: string) => {
    if (!token) return;
    setProcessing(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/v1/cobranca/checkout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          plano: selectedPlano,
          ciclo: selectedCiclo,
          payment_token: paymentToken,
          nome_titular: "",
        }),
      });
      const data = await res.json();
      if (!res.ok) { const d = data.detail; setError(Array.isArray(d) ? d.map((e: any) => e.msg ?? String(e)).join("; ") : (d ?? "Erro ao processar pagamento.")); return; }

      if (data.requer_confirmacao && data.client_secret) {
        setClientSecret(data.client_secret);
        setSubscriptionId(data.subscription_id ?? "");
        setAwaiting3DS(true);
        await handle3DS(data.client_secret, data.subscription_id ?? "");
        return;
      }

      if (data.sucesso) { setSucesso(true); return; }
      setError(data.mensagem ?? "Pagamento não aprovado.");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  };

  const handle3DS = async (secret: string, subId: string) => {
    if (gateway?.tipo !== "stripe" || !gateway.chave_publica) return;
    try {
      await loadScript("https://js.stripe.com/v3/");
      const stripe = (window as any).Stripe(gateway.chave_publica);
      const { error } = await stripe.confirmCardPayment(secret);
      if (error) { setError(error.message); setAwaiting3DS(false); return; }

      // Confirm with backend
      const res = await fetch(`${API}/api/v1/cobranca/checkout/confirmar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_id: subId }),
      });
      const data = await res.json();
      if (data.sucesso) setSucesso(true);
      else setError(data.mensagem ?? "Confirmação falhou.");
    } catch (e: any) {
      setError(e?.message ?? "Erro na autenticação 3DS.");
    } finally {
      setAwaiting3DS(false);
    }
  };

  // ---- Success screen ----
  if (sucesso) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✓</div>
        <h1 className="text-3xl font-black text-slate-900 mb-3">Bem-vindo ao plano {planoSelecionado?.nome}!</h1>
        <p className="text-slate-500 mb-8">Sua assinatura foi ativada com sucesso. Aproveite todos os recursos.</p>
        <Link href="/dashboard/cobranca"
          className="inline-block px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
          Ver meu plano
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link href="/dashboard/cobranca" className="text-sm text-slate-400 hover:text-slate-600 font-semibold transition">
          ← Voltar
        </Link>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-3 mb-1">Fazer Upgrade</h1>
        <p className="text-slate-500 font-medium">Escolha o plano e preencha os dados de pagamento.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: plan + cycle selection */}
        <div className="space-y-6">
          {/* Plan selector */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Selecione o Plano</h2>
            <div className="space-y-3">
              {planos.map((p) => (
                <button key={p.chave} type="button" onClick={() => setSelectedPlano(p.chave)}
                  className={`w-full text-left px-4 py-4 rounded-2xl border-2 transition ${selectedPlano === p.chave ? "border-blue-500 bg-blue-50" : "border-slate-100 hover:border-slate-200"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-black text-slate-900">{p.nome}</span>
                      {p.chave === "premium" && (
                        <span className="ml-2 text-[10px] font-black uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Popular</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-900">
                        {fmtBRL(selectedCiclo === "anual" ? p.preco_anual : p.preco_mensal)}
                        <span className="text-xs font-medium text-slate-400">/mês</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cycle selector */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Ciclo de Cobrança</h2>
            <div className="grid grid-cols-2 gap-3">
              {(["mensal", "anual"] as const).map((ciclo) => (
                <button key={ciclo} type="button" onClick={() => setSelectedCiclo(ciclo)}
                  className={`px-4 py-4 rounded-2xl border-2 transition ${selectedCiclo === ciclo ? "border-blue-500 bg-blue-50" : "border-slate-100 hover:border-slate-200"}`}>
                  <div className="font-black text-slate-900 capitalize">{ciclo}</div>
                  {ciclo === "anual" && economia > 0 && (
                    <div className="text-xs text-emerald-600 font-bold mt-0.5">Economize {fmtBRL(economia)}/ano</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-slate-50 rounded-3xl border border-slate-100 p-6">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Resumo do Pedido</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between font-medium text-slate-700">
                <span>Plano {planoSelecionado?.nome}</span>
                <span>{fmtBRL(valorMensal)}/mês</span>
              </div>
              <div className="flex justify-between font-medium text-slate-700">
                <span>Ciclo</span>
                <span className="capitalize">{selectedCiclo}</span>
              </div>
              {totalAnual && (
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Total anual</span>
                  <span>{fmtBRL(totalAnual)}</span>
                </div>
              )}
            </div>
            <div className="border-t border-slate-200 mt-4 pt-4 flex justify-between font-black text-slate-900">
              <span>Cobrado hoje</span>
              <span>{fmtBRL(totalAnual ?? valorMensal)}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Renovação automática. Cancele quando quiser sem multa.
            </p>
          </div>
        </div>

        {/* Right: payment form */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">Dados de Pagamento</h2>

          {error && (
            <div className="mb-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl px-4 py-3 text-sm font-bold">
              {error}
            </div>
          )}

          {awaiting3DS && (
            <div className="mb-4 bg-amber-50 text-amber-700 border border-amber-100 rounded-2xl px-4 py-3 text-sm font-bold flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
              Aguardando autenticação 3DS no seu banco...
            </div>
          )}

          {/* Coupon field */}
          <div className="mb-6 pb-6 border-b border-slate-100">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Cupom de Desconto</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cupomCodigo}
                onChange={e => { setCupomCodigo(e.target.value.toUpperCase()); setCupomInfo(null); }}
                placeholder="Ex: PROMO20"
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 uppercase"
              />
              <button
                type="button"
                onClick={validarCupom}
                disabled={!cupomCodigo.trim() || validatingCupom}
                className="px-4 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 disabled:opacity-40 transition"
              >
                {validatingCupom ? "..." : "Aplicar"}
              </button>
            </div>
            {cupomInfo && (
              <p className={`mt-2 text-xs font-semibold ${cupomInfo.valido ? "text-emerald-600" : "text-red-500"}`}>
                {cupomInfo.valido ? "✓" : "✗"} {cupomInfo.mensagem}
              </p>
            )}
          </div>

          {!gateway?.ativo && gateway?.tipo !== "manual" ? (
            <div className="text-center py-8 text-slate-400">
              <p className="text-2xl mb-3">⚙️</p>
              <p className="font-bold text-slate-600">Gateway de pagamento não configurado.</p>
              <p className="text-sm mt-1">O administrador precisa ativar o gateway nas configurações do sistema.</p>
            </div>
          ) : gateway?.tipo === "stripe" && gateway.chave_publica ? (
            <StripeCardForm
              publishableKey={gateway.chave_publica}
              onToken={handleToken}
              disabled={processing || awaiting3DS}
            />
          ) : gateway?.tipo === "pagarme" && gateway.chave_publica ? (
            <PagarmeCardForm
              publishableKey={gateway.chave_publica}
              onToken={handleToken}
              disabled={processing || awaiting3DS}
            />
          ) : gateway?.tipo === "mercadopago" && gateway.chave_publica ? (
            <MercadoPagoCardForm
              publishableKey={gateway.chave_publica}
              onToken={handleToken}
              disabled={processing || awaiting3DS}
            />
          ) : (
            <ManualNotice />
          )}

          <p className="text-xs text-slate-400 text-center mt-4">
            Ao confirmar, você concorda com os termos de uso e política de privacidade.
          </p>
        </div>
      </div>
    </div>
  );
}
