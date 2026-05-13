"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

interface AuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
  context: "visit" | "proposal";
}

export default function AuthGateModal({
  isOpen,
  onClose,
  onAuthSuccess,
  context,
}: AuthGateModalProps) {
  const { login } = useAuth();
  const overlayRef = useRef<HTMLDivElement>(null);

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [nome, setNome]                 = useState("");
  const [perfil, setPerfil]             = useState<"comprador" | "corretor">("comprador");
  const [error, setError]               = useState("");
  const [submitting, setSubmitting]     = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    setError("");
    setEmail("");
    setPassword("");
    setNome("");
    setPerfil("comprador");
    setShowPassword(false);
  }, [isOpen, isLoginTab]);

  if (!isOpen) return null;

  const contextMessage =
    context === "visit"
      ? "Para agendar uma visita, você precisa estar logado."
      : "Para fazer uma proposta, você precisa estar logado.";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const endpoint = isLoginTab ? "/api/v1/auth/login" : "/api/v1/auth/register";
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: isLoginTab
          ? { "Content-Type": "application/x-www-form-urlencoded" }
          : { "Content-Type": "application/json" },
        body: isLoginTab
          ? new URLSearchParams({ username: email, password })
          : JSON.stringify({ email, password, nome, perfil }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail = data.detail;
        if (Array.isArray(detail)) {
          throw new Error(detail.map((e: { msg?: string }) => e.msg ?? String(e)).join("; "));
        }
        throw new Error(typeof detail === "string" ? detail : "Erro na autenticação");
      }
      const { access_token } = await res.json();
      await login(access_token);
      onAuthSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro inesperado");
    } finally {
      setSubmitting(false);
    }
  };

  const labelCls = "block text-sm font-semibold text-slate-700 mb-1.5";
  const inputCls =
    "w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition bg-white text-slate-800 placeholder:text-slate-400 text-sm";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition text-xl font-bold"
        >
          ×
        </button>

        <div className="p-8">
          <div className="mb-5 text-center">
            <span className="text-3xl font-black text-blue-600 tracking-tighter">BAI.</span>
          </div>

          <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 text-center font-medium">
            {contextMessage}
          </div>

          <div className="flex mb-6 bg-slate-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setIsLoginTab(true)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${
                isLoginTab
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setIsLoginTab(false)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${
                !isLoginTab
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginTab && (
              <div>
                <label className={labelCls}>Nome completo</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  className={inputCls}
                />
              </div>
            )}

            <div>
              <label className={labelCls}>E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                  tabIndex={-1}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {!isLoginTab && (
              <div>
                <label className={labelCls}>Perfil</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["comprador", "corretor"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPerfil(p)}
                      className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition ${
                        perfil === p
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {p === "comprador" ? "Comprador" : "Corretor"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-black py-3 rounded-xl transition mt-2"
            >
              {submitting ? "Aguarde..." : isLoginTab ? "Entrar" : "Criar conta"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
