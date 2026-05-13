"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch, apiUrl } from "../../../lib/api";

interface RedesSociais {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  site?: string;
  whatsapp?: string;
}

interface LandingConfig {
  slug: string | null;
  bio: string | null;
  foto_perfil_url: string | null;
  cor_primaria: string | null;
  cor_secundaria: string | null;
  redes_sociais: RedesSociais | null;
  landing_ativa: boolean;
  tipo_plano: string | null;
  landing_url: string | null;
}

const PLANOS_COM_LANDING = ["pro", "premium"];

function PlanGate() {
  return (
    <div className="max-w-xl mx-auto text-center py-20 px-6">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      </div>
      <h2 className="text-xl font-black text-slate-900 mb-2">Recurso exclusivo</h2>
      <p className="text-slate-500 text-sm leading-relaxed mb-6">
        A landing page personalizada está disponível nos planos <strong>Pro</strong> e <strong>Premium</strong>. Atualize seu plano para criar seu ambiente de divulgação exclusivo.
      </p>
      <a
        href="/dashboard/agency"
        className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition"
      >
        Ver planos disponíveis
      </a>
    </div>
  );
}

function SlugField({
  slug,
  onChange,
  token,
  userId,
}: {
  slug: string;
  onChange: (v: string) => void;
  token: string | null;
  userId: number | undefined;
}) {
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  const check = useCallback(async (val: string) => {
    if (val.length < 3) return;
    setStatus("checking");
    try {
      const res = await apiFetch<{ disponivel: boolean; motivo: string | null }>(
        `/api/v1/landing/slug-check?slug=${encodeURIComponent(val)}`,
        { token }
      );
      setStatus(res.disponivel ? "ok" : "error");
      setMsg(res.motivo ?? null);
    } catch {
      setStatus("idle");
    }
  }, [token]);

  useEffect(() => {
    const t = setTimeout(() => { if (slug) check(slug); }, 600);
    return () => clearTimeout(t);
  }, [slug, check]);

  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        Slug (URL da sua landing page)
      </label>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400 font-medium shrink-0">bai.com.br/corretor/</span>
        <div className="relative flex-1">
          <input
            type="text"
            value={slug}
            onChange={(e) => { onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); setStatus("idle"); }}
            placeholder="seu-nome-ou-marca"
            className={`w-full border rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 transition ${
              status === "ok"
                ? "border-emerald-300 focus:ring-emerald-200"
                : status === "error"
                ? "border-red-300 focus:ring-red-200"
                : "border-slate-200 focus:ring-blue-200"
            }`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {status === "checking" && <span className="text-xs text-slate-400">...</span>}
            {status === "ok" && <span className="text-xs text-emerald-600 font-bold">✓ disponível</span>}
            {status === "error" && <span className="text-xs text-red-500 font-bold">✗</span>}
          </div>
        </div>
      </div>
      {status === "error" && msg && (
        <p className="mt-1 text-xs text-red-500">{msg}</p>
      )}
      <p className="mt-1 text-xs text-slate-400">Use apenas letras minúsculas, números e hífens. Mínimo 3 caracteres.</p>
    </div>
  );
}

