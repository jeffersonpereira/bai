"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Spinner from "@/app/components/ui/Spinner";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

// ─── Ícone olho (password toggle) ────────────────────────────────
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

// ─── Tipos de perfil disponíveis no cadastro ──────────────────────
const profileOptions = [
  { value: "user",   label: "Comprador / Proprietário", desc: "Busque, salve imóveis ou anuncie os seus de forma autônoma" },
  { value: "broker", label: "Corretor Autônomo",      desc: "Gerencie seus clientes e mandatos" },
  { value: "agency", label: "Imobiliária",            desc: "Controle toda sua equipe" },
];

import { useAuth } from "@/app/context/AuthContext";

// ─── Conteúdo da página (precisa de Suspense por useSearchParams) ─
function LoginContent() {
  const { login, isAuthenticated, user } = useAuth();
  const router      = useRouter();
  const searchParams = useSearchParams();

  const [isLogin,      setIsLogin]      = useState(true);
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [name,         setName]         = useState("");
  const [role,         setRole]         = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState("");
  const [submitting,   setSubmitting]   = useState(false);

  useEffect(() => {
    setIsLogin(searchParams.get("mode") !== "register");
  }, [searchParams]);

  // Redireciona se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirect = searchParams.get("redirect");
      if (redirect && redirect.startsWith("/")) {
        router.push(redirect);
        return;
      }
      if (user.role === "admin") router.push("/dashboard/admin");
      else if (user.role === "agency" || user.role === "broker") router.push("/dashboard/agency");
      else router.push("/dashboard/buyer");
    }
  }, [isAuthenticated, user, router, searchParams]);

  // Limpa o erro ao trocar de modo
  useEffect(() => { setError(""); }, [isLogin]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const endpoint = isLogin ? "/api/v1/auth/login" : "/api/v1/auth/register";

      const res = await fetch(`${API}${endpoint}`, {
        method:  "POST",
        headers: isLogin
          ? { "Content-Type": "application/x-www-form-urlencoded" }
          : { "Content-Type": "application/json" },
        body: isLogin
          ? new URLSearchParams({ username: email, password })
          : JSON.stringify({ email, password, name, role }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // 422: Pydantic retorna detail como array de objetos
        const detail = data.detail;
        if (Array.isArray(detail)) {
          const msg = detail.map((e: any) => e.msg ?? String(e)).join("; ");
          throw new Error(msg);
        }
        throw new Error(typeof detail === "string" ? detail : "Erro na autenticação");
      }

      const { access_token } = await res.json();
      await login(access_token);
      // O useEffect acima tratará o redirecionamento baseado no role
    } catch (err: any) {
      setError(err.message ?? "Ocorreu um erro inesperado");
    } finally {
      setSubmitting(false);
    }
  };

  const labelCls = "block text-sm font-semibold text-slate-700 mb-1.5";
  const inputCls =
    "w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition bg-white text-slate-800 placeholder:text-slate-400 text-sm";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {/* Logo + título */}
          <div className="mb-7 text-center">
            <span className="text-3xl font-black text-blue-600 tracking-tighter">BAI.</span>
            <h1 className="text-xl font-bold text-slate-900 mt-4">
              {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {isLogin ? "Acesse sua conta para continuar" : "Junte-se à Plataforma BAI"}
            </p>
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl animate-fade-in"
            >
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Campos exclusivos do cadastro */}
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="name" className={labelCls}>Nome completo</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoComplete="name"
                    className={inputCls}
                    placeholder="João Silva"
                  />
                </div>

                {/* Seleção de tipo de perfil */}
                <div>
                  <label className={labelCls}>Tipo de perfil</label>
                  <div className="grid gap-2">
                    {profileOptions.map(opt => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          role === opt.value
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={opt.value}
                          checked={role === opt.value}
                          onChange={() => setRole(opt.value)}
                          className="mt-0.5 accent-blue-600"
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                          <p className="text-xs text-slate-400">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* E-mail */}
            <div>
              <label htmlFor="email" className={labelCls}>E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={inputCls}
                placeholder="seu@email.com"
              />
            </div>

            {/* Senha com toggle de visibilidade */}
            <div>
              <label htmlFor="password" className={labelCls}>Senha</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className={`${inputCls} pr-11`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-slate-400 mt-1.5">Mínimo de 8 caracteres recomendado.</p>
              )}
            </div>

            {/* Botão submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl transition-all text-sm text-white mt-1 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 shadow-sm shadow-blue-100"
            >
              {submitting && <Spinner size="sm" />}
              {submitting
                ? isLogin ? "Entrando…" : "Criando conta…"
                : isLogin ? "Entrar" : "Criar conta"}
            </button>
          </form>

          {/* Trocar modo */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-sm text-slate-500">
            {isLogin ? "Ainda não tem uma conta?" : "Já possui uma conta?"}{" "}
            <button
              onClick={() => setIsLogin(v => !v)}
              className="text-blue-600 font-semibold hover:underline"
            >
              {isLogin ? "Cadastre-se" : "Faça login"}
            </button>
          </div>
        </div>

        {/* Nota de segurança */}
        <p className="mt-5 text-center text-xs text-slate-400">
          Ao continuar, você concorda com os{" "}
          <span className="underline cursor-default">Termos de Uso</span> da plataforma BAI.
        </p>
      </div>
    </div>
  );
}

// ─── Export com Suspense ──────────────────────────────────────────
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Spinner size="lg" />
            <span className="text-sm">Carregando…</span>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
