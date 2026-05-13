"use client";

import { useState } from "react";
import Link from "next/link";

interface Perfil {
  id: number;
  nome: string | null;
  perfil: string;
  creci: string | null;
  telefone: string | null;
  bio: string | null;
  foto_perfil_url: string | null;
  cor_primaria: string;
  cor_secundaria: string;
  redes_sociais: Record<string, string> | null;
  tipo_plano: string | null;
}

interface Imovel {
  id: number;
  titulo: string;
  preco: number;
  valor_aluguel: number | null;
  area: number | null;
  quartos: number | null;
  banheiros: number | null;
  vagas: number | null;
  cidade: string | null;
  bairro: string | null;
  estado: string | null;
  tipo_oferta: string | null;
  tipo_imovel: string | null;
  url_imagem: string | null;
  destaque: boolean | null;
  total_visualizacoes: number | null;
}

interface LandingData {
  perfil: Perfil;
  imoveis: Imovel[];
  total_imoveis: number;
}

const TIPO_OFERTA_LABEL: Record<string, string> = {
  venda: "Venda",
  aluguel: "Aluguel",
  temporada: "Temporada",
  ambos: "Venda/Aluguel",
};

const TIPO_IMOVEL_LABEL: Record<string, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  terreno: "Terreno",
  comercial: "Comercial",
  rural: "Rural",
};

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function Initials({ nome, size = "lg" }: { nome: string | null; size?: "lg" | "xl" }) {
  const letters = (nome ?? "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const cls = size === "xl" ? "w-24 h-24 text-3xl" : "w-16 h-16 text-xl";
  return (
    <div className={`${cls} rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-black text-white border-2 border-white/30 shrink-0`}>
      {letters}
    </div>
  );
}

function ImovelCard({ imovel, corPrimaria }: { imovel: Imovel; corPrimaria: string }) {
  return (
    <Link
      href={`/properties/${imovel.id}`}
      className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex flex-col"
    >
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        {imovel.url_imagem ? (
          <img
            src={imovel.url_imagem}
            alt={imovel.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
        {imovel.destaque && (
          <span
            className="absolute top-3 left-3 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{ backgroundColor: corPrimaria }}
          >
            Destaque
          </span>
        )}
        <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
          {TIPO_OFERTA_LABEL[imovel.tipo_oferta ?? ""] ?? imovel.tipo_oferta}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          {TIPO_IMOVEL_LABEL[imovel.tipo_imovel ?? ""] ?? imovel.tipo_imovel}
        </p>
        <h3 className="text-sm font-bold text-slate-900 line-clamp-2 mb-2 leading-snug flex-1">
          {imovel.titulo}
        </h3>

        {(imovel.cidade || imovel.bairro) && (
          <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {[imovel.bairro, imovel.cidade, imovel.estado].filter(Boolean).join(", ")}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
          {imovel.quartos != null && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {imovel.quartos} qts
            </span>
          )}
          {imovel.banheiros != null && (
            <span>{imovel.banheiros} ban</span>
          )}
          {imovel.area != null && (
            <span>{imovel.area} m²</span>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100">
          <p className="text-base font-black" style={{ color: corPrimaria }}>
            {imovel.tipo_oferta === "aluguel" && imovel.valor_aluguel
              ? formatPrice(imovel.valor_aluguel) + "/mês"
              : formatPrice(imovel.preco)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function LandingPageClient({ data }: { data: LandingData }) {
  const { perfil, imoveis } = data;
  const corPrimaria = perfil.cor_primaria || "#1d4ed8";
  const corSecundaria = perfil.cor_secundaria || "#1e293b";
  const tipoLabel = perfil.perfil === "imobiliaria" ? "Imobiliária" : "Corretor de Imóveis";

  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [filtroOferta, setFiltroOferta] = useState<string>("");

  const imovelsFiltrados = imoveis.filter((im) => {
    if (filtroTipo && im.tipo_imovel !== filtroTipo) return false;
    if (filtroOferta && im.tipo_oferta !== filtroOferta) return false;
    return true;
  });

  const whatsappNumero = perfil.redes_sociais?.whatsapp ?? perfil.telefone;
  const whatsappLink = whatsappNumero
    ? `https://wa.me/55${whatsappNumero.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${perfil.nome}, vi seu perfil no BAI e gostaria de mais informações!`)}`
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header com identidade visual personalizada */}
      <header
        className="relative overflow-hidden"
        style={{ backgroundColor: corSecundaria }}
      >
        {/* Padrão decorativo de fundo */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, ${corPrimaria} 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${corPrimaria} 0%, transparent 40%)`,
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar / Logo */}
            {perfil.foto_perfil_url ? (
              <img
                src={perfil.foto_perfil_url}
                alt={perfil.nome ?? ""}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-white/30 shrink-0"
              />
            ) : (
              <Initials nome={perfil.nome} size="xl" />
            )}

            <div className="flex-1 min-w-0">
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">
                {tipoLabel}
                {perfil.tipo_plano === "premium" && (
                  <span className="ml-2 bg-yellow-400 text-yellow-900 text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase">Premium</span>
                )}
              </p>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-1">
                {perfil.nome}
              </h1>
              {perfil.creci && (
                <p className="text-white/50 text-sm font-medium">CRECI: {perfil.creci}</p>
              )}
              {perfil.bio && (
                <p className="mt-3 text-white/80 text-sm leading-relaxed max-w-xl">{perfil.bio}</p>
              )}

              {/* CTAs de contato */}
              <div className="flex flex-wrap gap-2 mt-4">
                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all"
                    style={{ backgroundColor: corPrimaria, color: "#fff" }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </a>
                )}
                {perfil.telefone && !whatsappLink && (
                  <a
                    href={`tel:${perfil.telefone}`}
                    className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl bg-white/15 text-white hover:bg-white/25 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {perfil.telefone}
                  </a>
                )}
                {perfil.redes_sociais?.instagram && (
                  <a
                    href={`https://instagram.com/${perfil.redes_sociais.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl bg-white/15 text-white hover:bg-white/25 transition-all"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    Instagram
                  </a>
                )}
                {perfil.redes_sociais?.site && (
                  <a
                    href={perfil.redes_sociais.site}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl bg-white/15 text-white hover:bg-white/25 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Site
                  </a>
                )}
              </div>
            </div>

            {/* Estatística */}
            <div className="shrink-0 text-center bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
              <p className="text-3xl font-black text-white">{data.total_imoveis}</p>
              <p className="text-white/60 text-xs font-semibold mt-0.5">imóveis ativos</p>
            </div>
          </div>
        </div>
      </header>

      {/* Barra de filtros */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-slate-500 mr-1">Filtrar:</span>

          <select
            value={filtroOferta}
            onChange={(e) => setFiltroOferta(e.target.value)}
            className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ "--tw-ring-color": corPrimaria } as React.CSSProperties}
          >
            <option value="">Todas as ofertas</option>
            <option value="venda">Venda</option>
            <option value="aluguel">Aluguel</option>
            <option value="temporada">Temporada</option>
          </select>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2"
          >
            <option value="">Todos os tipos</option>
            <option value="apartamento">Apartamento</option>
            <option value="casa">Casa</option>
            <option value="terreno">Terreno</option>
            <option value="comercial">Comercial</option>
            <option value="rural">Rural</option>
          </select>

          {(filtroTipo || filtroOferta) && (
            <button
              onClick={() => { setFiltroTipo(""); setFiltroOferta(""); }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100 transition"
            >
              Limpar filtros
            </button>
          )}

          <span className="ml-auto text-xs text-slate-400 font-medium">
            {imovelsFiltrados.length} imóvel{imovelsFiltrados.length !== 1 ? "is" : ""}
          </span>
        </div>
      </div>

      {/* Grid de imóveis */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {imovelsFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-slate-500 font-semibold">Nenhum imóvel encontrado com esses filtros</p>
            <button
              onClick={() => { setFiltroTipo(""); setFiltroOferta(""); }}
              className="mt-3 text-sm font-semibold underline"
              style={{ color: corPrimaria }}
            >
              Ver todos os imóveis
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {imovelsFiltrados.map((imovel) => (
              <ImovelCard key={imovel.id} imovel={imovel} corPrimaria={corPrimaria} />
            ))}
          </div>
        )}
      </main>

      {/* Footer da landing */}
      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            Página de divulgação de <span className="font-semibold text-slate-600">{perfil.nome}</span>
          </p>
          <Link href="/" className="text-xs font-bold text-slate-400 hover:text-slate-700 transition">
            Powered by <span style={{ color: corPrimaria }}>BAI</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