export default function LandingConfigPage() {
  const { user, token } = useAuth();
  const [config, setConfig] = useState<LandingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState("");
  const [corPrimaria, setCorPrimaria] = useState("#1d4ed8");
  const [corSecundaria, setCorSecundaria] = useState("#1e293b");
  const [redes, setRedes] = useState<RedesSociais>({});
  const [ativa, setAtiva] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<LandingConfig>("/api/v1/landing/me", { token });
        setConfig(data);
        setSlug(data.slug ?? "");
        setBio(data.bio ?? "");
        setFotoPerfil(data.foto_perfil_url ?? "");
        setCorPrimaria(data.cor_primaria ?? "#1d4ed8");
        setCorSecundaria(data.cor_secundaria ?? "#1e293b");
        setRedes(data.redes_sociais ?? {});
        setAtiva(data.landing_ativa ?? false);
      } catch {
        setError("Erro ao carregar configurações.");
      } finally {
        setLoading(false);
      }
    }
    if (token) load();
  }, [token]);

  async function handleSuggest() {
    try {
      const res = await apiFetch<{ sugestao: string }>("/api/v1/landing/me/slug-sugestao", { token });
      setSlug(res.sugestao);
    } catch {}
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/v1/landing/me", {
        method: "PUT",
        token,
        body: JSON.stringify({
          slug: slug || null,
          bio: bio || null,
          foto_perfil_url: fotoPerfil || null,
          cor_primaria: corPrimaria,
          cor_secundaria: corSecundaria,
          redes_sociais: Object.keys(redes).length > 0 ? redes : null,
          landing_ativa: ativa,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!config || !PLANOS_COM_LANDING.includes(config.tipo_plano ?? "")) {
    return <PlanGate />;
  }

  const previewUrl = slug ? `/corretor/${slug}` : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Minha Landing Page</h1>
          <p className="text-sm text-slate-500 mt-1">Configure seu ambiente de divulgação personalizado.</p>
        </div>
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold border border-slate-200 text-slate-600 px-3 py-2 rounded-xl hover:bg-slate-50 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ver landing page
          </a>
        )}
      </div>

      {/* Cartão de status */}
      <div className={`flex items-center justify-between p-4 rounded-2xl mb-6 border ${ativa ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"}`}>
        <div>
          <p className={`text-sm font-bold ${ativa ? "text-emerald-700" : "text-slate-600"}`}>
            {ativa ? "Landing page ativa" : "Landing page inativa"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {ativa ? "Seu perfil público está visível para clientes." : "Ative para que clientes possam encontrar você."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAtiva(!ativa)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${ativa ? "bg-emerald-500" : "bg-slate-300"}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${ativa ? "translate-x-5" : "translate-x-0"}`}
          />
        </button>
      </div>

      <div className="space-y-6">
        {/* Seção: URL */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-sm font-black text-slate-900 mb-4">Endereço público</h2>
          <div className="space-y-3">
            <SlugField slug={slug} onChange={setSlug} token={token} userId={user?.id} />
            <button
              type="button"
              onClick={handleSuggest}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Sugerir slug baseado no meu nome
            </button>
          </div>
        </div>

        {/* Seção: Perfil */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-sm font-black text-slate-900 mb-4">Perfil público</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Foto / Logo (URL)
              </label>
              <input
                type="url"
                value={fotoPerfil}
                onChange={(e) => setFotoPerfil(e.target.value)}
                placeholder="https://exemplo.com/sua-foto.jpg"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              {fotoPerfil && (
                <img
                  src={fotoPerfil}
                  alt="Preview"
                  className="mt-2 w-16 h-16 rounded-xl object-cover border border-slate-200"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Bio / Apresentação
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Conte um pouco sobre você e seus serviços..."
                rows={4}
                maxLength={1000}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
              />
              <p className="text-xs text-slate-400 text-right mt-0.5">{bio.length}/1000</p>
            </div>
          </div>
        </div>

        {/* Seção: Identidade visual */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-sm font-black text-slate-900 mb-4">Identidade visual</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Cor principal
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={corPrimaria}
                  onChange={(e) => setCorPrimaria(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                />
                <span className="text-sm font-mono text-slate-600">{corPrimaria}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Cor do fundo/header
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={corSecundaria}
                  onChange={(e) => setCorSecundaria(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                />
                <span className="text-sm font-mono text-slate-600">{corSecundaria}</span>
              </div>
            </div>
          </div>

          {/* Preview das cores */}
          <div className="mt-4 rounded-xl overflow-hidden border border-slate-100">
            <div className="px-4 py-3 text-white text-xs font-bold" style={{ backgroundColor: corSecundaria }}>
              Preview do cabeçalho
            </div>
            <div className="px-4 py-3 bg-white flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: corPrimaria }}>
                Botão principal
              </span>
              <span className="text-xs font-bold" style={{ color: corPrimaria }}>Preço do imóvel</span>
            </div>
          </div>
        </div>

        {/* Seção: Redes sociais */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-sm font-black text-slate-900 mb-4">Redes sociais e contato</h2>
          <div className="space-y-3">
            {[
              { key: "whatsapp", label: "WhatsApp (número)", placeholder: "11999999999" },
              { key: "instagram", label: "Instagram (@ ou URL)", placeholder: "@seuperfil" },
              { key: "facebook", label: "Facebook (URL)", placeholder: "https://facebook.com/..." },
              { key: "linkedin", label: "LinkedIn (URL)", placeholder: "https://linkedin.com/in/..." },
              { key: "site", label: "Site próprio (URL)", placeholder: "https://seusite.com.br" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {label}
                </label>
                <input
                  type="text"
                  value={(redes as Record<string, string>)[key] ?? ""}
                  onChange={(e) =>
                    setRedes((prev) => ({
                      ...prev,
                      [key]: e.target.value || undefined,
                    }))
                  }
                  placeholder={placeholder}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Ações */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          {saved && (
            <span className="text-sm text-emerald-600 font-bold flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Salvo com sucesso!
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="ml-auto flex items-center gap-2 bg-blue-600 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar configurações"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
