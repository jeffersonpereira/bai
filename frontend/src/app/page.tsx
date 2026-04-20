import Link from "next/link";
import PropertyCard from "./components/PropertyCard";
import EmptyState from "./components/ui/EmptyState";
import Script from "next/script";

async function getLatestProperties() {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001"}/api/v1/properties/?limit=6`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

// ─── Ícones ───────────────────────────────────────────────────────
const Icons = {
  WhatsApp: () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  Buyer: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  Owner: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  ),
  Pro: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4 text-blue-600 mr-2 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
};

const features = [
  {
    title: "Algoritmo de IA Avançado",
    desc: "Nossa inteligência entende exatamente o que você busca, sugerindo apenas imóveis com alto match de perfil.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    )
  },
  {
    title: "Rede de Confiança",
    desc: "Proprietários e corretores verificados. Zero anúncios duplicados, zero perda de tempo.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.746 3.746 0 01-3.296 1.043A3.746 3.746 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.746 3.746 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    )
  },
  {
    title: "Dados em Tempo Real",
    desc: "Acesso direto a tendências de precificação, metro quadrado e valorização de mercado.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    )
  },
];

// ─── Página ───────────────────────────────────────────────────────
export default async function Home() {
  const latestProperties = await getLatestProperties();

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: "85vh" }}
        aria-label="Hero — Busca de imóveis"
      >
        {/* Background com sobreposição refinada */}
        <div className="absolute inset-0 bg-slate-900" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Interior elegante de imóvel"
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900/95" />
        </div>

        <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center text-center gap-8 py-24">
          {/* Tagline Marketing */}
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-900/40 border border-emerald-500/30 px-5 py-2 rounded-full backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            O Ecossistema Imobiliário Descomplicado
          </span>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
            O jeito mais inteligente <br className="hidden md:block"/>
            de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">conectar imóveis</span> e pessoas
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-3xl font-light leading-relaxed">
            Seja para encontrar o lar ideal, vender seu patrimônio sem estresse 
            ou escalar os resultados da sua imobiliária: o BAI reúne tudo em uma experiência fluida.
          </p>

          {/* Barra de busca unificada */}
          <div className="w-full max-w-3xl mt-4">
            <form
              action="/search"
              role="search"
              aria-label="Buscar imóveis"
              className="flex flex-col sm:flex-row gap-3 bg-white/10 border border-white/20 rounded-2xl p-3 backdrop-blur-xl shadow-2xl"
            >
              <input
                type="text"
                name="city"
                placeholder="Ex: São Paulo"
                aria-label="Cidade"
                className="flex-1 px-5 py-4 rounded-xl bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400 font-medium text-base"
              />
              <input
                type="text"
                name="neighborhood"
                placeholder="Bairro (opcional)"
                aria-label="Bairro"
                className="flex-1 px-5 py-4 rounded-xl bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400 font-medium text-base"
              />
              <button
                type="submit"
                className="px-8 h-[56px] bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap text-base min-w-[140px]"
              >
                Buscar Agora
              </button>
            </form>
            
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 text-sm text-slate-300 font-medium">
              <span className="flex items-center gap-1.5"><Icons.Check /> Sem anúncios falsos</span>
              <span className="flex items-center gap-1.5"><Icons.Check /> Contato direto</span>
              <span className="flex items-center gap-1.5"><Icons.Check /> Dados 100% verificados</span>
              <span className="flex items-center gap-1.5 text-emerald-400"><Icons.WhatsApp /> Contato via WhatsApp instantâneo</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Prova Social ─────────────────────────────────────── */}
      <section className="bg-white py-20 border-b border-slate-100" aria-labelledby="social-proof-title">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 md:gap-12 text-center mb-16">
            <div>
              <p className="text-4xl md:text-5xl font-extrabold text-blue-600">5.000+</p>
              <p className="text-slate-500 mt-2 text-sm md:text-base font-medium">Imóveis cadastrados</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-extrabold text-blue-600">1.200+</p>
              <p className="text-slate-500 mt-2 text-sm md:text-base font-medium">Corretores verificados</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-extrabold text-blue-600">R$ 2bi+</p>
              <p className="text-slate-500 mt-2 text-sm md:text-base font-medium">Em negócios realizados</p>
            </div>
          </div>

          {/* Depoimentos */}
          <div className="text-center mb-10">
            <h2 id="social-proof-title" className="text-2xl md:text-3xl font-extrabold text-slate-900">
              O que dizem quem já usou
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Comprador */}
            <div className="bg-slate-50 rounded-2xl p-7 border border-slate-100 flex flex-col gap-4">
              <div className="flex gap-1 text-amber-400">
                {Array(5).fill(0).map((_, i) => (
                  <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                ))}
              </div>
              <p className="text-slate-700 leading-relaxed text-sm italic">
                "Encontrei meu apartamento em São Paulo em menos de uma semana. Os filtros são precisos e não tem anúncio duplicado como nos outros portais. Processo todo sem estresse."
              </p>
              <div className="mt-auto flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">RC</div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Rafael Costa</p>
                  <p className="text-slate-400 text-xs">Comprador · São Paulo, SP</p>
                </div>
              </div>
            </div>

            {/* Proprietário */}
            <div className="bg-slate-50 rounded-2xl p-7 border border-slate-100 flex flex-col gap-4">
              <div className="flex gap-1 text-amber-400">
                {Array(5).fill(0).map((_, i) => (
                  <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                ))}
              </div>
              <p className="text-slate-700 leading-relaxed text-sm italic">
                "Anunciei minha casa e em dois dias já tinha três propostas sérias. A plataforma filtra curiosos — só chegam compradores com perfil real. Vendi 8% acima do que esperava."
              </p>
              <div className="mt-auto flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">AM</div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Ana Martins</p>
                  <p className="text-slate-400 text-xs">Proprietária · Campinas, SP</p>
                </div>
              </div>
            </div>

            {/* Corretor */}
            <div className="bg-slate-50 rounded-2xl p-7 border border-slate-100 flex flex-col gap-4">
              <div className="flex gap-1 text-amber-400">
                {Array(5).fill(0).map((_, i) => (
                  <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                ))}
              </div>
              <p className="text-slate-700 leading-relaxed text-sm italic">
                "Como corretor independente, o CRM integrado mudou minha operação. Centralizo todos os leads, acompanho o funil e consigo atender três vezes mais clientes com a mesma equipe."
              </p>
              <div className="mt-auto flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">LS</div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Lucas Souza</p>
                  <p className="text-slate-400 text-xs">Corretor CRECI · Belo Horizonte, MG</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Segmentação de Públicos (A essência do Marketing) ─── */}
      <section className="bg-white py-24" aria-labelledby="personas-title">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 id="personas-title" className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Feito para o <span className="text-blue-600">seu momento</span>
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed">
              Diferente dos portais tradicionais, o BAI adapta suas ferramentas para entregar valor real dependendo de qual lado da negociação você está.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Compradores */}
            <div className="group bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 flex flex-col h-full">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm mb-6 border border-slate-100 group-hover:scale-110 transition-transform">
                <Icons.Buyer />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Para quem Busca</h3>
              <p className="text-slate-600 mb-8 leading-relaxed flex-1">
                Filtre o ruído. Encontre seu novo lar ou investimento com buscas precisas, alertas em tempo real e agendamentos com um clique.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm font-medium tracking-tight text-slate-700"><Icons.Check /> Descoberta via Inteligência Artificial</li>
                <li className="flex items-center text-sm font-medium tracking-tight text-slate-700"><Icons.Check /> Comunicação direta com o anunciante</li>
                <li className="flex items-center text-sm font-medium tracking-tight text-slate-700"><Icons.Check /> Organização de favoritos em pastas</li>
                <li className="flex items-center text-sm font-medium tracking-tight text-emerald-600 gap-1.5"><Icons.WhatsApp /> WhatsApp direto com o anunciante</li>
              </ul>
              <Link href="/search" className="inline-block w-full py-3.5 px-4 bg-white text-blue-600 font-bold border-2 border-blue-100 hover:border-blue-600 rounded-xl text-center transition-colors">
                Explorar Imóveis
              </Link>
            </div>

            {/* Proprietários */}
            <div className="group bg-blue-600 rounded-3xl p-8 border border-blue-500 hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-300 flex flex-col h-full relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none translate-x-4 -translate-y-4">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
              </div>
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-sm mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                <Icons.Owner />
              </div>
              <h3 className="text-2xl font-bold mb-3">Para Proprietários</h3>
              <p className="text-blue-100 mb-8 leading-relaxed flex-1">
                Coloque seu imóvel na vitrine certa. Anuncie com autonomia e conecte-se a compradores reais e parceiros imobiliários.
              </p>
              <ul className="space-y-3 mb-8 text-blue-50">
                <li className="flex items-center text-sm font-medium tracking-tight"><Icons.Check /> Anúncio direto, rápido e intuitivo</li>
                <li className="flex items-center text-sm font-medium tracking-tight"><Icons.Check /> Avaliação baseada no mercado local</li>
                <li className="flex items-center text-sm font-medium tracking-tight"><Icons.Check /> Maior capilaridade de alcance</li>
                <li className="flex items-center gap-1.5 text-sm font-medium tracking-tight text-emerald-300"><Icons.WhatsApp /> Receba contatos via WhatsApp</li>
              </ul>
              <Link href="/login?mode=register&role=user" className="inline-block w-full py-3.5 px-4 bg-white text-blue-700 font-bold border-2 border-transparent hover:bg-blue-50 rounded-xl text-center transition-colors">
                Anunciar meu Imóvel
              </Link>
            </div>

            {/* Corretores / Agências */}
            <div className="group bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 flex flex-col h-full">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm mb-6 border border-slate-100 group-hover:scale-110 transition-transform">
                <Icons.Pro />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Para Profissionais</h3>
              <p className="text-slate-600 mb-8 leading-relaxed flex-1">
                Uma central de comando para a sua operação. Centralize leads, gerencie corretores associados e multiplique seus negócios.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm font-medium tracking-tight text-slate-700"><Icons.Check /> CRM Integrado para gestão de Leads</li>
                <li className="flex items-center text-sm font-medium tracking-tight text-slate-700"><Icons.Check /> Metrificação de acessos e conversão</li>
                <li className="flex items-center text-sm font-medium tracking-tight text-slate-700"><Icons.Check /> Painel Multi-corretor para agências</li>
                <li className="flex items-center gap-1.5 text-sm font-medium tracking-tight text-emerald-600"><Icons.WhatsApp /> Notificações de leads por WhatsApp</li>
              </ul>
              <Link href="/login?mode=register&role=agency" className="inline-block w-full py-3.5 px-4 bg-white text-blue-600 font-bold border-2 border-blue-100 hover:border-blue-600 rounded-xl text-center transition-colors">
                Conhecer Soluções Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Como Funciona ─────────────────────────────────────── */}
      <section className="bg-slate-50 py-24 border-b border-slate-100" aria-labelledby="como-funciona-title">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-bold tracking-wider text-sm uppercase mb-3 block">Simples assim</span>
            <h2 id="como-funciona-title" className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
              Como Funciona
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Linha conectora (desktop) */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200" aria-hidden="true" />

            {/* Etapa 1 */}
            <div className="flex flex-col items-center text-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
                  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-emerald-400 text-white text-xs font-extrabold flex items-center justify-center shadow-md">1</span>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">Cadastre-se gratuitamente</h3>
                <p className="text-slate-500 leading-relaxed text-sm">Crie sua conta em menos de um minuto, sem cartão de crédito e sem burocracia.</p>
              </div>
            </div>

            {/* Etapa 2 */}
            <div className="flex flex-col items-center text-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
                  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-emerald-400 text-white text-xs font-extrabold flex items-center justify-center shadow-md">2</span>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">Defina seu perfil</h3>
                <p className="text-slate-500 leading-relaxed text-sm">Escolha se você é comprador, proprietário ou profissional. A plataforma adapta as ferramentas ao seu momento.</p>
              </div>
            </div>

            {/* Etapa 3 */}
            <div className="flex flex-col items-center text-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
                  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-emerald-400 text-white text-xs font-extrabold flex items-center justify-center shadow-md">3</span>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">Conecte-se e feche negócios</h3>
                <p className="text-slate-500 leading-relaxed text-sm">Comunique-se diretamente via chat ou WhatsApp. Sem intermediários, sem complicação.</p>
              </div>
            </div>
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/login?mode=register"
              className="inline-flex items-center gap-2 px-8 h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] text-base"
            >
              Começar agora — é grátis
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Diferenciais (Feature Highlight) ──────────────────── */}
      <section className="bg-slate-900 py-24 text-white" aria-labelledby="features-title">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-blue-400 font-bold tracking-wider text-sm uppercase mb-3 block">Tecnologia ao seu Favor</span>
              <h2 id="features-title" className="text-3xl md:text-4xl font-extrabold mb-6 leading-tight text-white">
                O Fim da Busca Frustrante
              </h2>
              <p className="text-slate-300 mb-10 text-lg leading-relaxed">
                Nossa arquitetura prioriza velocidade e precisão. Removemos anúncios duplicados e desatualizados para você enxergar apenas o que realmente está disponível no mercado, agilizando seu processo de decisão.
              </p>
              
              <div className="space-y-8">
                {features.map((item, i) => (
                  <div key={i} className="flex gap-5">
                    <div className="shrink-0 w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-blue-400">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                      <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-emerald-400 rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
              <div className="relative bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl">
                 <img
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                  alt="Dashboard Platform"
                  className="rounded-2xl w-full h-[500px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Vitrine: Adicionados Recentemente ─────────────────── */}
      <section className="bg-slate-50 py-24" aria-labelledby="recent-title">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-5">
            <div>
              <span className="text-blue-600 font-bold tracking-wider text-sm uppercase mb-2 block">Vitrine</span>
              <h2 id="recent-title" className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
                Em Destaque Agora
              </h2>
              <p className="text-slate-500 text-lg">
                As melhores oportunidades filtradas e auditadas em tempo real.
              </p>
            </div>
            <Link
              href="/search"
              className="shrink-0 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-full hover:border-slate-300 hover:shadow-sm transition-all flex items-center gap-2 group"
            >
              Explorar todas as ofertas
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {latestProperties.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              }
              title="A vitrine está sendo preparada"
              description="Nosso algoritmo está buscando as melhores opções do mercado para exibir aqui."
              action={
                <Link href="/search" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors">
                  Fazer busca manual
                </Link>
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestProperties.map((imovel: any) => (
                <PropertyCard key={imovel.id} imovel={imovel} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Final de Conversão ────────────────────────────── */}
      <section className="relative py-24 overflow-hidden bg-blue-600" aria-label="Chamada para ação">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-500 opacity-90 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        
        <div className="relative z-10 container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            Pronto para transformar sua experiência imobiliária?
          </h2>
          <p className="text-blue-100 mb-10 text-xl leading-relaxed">
            Seja você comprador, proprietário ou corretor, o BAI foi desenhado para maximizar seus resultados. Junte-se à nossa comunidade hoje.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login?mode=register"
              className="px-8 h-[56px] flex items-center justify-center bg-white text-blue-600 font-extrabold rounded-full hover:bg-slate-50 transition-colors shadow-xl shadow-blue-900/20 text-lg min-w-[220px]"
            >
              Criar Conta Grátis
            </Link>
            <Link
              href="/search"
              className="px-8 h-[56px] flex items-center justify-center bg-transparent text-white font-bold rounded-full hover:bg-white/10 transition-colors border-2 border-white/30 text-lg min-w-[220px]"
            >
              Buscar Imóveis
            </Link>
          </div>
          <p className="mt-6 text-blue-200 text-sm">Menos de 1 minuto para se cadastrar • Sem cartão de crédito</p>
        </div>
      </section>

      <Script id="jsonld-organization" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "BAI Plataforma de Imóveis",
        "description": "Marketplace bidirecional do setor imobiliário, conectando compradores, vendedores, corretores e imobiliárias.",
        "url": "https://bai.com.br",
        "logo": "https://bai.com.br/logo.png",
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "availableLanguage": "Portuguese"
        }
      })}} />
    </div>
  );
}
