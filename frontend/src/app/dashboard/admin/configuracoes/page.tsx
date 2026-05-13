"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

const GATEWAYS = [
  { value: "manual", label: "Manual (sem gateway)" },
  { value: "stripe", label: "Stripe" },
  { value: "pagarme", label: "Pagar.me" },
  { value: "mercadopago", label: "Mercado Pago" },
];

type GatewayConfig = {
  gateway_tipo: string;
  gateway_chave_publica: string | null;
  chave_privada_configurada: boolean;
  webhook_secret_configurado: boolean;
  gateway_ativo: boolean;
  gateway_ambiente: string;
  stripe_price_pro_mensal?: string;
  stripe_price_pro_anual?: string;
  stripe_price_premium_mensal?: string;
  stripe_price_premium_anual?: string;
  pagarme_plan_pro_mensal?: string;
  pagarme_plan_pro_anual?: string;
  pagarme_plan_premium_mensal?: string;
  pagarme_plan_premium_anual?: string;
  mercadopago_plan_pro_mensal?: string;
  mercadopago_plan_pro_anual?: string;
  mercadopago_plan_premium_mensal?: string;
  mercadopago_plan_premium_anual?: string;
};

type Config = {
  gateway: GatewayConfig;
  plataforma_nome: string | null;
  plataforma_email_suporte: string | null;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">{title}</h2>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm transition";
const selectCls = "w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm transition appearance-none";

export default function ConfiguracoesPage() {
  const { token } = useAuth();
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Gateway form state
  const [gatewayTipo, setGatewayTipo] = useState("manual");
  const [chavePublica, setChavePublica] = useState("");
  const [chavePrivada, setChavePrivada] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [gatewayAtivo, setGatewayAtivo] = useState(false);
  const [ambiente, setAmbiente] = useState("sandbox");
  const [priceIds, setPriceIds] = useState<Record<string, string>>({});

  // Platform form state
  const [plataformaNome, setPlataformaNome] = useState("");
  const [plataformaEmail, setPlataformaEmail] = useState("");

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/v1/admin/configuracoes`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data: Config) => {
        setConfig(data);
        setGatewayTipo(data.gateway.gateway_tipo ?? "manual");
        setChavePublica(data.gateway.gateway_chave_publica ?? "");
        setGatewayAtivo(data.gateway.gateway_ativo ?? false);
        setAmbiente(data.gateway.gateway_ambiente ?? "sandbox");
        // Load saved price/plan IDs
        const ids: Record<string, string> = {};
        const keys = [
          "stripe_price_pro_mensal","stripe_price_pro_anual","stripe_price_premium_mensal","stripe_price_premium_anual",
          "pagarme_plan_pro_mensal","pagarme_plan_pro_anual","pagarme_plan_premium_mensal","pagarme_plan_premium_anual",
          "mercadopago_plan_pro_mensal","mercadopago_plan_pro_anual","mercadopago_plan_premium_mensal","mercadopago_plan_premium_anual",
        ];
        keys.forEach(k => { if ((data.gateway as any)[k]) ids[k] = (data.gateway as any)[k]; });
        setPriceIds(ids);
        setPlataformaNome(data.plataforma_nome ?? "");
        setPlataformaEmail(data.plataforma_email_suporte ?? "");
      })
      .catch(() => setError("Erro ao carregar configurações."))
      .finally(() => setLoading(false));
  }, [token]);

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const handleSaveGateway = async () => {
    setSaving(true);
    setError("");
    try {
      const body: any = {
        gateway_tipo: gatewayTipo,
        gateway_chave_publica: chavePublica || null,
        gateway_ativo: gatewayAtivo,
        gateway_ambiente: ambiente,
        ...priceIds,
      };
      if (chavePrivada) body.gateway_chave_privada = chavePrivada;
      if (webhookSecret) body.gateway_webhook_secret = webhookSecret;

      const res = await fetch(`${API}/api/v1/admin/configuracoes/gateway`, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Erro ao salvar gateway");
      const updated: Config = await res.json();
      setConfig(updated);
      setChavePrivada("");
      setWebhookSecret("");
      flash("Gateway salvo com sucesso!");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePlataforma = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/v1/admin/configuracoes/plataforma`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ plataforma_nome: plataformaNome || null, plataforma_email_suporte: plataformaEmail || null }),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Erro ao salvar plataforma");
      flash("Dados da plataforma salvos!");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestarGateway = async () => {
    if (!config?.gateway?.gateway_tipo || config.gateway.gateway_tipo === "manual") {
      setError("Selecione um gateway de pagamento antes de testar.");
      return;
    }
    if (!config.gateway.gateway_chave_publica) {
      setError("Configure a chave pública do gateway antes de testar.");
      return;
    }
    setTesting(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/v1/admin/configuracoes/gateway/testar`, {
        method: "POST",
        headers,
      });
      const data = await res.json();
      if (data.sucesso) flash(`Teste OK: ${data.mensagem}`);
      else setError(`Falha no teste: ${data.mensagem}`);
    } catch {
      setError("Erro ao testar gateway.");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Configurações do Sistema</h1>
        <p className="text-slate-500 font-medium">Gateway de pagamento e dados da plataforma.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-100 rounded-2xl px-5 py-4 font-bold text-sm">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl px-5 py-4 font-bold text-sm">
          {successMsg}
        </div>
      )}

      {/* Gateway */}
      <Section title="Gateway de Pagamento">
        <Field label="Gateway">
          <select className={selectCls} value={gatewayTipo} onChange={(e) => setGatewayTipo(e.target.value)}>
            {GATEWAYS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Ambiente">
          <select className={selectCls} value={ambiente} onChange={(e) => setAmbiente(e.target.value)}>
            <option value="sandbox">Sandbox (testes)</option>
            <option value="producao">Produção</option>
          </select>
        </Field>

        {gatewayTipo !== "manual" && (
          <>
            <Field label="Chave Pública" hint="Ex: pk_live_... ou pk_test_...">
              <input
                className={inputCls}
                placeholder="pk_..."
                value={chavePublica}
                onChange={(e) => setChavePublica(e.target.value)}
              />
            </Field>

            <Field
              label="Chave Privada / Secreta"
              hint={
                config?.gateway.chave_privada_configurada
                  ? "Chave já configurada. Deixe em branco para manter a atual."
                  : "Ex: sk_live_... — nunca é retornada pela API."
              }
            >
              <input
                className={inputCls}
                type="password"
                placeholder={config?.gateway.chave_privada_configurada ? "••••••••• (manter atual)" : "sk_..."}
                value={chavePrivada}
                onChange={(e) => setChavePrivada(e.target.value)}
                autoComplete="new-password"
              />
            </Field>

            <Field
              label="Webhook Secret"
              hint={
                config?.gateway.webhook_secret_configurado
                  ? "Webhook já configurado. Deixe em branco para manter."
                  : "Chave de validação de eventos do gateway."
              }
            >
              <input
                className={inputCls}
                type="password"
                placeholder={config?.gateway.webhook_secret_configurado ? "••••••••• (manter atual)" : "whsec_..."}
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                autoComplete="new-password"
              />
            </Field>

            {/* Price / Plan IDs */}
            <div className="pt-2">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                {gatewayTipo === "stripe" ? "Price IDs (dashboard Stripe)" : gatewayTipo === "pagarme" ? "Plan IDs (dashboard Pagar.me)" : "Preapproval Plan IDs (Mercado Pago)"}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Pro · Mensal", key: `${gatewayTipo === "stripe" ? "stripe_price" : gatewayTipo === "pagarme" ? "pagarme_plan" : "mercadopago_plan"}_pro_mensal` },
                  { label: "Pro · Anual",  key: `${gatewayTipo === "stripe" ? "stripe_price" : gatewayTipo === "pagarme" ? "pagarme_plan" : "mercadopago_plan"}_pro_anual` },
                  { label: "Premium · Mensal", key: `${gatewayTipo === "stripe" ? "stripe_price" : gatewayTipo === "pagarme" ? "pagarme_plan" : "mercadopago_plan"}_premium_mensal` },
                  { label: "Premium · Anual",  key: `${gatewayTipo === "stripe" ? "stripe_price" : gatewayTipo === "pagarme" ? "pagarme_plan" : "mercadopago_plan"}_premium_anual` },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</label>
                    <input
                      className={inputCls}
                      placeholder={gatewayTipo === "stripe" ? "price_..." : gatewayTipo === "pagarme" ? "plan_..." : "preapproval_plan_..."}
                      value={priceIds[key] ?? ""}
                      onChange={(e) => setPriceIds(p => ({ ...p, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            role="switch"
            aria-checked={gatewayAtivo}
            onClick={() => setGatewayAtivo(!gatewayAtivo)}
            className={`relative w-11 h-6 rounded-full transition-colors ${gatewayAtivo ? "bg-emerald-500" : "bg-slate-200"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${gatewayAtivo ? "translate-x-5" : ""}`}
            />
          </button>
          <span className="text-sm font-semibold text-slate-700">
            Gateway {gatewayAtivo ? "ativo" : "inativo"}
          </span>
        </div>

        {/* Status badges */}
        {config && gatewayTipo !== "manual" && (
          <div className="flex flex-wrap gap-2 pt-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${config.gateway.chave_privada_configurada ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
              {config.gateway.chave_privada_configurada ? "✓ Chave privada configurada" : "✗ Chave privada ausente"}
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${config.gateway.webhook_secret_configurado ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
              {config.gateway.webhook_secret_configurado ? "✓ Webhook configurado" : "✗ Webhook ausente"}
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleSaveGateway}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar Gateway"}
          </button>
          {gatewayTipo !== "manual" && (
            <button
              onClick={handleTestarGateway}
              disabled={testing}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-200 transition disabled:opacity-50"
            >
              {testing ? "Testando..." : "Testar Conexão"}
            </button>
          )}
        </div>

        {gatewayTipo !== "manual" && (
          <div className="mt-2 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-700 font-medium space-y-1">
            <p className="font-black">Próximos passos para integração completa:</p>
            <ol className="list-decimal list-inside space-y-1 text-amber-600">
              <li>Instale o SDK do gateway no backend (<code>pip install stripe</code> / <code>pip install pagarme</code>)</li>
              <li>Implemente o webhook handler em <code>POST /api/v1/webhooks/{gatewayTipo}</code></li>
              <li>Configure a URL do webhook no painel do gateway apontando para sua API</li>
              <li>Implemente <code>POST /api/v1/cobranca/checkout</code> chamando a API do gateway com as chaves salvas</li>
            </ol>
          </div>
        )}
      </Section>

      {/* Platform */}
      <Section title="Dados da Plataforma">
        <Field label="Nome da Plataforma">
          <input
            className={inputCls}
            placeholder="Ex: BAI Imóveis"
            value={plataformaNome}
            onChange={(e) => setPlataformaNome(e.target.value)}
          />
        </Field>
        <Field label="E-mail de Suporte">
          <input
            className={inputCls}
            type="email"
            placeholder="suporte@exemplo.com"
            value={plataformaEmail}
            onChange={(e) => setPlataformaEmail(e.target.value)}
          />
        </Field>
        <button
          onClick={handleSavePlataforma}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar Plataforma"}
        </button>
      </Section>
    </div>
  );
}
