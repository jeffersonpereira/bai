"use client";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import Spinner from "./ui/Spinner";

// ─── Ícones SVG inline (sem dependência extra) ────────────────────
const Icons = {
  heart: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  target: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  ),
  chart: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  home: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  settings: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  logout: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  refresh: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  chevronDown: (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  menu: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

// ─── Tipos ────────────────────────────────────────────────────────
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const roleLabels: Record<string, string> = {
  admin:  "Administrador",
  agency: "Imobiliária",
  broker: "Corretor",
  user:   "Comprador",
};

import { useAuth } from "../context/AuthContext";

// ─── Componente ───────────────────────────────────────────────────
export default function Header() {
  const { user, loading, logout, token } = useAuth();
  const [menuOpen, setMenuOpen]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScraping, setIsScraping] = useState(false);

  const dropdownRef   = useRef<HTMLDivElement>(null);
  const mobileNavRef  = useRef<HTMLDivElement>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Fecha menu mobile ao redimensionar para desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) setMobileOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Bloqueia scroll do body quando menu mobile está aberto
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleScrape = useCallback(async () => {
    setIsScraping(true);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001"}/api/v1/properties/scrape`,
        { method: "POST", headers: { Authorization: `Bearer ${token ?? ""}` } }
      );
    } finally {
      setIsScraping(false);
    }
  }, [token]);

  const dashboardHref =
    user?.role === "admin"
      ? "/dashboard/admin"
      : user?.role === "agency" || user?.role === "broker"
      ? "/dashboard/agency"
      : "/dashboard/buyer";

  const closeAll = () => {
    setMenuOpen(false);
    setMobileOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/90 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 max-w-7xl">

          {/* ── Logo ───────────────────────────────────────────── */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="font-black text-2xl text-blue-600 tracking-tighter hover:opacity-80 transition-opacity"
              aria-label="BAI — Página inicial"
            >
              BAI.
            </Link>

            {/* Nav desktop */}
            <nav aria-label="Navegação principal" className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-500">
              <Link href="/"       className="hover:text-slate-900 transition-colors">Início</Link>
              <Link href="/search" className="hover:text-slate-900 transition-colors">Buscar Imóveis</Link>

              {user?.role === "agency" && (
                <Link href="/dashboard/agency" className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
                  Minha Central
                </Link>
              )}
              {user?.role === "broker" && (
                <Link href="/dashboard/agency" className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
                  Meu Painel
                </Link>
              )}
              {user?.role === "admin" && (
                <Link href="/dashboard/admin" className="text-red-600 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors">
                  Admin
                </Link>
              )}
              {(!user || user.role === "user") && user && (
                <Link href="/dashboard/buyer" className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
                  Para Você
                </Link>
              )}
            </nav>
          </div>

          {/* ── Ações direita ──────────────────────────────────── */}
          <div className="flex items-center gap-3">
            {/* Botão de scraping (admin, desktop) */}
            {user?.role === "admin" && (
              <button
                onClick={handleScrape}
                disabled={isScraping}
                aria-label={isScraping ? "Atualizando base de dados…" : "Atualizar base de dados"}
                className="hidden lg:flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-full hover:bg-slate-200 transition text-slate-600 disabled:opacity-50"
              >
                {isScraping ? <Spinner size="sm" /> : Icons.refresh}
                {isScraping ? "Processando…" : "Atualizar Base"}
              </button>
            )}

            {/* Avatar / login */}
            {loading ? (
              <div aria-hidden="true" className="h-9 w-9 rounded-full skeleton" />
            ) : user ? (
              <div className="flex items-center gap-3">
                {/* CTA Anunciar (desktop) */}
                <Link
                  href={dashboardHref}
                  className="hidden lg:inline-flex items-center px-5 h-11 bg-blue-600 text-white text-sm font-bold rounded-full shadow-sm hover:bg-blue-700 transition-colors active:scale-95"
                >
                  Anunciar Imóvel
                </Link>

                {/* Avatar com dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setMenuOpen(v => !v)}
                    aria-expanded={menuOpen}
                    aria-haspopup="true"
                    aria-label={`Menu do usuário ${user.name}`}
                    className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 pl-1.5 pr-3 h-11 rounded-full transition-all shadow-xs"
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-slate-700 hidden sm:block truncate max-w-[90px]">
                      {user.name.split(" ")[0]}
                    </span>
                    <span className={`text-slate-400 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}>
                      {Icons.chevronDown}
                    </span>
                  </button>

                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-68 bg-white rounded-2xl shadow-md border border-slate-100 py-2 overflow-hidden animate-fade-in z-[100]"
                    >
                      {/* Cabeçalho do menu */}
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 mb-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        <span className="mt-1.5 inline-block text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-100/70 px-2 py-0.5 rounded-full">
                          {roleLabels[user.role] ?? user.role}
                        </span>
                      </div>

                      <MenuLink href="/favorites"              icon={Icons.heart}    onClick={closeAll}>Meus Favoritos</MenuLink>
                      <MenuLink href="/dashboard/buyer/profile" icon={Icons.target}   onClick={closeAll}>Perfil de Busca</MenuLink>

                      {["agency", "broker", "admin"].includes(user.role) && (
                        <>
                          <div className="my-1 border-t border-slate-100 mx-4" />
                          <p className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Acesso Restrito</p>
                          <MenuLink href="/dashboard/agency" icon={Icons.chart}    onClick={closeAll}>Central de Comando</MenuLink>
                          <MenuLink href="/dashboard"        icon={Icons.home}     onClick={closeAll}>Meus Imóveis</MenuLink>
                          <MenuLink href="/dashboard/crm"    icon={Icons.users}    onClick={closeAll}>CRM e Leads</MenuLink>
                          <MenuLink href="/documents"        icon={Icons.settings} onClick={closeAll}>Documentos</MenuLink>
                        </>
                      )}

                      {user.role === "admin" && (
                        <MenuLink href="/dashboard/admin" icon={Icons.settings} onClick={closeAll} danger>
                          Painel Admin
                        </MenuLink>
                      )}

                      <div className="my-1 border-t border-slate-100 mx-4" />
                      <button
                        role="menuitem"
                        onClick={logout}
                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-3"
                      >
                        <span className="text-red-400">{Icons.logout}</span>
                        Sair da Conta
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors hidden sm:block">
                  Entrar
                </Link>
                <Link
                  href="/login?mode=register"
                  className="px-5 h-11 flex justify-center items-center bg-blue-600 text-white text-sm font-bold rounded-full shadow-sm hover:bg-blue-700 transition-colors active:scale-95"
                >
                  Anunciar
                </Link>
              </div>
            )}

            {/* Botão hamburger (mobile) */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {mobileOpen ? Icons.close : Icons.menu}
            </button>
          </div>
        </div>
      </header>

      {/* ── Menu mobile overlay ─────────────────────────────── */}
      {mobileOpen && (
        <div
          id="mobile-nav"
          ref={mobileNavRef}
          className="fixed inset-0 z-40 md:hidden"
          aria-label="Navegação mobile"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Painel lateral */}
          <nav className="absolute top-0 left-0 bottom-0 w-72 bg-white shadow-xl flex flex-col animate-fade-in overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <Link href="/" className="font-black text-xl text-blue-600 tracking-tighter" onClick={closeAll}>
                BAI.
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                {Icons.close}
              </button>
            </div>

            <div className="flex-1 px-4 py-4 space-y-1">
              <MobileLink href="/"       onClick={closeAll}>Início</MobileLink>
              <MobileLink href="/search" onClick={closeAll}>Buscar Imóveis</MobileLink>

              {user && (
                <>
                  <div className="pt-4 pb-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3">Minha Conta</p>
                  </div>
                  <MobileLink href="/favorites"               onClick={closeAll}>Meus Favoritos</MobileLink>
                  <MobileLink href="/dashboard/buyer/profile" onClick={closeAll}>Perfil de Busca</MobileLink>

                  {["agency", "broker", "admin"].includes(user.role) && (
                    <>
                      <div className="pt-4 pb-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3">Profissional</p>
                      </div>
                      <MobileLink href="/dashboard/agency" onClick={closeAll}>Central de Comando</MobileLink>
                      <MobileLink href="/dashboard"        onClick={closeAll}>Meus Imóveis</MobileLink>
                      <MobileLink href="/dashboard/crm"    onClick={closeAll}>CRM e Leads</MobileLink>
                      <MobileLink href="/documents"        onClick={closeAll}>Documentos</MobileLink>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="px-4 py-4 border-t border-slate-100 space-y-2">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    {Icons.logout} Sair da Conta
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={closeAll} className="block w-full text-center px-4 py-2.5 border border-slate-200 text-sm font-bold text-slate-700 rounded-xl hover:bg-slate-50 transition-colors">
                    Entrar
                  </Link>
                  <Link href="/login?mode=register" onClick={closeAll} className="block w-full text-center px-4 py-2.5 bg-blue-600 text-sm font-bold text-white rounded-xl hover:bg-blue-700 transition-colors">
                    Criar Conta
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────
function MenuLink({
  href, icon, onClick, children, danger = false,
}: {
  href: string;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <Link
      role="menuitem"
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
      }`}
    >
      <span className={danger ? "text-red-400" : "text-slate-400"}>{icon}</span>
      {children}
    </Link>
  );
}

function MobileLink({
  href, onClick, children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center px-3 py-2.5 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors"
    >
      {children}
    </Link>
  );
}
